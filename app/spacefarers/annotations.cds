using SpacefarerService as service from '../../srv/spacefarer-service';
annotate service.Spacefarers with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'name',
                Value : name,
            },
            {
                $Type : 'UI.DataField',
                Label : 'email',
                Value : email,
            },
            {
                $Type : 'UI.DataField',
                Label : 'stardust',
                Value : stardust,
            },
            {
                $Type : 'UI.DataField',
                Label : 'wormholeNavigationSkill',
                Value : wormholeNavigationSkill,
            },
            {
                $Type : 'UI.DataField',
                Label : 'spacesuitColor',
                Value : spacesuitColor,
            },
            {
                $Type : 'UI.DataField',
                Label : 'originPlanet_code',
                Value : originPlanet_code,
            },
            {
                $Type : 'UI.DataField',
                Label : 'position_code',
                Value : position_code,
            },
            {
                $Type : 'UI.DataField',
                Label : 'department_code',
                Value : department_code,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'name',
            Value : name,
        },
        {
            $Type : 'UI.DataField',
            Label : 'email',
            Value : email,
        },
        {
            $Type : 'UI.DataField',
            Label : 'stardust',
            Value : stardust,
        },
        {
            $Type : 'UI.DataField',
            Label : 'wormholeNavigationSkill',
            Value : wormholeNavigationSkill,
        },
        {
            $Type : 'UI.DataField',
            Label : 'spacesuitColor',
            Value : spacesuitColor,
        },
    ],
);

