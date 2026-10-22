using {SpacefarerService} from './spacefarer-service';

annotate SpacefarerService.Spacefarers with {
  originPlanet @mandatory;
  position     @assert.target;
};
