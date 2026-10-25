using {
  cuid,
  managed,
  sap.common.CodeList
} from '@sap/cds/common';

namespace galactic;

entity Spacefarers : cuid, managed {
  name                    : String(100) not null;
  email                   : String(255) not null @assert.format: '^[^@\s]+@[^@\s]+\.[^@\s]+$';
  stardust                : Integer default 0;
  wormholeNavigationSkill : Integer default 1;
  spacesuitColor          : Association to SuitColors;
  originPlanet            : Association to Planets;
  position                : Association to Positions;
}

entity SuitColors : CodeList {
  key code : String(20);
}

entity Planets : CodeList {
  key code : String(20);
}

entity Departments : CodeList {
  key code      : String(20);
      positions : Association to many Positions
                    on positions.department = $self;
}

entity Positions : CodeList {
  key code       : String(20);
      department : Association to Departments;
}
