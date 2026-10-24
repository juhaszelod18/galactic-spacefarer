import cds from '@sap/cds';
import { sendWelcomeMail } from './mailer.ts';

const LOG = cds.log('spacefarer');
const WELCOME_BONUS = 100;

export default class SpacefarerService extends cds.ApplicationService {
  init() {
    const { Spacefarers } = this.entities;

    this.before(
      'NEW',
      Spacefarers.drafts as cds.entity,
      (req: cds.Request<{ originPlanet_code?: string }>) => {
        req.data.originPlanet_code ??= req.user.attr.planet;
      },
    );

    this.before(['CREATE', 'UPDATE'], Spacefarers, (req) => {
      const { originPlanet_code } = req.data;
      if (originPlanet_code && originPlanet_code !== req.user.attr.planet) {
        req.reject(403, 'You can only manage spacefarers from your own planet');
      }
    });

    this.before('CREATE', Spacefarers, (req) => {
      const { stardust = 0, wormholeNavigationSkill = 1 } = req.data;
      if (stardust < 0) {
        req.error({
          status: 400,
          message: 'Stardust must not be negative',
          target: 'stardust',
        });
      }
      if (wormholeNavigationSkill < 1 || wormholeNavigationSkill > 10) {
        req.error({
          status: 400,
          message: 'Wormhole navigation skill must be between 1 and 10',
          target: 'wormholeNavigationSkill',
        });
      }
      req.data.stardust = stardust + WELCOME_BONUS;
    });

    this.after('CREATE', Spacefarers, async (_result, req) => {
      try {
        await sendWelcomeMail(req.data);
      } catch (err) {
        LOG.error('Could not send welcome mail', err);
      }
    });

    return super.init();
  }
}
