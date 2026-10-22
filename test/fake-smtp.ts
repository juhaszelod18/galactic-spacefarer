import { SMTPServer } from 'smtp-server';

/**
 * Minimal in-process SMTP server so tests exercise the real nodemailer path
 * without network access. Points the app at itself through the SMTP_* variables.
 */
export async function startFakeSmtp() {
  const messages: string[] = [];

  const server = new SMTPServer({
    authOptional: true,
    disabledCommands: ['STARTTLS', 'AUTH'],
    onData(stream, _session, callback) {
      let raw = '';
      stream.on('data', (chunk) => (raw += chunk));
      stream.on('end', () => {
        messages.push(raw);
        callback();
      });
    },
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.server.address() as { port: number };
  process.env.SMTP_HOST = '127.0.0.1';
  process.env.SMTP_PORT = String(port);
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;

  return { messages, close: () => server.close() };
}
