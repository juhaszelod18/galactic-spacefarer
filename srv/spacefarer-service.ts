import cds from '@sap/cds';

export default class SpacefarerService extends cds.ApplicationService {
  init() {
    const { Spacefarers } = this.entities;

    this.before(['CREATE', 'UPDATE'], Spacefarers, (req) => {
      const { originPlanet_code } = req.data;
      if (originPlanet_code && originPlanet_code !== req.user.attr.planet) {
        req.reject(403, 'You can only manage spacefarers from your own planet');
      }
    });

    return super.init();
  }
}
