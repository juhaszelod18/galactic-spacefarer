using SpacefarerService as service from '../../srv/spacefarer-service';

annotate service.Spacefarers with {
  ID                      @UI.Hidden;
  stardustCriticality     @UI.Hidden;
  name                    @title: 'Name';
  email                   @title: 'Email';
  stardust                @title: 'Stardust';
  wormholeNavigationSkill @title: 'Wormhole Navigation Skill';
  spacesuitColor          @title: 'Spacesuit Color';
};

annotate service.Spacefarers : originPlanet with @(
  title                          : 'Origin Planet',
  Common.Text                    : (originPlanet.name),
  Common.Text.@UI.TextArrangement: #TextOnly
);

annotate service.Spacefarers : position with @(
  title                          : 'Position',
  Common.Text                    : (position.name),
  Common.Text.@UI.TextArrangement: #TextOnly
);

annotate service.Spacefarers : department with @(
  readonly                       : true,
  title                          : 'Department',
  Common.Text                    : (department.name),
  Common.Text.@UI.TextArrangement: #TextOnly
);

annotate service.Planets with @cds.odata.valuelist;
annotate service.Departments with @cds.odata.valuelist;
annotate service.Positions with @cds.odata.valuelist;

annotate service.Spacefarers with @(
  UI.SelectionFields    : [
    name,
    position_code,
    department_code,
    spacesuitColor,
    stardust
  ],

  UI.LineItem           : [
    {
      Value: name,
      Label: 'Name',
    },
    {Value: position_code},
    {Value: department_code},
    {
      Value      : stardust,
      Criticality: stardustCriticality
    },
    {
      $Type : 'UI.DataFieldForAnnotation',
      Target: '@UI.DataPoint#Skill',
      Label : 'Wormhole Navigation Skill'
    },
    {Value: spacesuitColor},
  ],

  UI.PresentationVariant: {
    SortOrder     : [{
      Property  : stardust,
      Descending: true
    }],
    Visualizations: ['@UI.LineItem']
  }
);


annotate service.Spacefarers with @(
  UI.HeaderInfo          : {
    TypeName      : 'Spacefarer',
    TypeNamePlural: 'Spacefarers',
    Title         : {Value: name},
    Description   : {Value: position.name}
  },

  UI.DataPoint #Stardust : {
    Value      : stardust,
    Title      : 'Stardust',
    Criticality: stardustCriticality
  },

  UI.DataPoint #Skill    : {
    Value        : wormholeNavigationSkill,
    Title        : 'Wormhole Navigation Skill',
    Visualization: #Progress,
    TargetValue  : 10
  },

  UI.HeaderFacets        : [
    {
      $Type : 'UI.ReferenceFacet',
      Target: '@UI.DataPoint#Stardust'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Target: '@UI.DataPoint#Skill'
    }
  ],

  UI.Facets              : [
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'Identity',
      Label : 'Identity',
      Target: '@UI.FieldGroup#Identity'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'Cosmic',
      Label : 'Cosmic Profile',
      Target: '@UI.FieldGroup#Cosmic'
    }
  ],

  UI.FieldGroup #Identity: {Data: [
    {Value: name},
    {Value: email},
    {Value: originPlanet_code},
    {Value: position_code},
    {Value: department_code}
  ]},

  UI.FieldGroup #Cosmic  : {Data: [
    {Value: stardust},
    {Value: wormholeNavigationSkill},
    {Value: spacesuitColor}
  ]}
);
