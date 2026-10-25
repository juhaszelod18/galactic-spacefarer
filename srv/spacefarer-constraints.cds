using {SpacefarerService} from './spacefarer-service';

annotate SpacefarerService.Spacefarers with {
  name                    @mandatory;
  email                   @mandatory;
  originPlanet            @mandatory;
  position                @assert.target;
  stardust                @assert.range: [
    0,
    _
  ];
  wormholeNavigationSkill @assert.range: [
    1,
    10
  ];
};
