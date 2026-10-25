import cds from '@sap/cds';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { startFakeSmtp } from './fake-smtp.ts';

const test = cds.test(import.meta.dirname + '/..');
const { GET, POST, PATCH, DELETE } = test;
test.defaults.validateStatus = () => true;

const as = (user: string) => ({ auth: { username: user, password: user } });
const url = '/spacefarers/Spacefarers';
const ALICE_ID = '11111111-1111-1111-1111-111111111111';
const BOB_ID = '22222222-2222-2222-2222-222222222222';

let smtp: Awaited<ReturnType<typeof startFakeSmtp>>;
beforeAll(async () => {
  smtp = await startFakeSmtp();
});
afterAll(() => smtp.close());

const active = (id: string) => `${url}(ID=${id},IsActiveEntity=true)`;
const draft = (id: string) => `${url}(ID=${id},IsActiveEntity=false)`;

async function createSpacefarer(body: object, user: string) {
  const created = await POST(url, body, as(user));
  if (created.status >= 300) return created;
  return POST(`${draft(created.data.ID)}/draftActivate`, {}, as(user));
}

async function updateSpacefarer(id: string, changes: object, user: string) {
  const edit = await POST(
    `${active(id)}/SpacefarerService.draftEdit`,
    { PreserveChanges: true },
    as(user),
  );
  if (edit.status >= 300) return edit;
  const patched = await PATCH(draft(id), changes, as(user));
  const saved =
    patched.status < 300
      ? await POST(`${draft(id)}/draftActivate`, {}, as(user))
      : patched;
  if (saved.status >= 300) await DELETE(draft(id), as(user));
  return saved;
}

const newSpacefarer = (overrides = {}) => ({
  name: 'Test Farer',
  email: 'test@example.com',
  originPlanet_code: 'EARTH',
  ...overrides,
});

describe('authentication and roles', () => {
  it('rejects anonymous requests', async () => {
    expect((await GET(url)).status).toBe(401);
  });

  it('rejects an authenticated user without a role', async () => {
    expect((await GET(url, as('dave'))).status).toBe(403);
  });

  it('applies the role check to lookup data as well', async () => {
    expect((await GET('/spacefarers/Planets', as('dave'))).status).toBe(403);
    expect((await GET('/spacefarers/Planets')).status).toBe(401);
    expect((await GET('/spacefarers/Planets', as('carol'))).status).toBe(200);
  });

  it('lets a Cadet read but not create', async () => {
    expect((await GET(url, as('carol'))).status).toBe(200);
    expect((await createSpacefarer(newSpacefarer(), 'carol')).status).toBe(403);
  });
});

describe('planet isolation on existing data', () => {
  it("lists only spacefarers from the user's own planet", async () => {
    const alice = await GET(`${url}?$top=100`, as('alice'));
    const bob = await GET(`${url}?$top=100`, as('bob'));
    const planets = (res: {
      data: { value: { originPlanet_code: string }[] };
    }) => new Set(res.data.value.map((s) => s.originPlanet_code));
    expect(planets(alice)).toEqual(new Set(['EARTH']));
    expect(planets(bob)).toEqual(new Set(['MARS']));
    expect(alice.data.value.map((s: { ID: string }) => s.ID)).toContain(
      ALICE_ID,
    );
    expect(bob.data.value.map((s: { ID: string }) => s.ID)).toContain(BOB_ID);
  });

  it('supports sorting, filtering and paging', async () => {
    const top = await GET(`${url}?$orderby=stardust desc&$top=3`, as('alice'));
    const stardust = top.data.value.map(
      (s: { stardust: number }) => s.stardust,
    );
    expect(stardust).toHaveLength(3);
    expect(stardust).toEqual([...stardust].sort((a, b) => b - a));

    const page2 = await GET(`${url}?$orderby=name&$top=5&$skip=5`, as('alice'));
    expect(page2.data.value).toHaveLength(5);

    const rich = await GET(`${url}?$filter=stardust gt 150`, as('alice'));
    expect(
      rich.data.value.every((s: { stardust: number }) => s.stardust > 150),
    ).toBe(true);
  });

  it("hides another planet's spacefarer when read by key", async () => {
    expect((await GET(active(BOB_ID), as('alice'))).status).toBe(404);
  });

  it("forbids changing or deleting another planet's spacefarer", async () => {
    expect(
      (await updateSpacefarer(BOB_ID, { stardust: 999 }, 'alice')).status,
    ).toBe(403);
    expect((await DELETE(active(BOB_ID), as('alice'))).status).toBe(403);
  });
});

describe('planet isolation on written data', () => {
  it("allows creating a spacefarer on the user's own planet", async () => {
    const res = await createSpacefarer(newSpacefarer(), 'alice');
    expect(res.status).toBe(201);
    expect(res.data.originPlanet_code).toBe('EARTH');
  });

  it("pre-fills the user's planet on a new draft", async () => {
    const res = await POST(url, { name: 'Draft Farer' }, as('bob'));
    expect(res.status).toBe(201);
    expect(res.data.originPlanet_code).toBe('MARS');
  });

  it('rejects creating a spacefarer on another planet', async () => {
    const res = await createSpacefarer(
      newSpacefarer({ originPlanet_code: 'MARS' }),
      'alice',
    );
    expect(res.status).toBe(403);
  });

  it('rejects moving a spacefarer to another planet', async () => {
    const res = await updateSpacefarer(
      ALICE_ID,
      { originPlanet_code: 'MARS' },
      'alice',
    );
    expect(res.status).toBe(403);
  });

  it('allows editing stardust and suit color of an own-planet spacefarer', async () => {
    const res = await updateSpacefarer(
      ALICE_ID,
      { stardust: 130, spacesuitColor: 'silver' },
      'alice',
    );
    expect(res.status).toBe(200);
    expect(res.data.stardust).toBe(130);
    expect(res.data.spacesuitColor).toBe('silver');
  });
});

