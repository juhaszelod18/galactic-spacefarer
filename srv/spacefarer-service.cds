using {galactic} from '../db/schema';

service SpacefarerService @(
  path    : '/spacefarers',
  requires: [
    'Cadet',
    'Commander'
  ]
) {

  entity Spacefarers @(restrict: [
    {
      grant: 'READ',
      where: (originPlanet.code = $user.planet)
    },
    {
      grant: [
        'CREATE',
        'UPDATE',
        'DELETE'
      ],
      to   : 'Commander',
      where: (originPlanet.code = $user.planet)
    }
  ])                 as
    projection on galactic.Spacefarers {
      *,
      position.department as department,
      case
        when stardust >= 100
             then 3
        when stardust >= 30
             then 2
        else 1
      end                 as stardustCriticality : Integer
    };

  @readonly
  entity Planets     as projection on galactic.Planets;

  @readonly
  entity Departments as projection on galactic.Departments;

  @readonly
  entity Positions   as projection on galactic.Positions;
}
