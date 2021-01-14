using CapexDataModelService from './capexdatamodel-service';

annotate CapexDataModelService.InvestmentTypes with {
	ID @(
		UI.Hidden,
		Common: {
		Text: text
		}
	);    
	type    @title: 'Investment Type';
	lang    @title: 'Language';
	text    @title: 'Text';   
}

annotate CapexDataModelService.InvestmentTypes with @(
	UI: {
		HeaderInfo: {
			TypeName: 'Investment Type',
			TypeNamePlural: 'Investment Types'
		},
		SelectionFields: [type, lang],
		LineItem: [
			{Value: ID},
			{Value: type},
			{Value: lang},
			{Value: text}
		],
		Facets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Main', Target: '@UI.FieldGroup#Main'}
		],
		FieldGroup#Main: {
			Data: [
				{Value: ID},
				{Value: type},
				{Value: lang},
				{Value: text}
			]
		}		
	}
) {

}; 

annotate CapexDataModelService.Countries with {
	ID @(
		UI.Hidden,
		Common: {
		Text: text
		}
	);    
	code    @title: 'Country';
	lang    @title: 'Language';
	text    @title: 'Text';   
}

annotate CapexDataModelService.Countries with @(
	UI: {
		HeaderInfo: {
			TypeName: 'Country',
			TypeNamePlural: 'Countries'
		},
		SelectionFields: [code, lang],
		LineItem: [
			{Value: ID},
			{Value: code},
			{Value: lang},
			{Value: text}
		],
		Facets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Main', Target: '@UI.FieldGroup#Main'}
		],
		FieldGroup#Main: {
			Data: [
				{Value: ID},
				{Value: code},
				{Value: lang},
				{Value: text}
			]
		}		
	}
) {

}; 

annotate CapexDataModelService.Currencies with {
	ID @(
		UI.Hidden,
		Common: {
		Text: text
		}
	);    
	type    @title: 'Currency';
	lang    @title: 'Language';
	text    @title: 'Text';   
}

annotate CapexDataModelService.Currencies with @(
	UI: {
		HeaderInfo: {
			TypeName: 'Currency',
			TypeNamePlural: 'Currencies'
		},
		SelectionFields: [type, lang],
		LineItem: [
			{Value: ID},
			{Value: code},
			{Value: lang},
			{Value: text}
		],
		Facets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Main', Target: '@UI.FieldGroup#Main'}
		],
		FieldGroup#Main: {
			Data: [
				{Value: ID},
				{Value: code},
				{Value: lang},
				{Value: text}
			]
		}		
	}
) {

}; 

annotate CapexDataModelService.Divisions with {
	ID @(
		UI.Hidden,
		Common: {
		Text: text
		}
	);    
	code    @title: 'Division';
	lang    @title: 'Language';
	text    @title: 'Text';   
}

annotate CapexDataModelService.Divisions with @(
	UI: {
		HeaderInfo: {
			TypeName: 'Division',
			TypeNamePlural: 'Divisions'
		},
		SelectionFields: [code, lang],
		LineItem: [
			{Value: ID},
			{Value: code},
			{Value: lang},
			{Value: text}
		],
		Facets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Main', Target: '@UI.FieldGroup#Main'}
		],
		FieldGroup#Main: {
			Data: [
				{Value: ID},
				{Value: code},
				{Value: lang},
				{Value: text}
			]
		}		
	}
) {

}; 
