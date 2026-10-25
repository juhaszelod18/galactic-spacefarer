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
      req.data.stardust = (req.data.stardust ?? 0) + WELCOME_BONUS;
    });

    this.after('CREATE', Spacefarers, (_result, req) => {
      req.on('succeeded', () => {
        sendWelcomeMail(req.data).catch((err) =>
          LOG.error('Could not send welcome mail', err),
        );
      });
    });

    return super.init();
  }
}