describe('input validation', () => {
  it('requires an origin planet', async () => {
    const created = await POST(url, newSpacefarer(), as('alice'));
    await PATCH(
      draft(created.data.ID),
      { originPlanet_code: null },
      as('alice'),
    );
    const res = await POST(
      `${draft(created.data.ID)}/draftActivate`,
      {},
      as('alice'),
    );
    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('ASSERT_MANDATORY');
  });

  it('rejects removing the origin planet', async () => {
    const res = await updateSpacefarer(
      ALICE_ID,
      { originPlanet_code: null },
      'alice',
    );
    expect(res.status).toBe(400);
  });

  it('rejects a malformed email', async () => {
    const res = await createSpacefarer(
      newSpacefarer({ email: 'not-an-email' }),
      'alice',
    );
    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('ASSERT_FORMAT');
  });

  it('rejects an unknown suit color', async () => {
    const res = await createSpacefarer(
      newSpacefarer({ spacesuitColor: 'purple' }),
      'alice',
    );
    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('ASSERT_ENUM');
  });

  it('rejects an unknown position', async () => {
    const res = await createSpacefarer(
      newSpacefarer({ position_code: 'NOPE' }),
      'alice',
    );
    expect(res.status).toBe(400);
  });
});

describe('validation on edit', () => {
  it('rejects negative stardust when editing', async () => {
    const res = await updateSpacefarer(ALICE_ID, { stardust: -50 }, 'alice');
    expect(res.status).toBe(400);
  });

  it('rejects an out-of-range skill when editing', async () => {
    const res = await updateSpacefarer(
      ALICE_ID,
      { wormholeNavigationSkill: 11 },
      'alice',
    );
    expect(res.status).toBe(400);
  });

  it('rejects an invalid value on a direct update too', async () => {
    const res = await PATCH(active(ALICE_ID), { stardust: -50 }, as('alice'));
    expect(res.status).toBe(400);
  });

  it('requires a name', async () => {
    const res = await createSpacefarer(newSpacefarer({ name: '' }), 'alice');
    expect(res.status).toBe(400);
  });
});

describe('department', () => {
  it('is derived from the position', async () => {
    const res = await GET(
      `${active(ALICE_ID)}?$select=department_code`,
      as('alice'),
    );
    expect(res.data.department_code).toBe('NAV');
  });
});

describe('create handlers', () => {
  it('adds the welcome stardust bonus', async () => {
    const res = await createSpacefarer(newSpacefarer({ stardust: 5 }), 'alice');
    expect(res.status).toBe(201);
    expect(res.data.stardust).toBe(105);
  });

  it('defaults stardust to the bonus when none is given', async () => {
    const res = await createSpacefarer(newSpacefarer(), 'alice');
    expect(res.data.stardust).toBe(100);
  });

  it('rejects negative stardust', async () => {
    const res = await createSpacefarer(
      newSpacefarer({ stardust: -1 }),
      'alice',
    );
    expect(res.status).toBe(400);
  });

  it.each([0, 11])('rejects wormhole navigation skill %i', async (skill) => {
    const res = await createSpacefarer(
      newSpacefarer({ wormholeNavigationSkill: skill }),
      'alice',
    );
    expect(res.status).toBe(400);
  });

  // Mails are sent in the background, so look for one by its recipient
  const mailTo = (address: string) =>
    smtp.messages.find((mail) => mail.includes(`To: ${address}`));
  const noMailTo = async (address: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(mailTo(address)).toBeUndefined();
  };

  it('sends a welcome mail to the new spacefarer', async () => {
    const res = await createSpacefarer(
      newSpacefarer({ name: 'Mail Target', email: 'mail.target@example.com' }),
      'alice',
    );
    expect(res.status).toBe(201);
    await vi.waitFor(() => expect(mailTo('mail.target@example.com')).toBeDefined());
    expect(mailTo('mail.target@example.com')).toContain('Congratulations Mail Target');
  });

  it('does not wait for a slow mail server', async () => {
    smtp.delay(1500);
    const started = Date.now();
    const res = await createSpacefarer(
      newSpacefarer({ email: 'slow@example.com' }),
      'alice',
    );
    expect(res.status).toBe(201);
    expect(Date.now() - started).toBeLessThan(1000);
    await vi.waitFor(() => expect(mailTo('slow@example.com')).toBeDefined(), {
      timeout: 5000,
    });
    smtp.delay(0);
  });

  it('sends no mail when the creation is rejected', async () => {
    await createSpacefarer(
      newSpacefarer({ email: 'rejected@example.com', stardust: -1 }),
      'alice',
    );
    await noMailTo('rejected@example.com');
  });

  describe('around the transaction commit', () => {
    const { INSERT } = cds.ql;
    const srv = () => cds.services.SpacefarerService as cds.ApplicationService;
    const alice = () =>
      new cds.User({ id: 'alice', roles: ['Commander'], attr: { planet: 'EARTH' } });
    const insert = (email: string) =>
      INSERT.into(srv().entities.Spacefarers).entries(newSpacefarer({ email }));

    it('sends the mail once the transaction commits', async () => {
      await srv().tx({ user: alice() }, (tx) => tx.run(insert('committed@example.com')));
      await vi.waitFor(() => expect(mailTo('committed@example.com')).toBeDefined());
    });

    it('sends no mail when the transaction rolls back', async () => {
      await expect(
        srv().tx({ user: alice() }, async (tx) => {
          await tx.run(insert('rolledback@example.com'));
          throw new Error('force rollback');
        }),
      ).rejects.toThrow('force rollback');
      await noMailTo('rolledback@example.com');
    });
  });
});
