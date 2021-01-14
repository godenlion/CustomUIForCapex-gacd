using {sap.bpm.capexdatamodel as my} from '../db/schema';

@path : 'service/capexdatamodel'
service CapexDataModelService {
    entity InvestmentTypes @(restrict : [
    {
        grant : ['READ'],
        to    : ['CapexDataModelViewer']
    },
    {
        grant : ['*'],
        to    : ['CapexDataModelAdmin']
    }
    ]) as projection on my.InvestmentTypes;

    annotate InvestmentTypes with @odata.draft.enabled;

    entity Countries @(restrict : [
    {
        grant : ['READ'],
        to    : ['CapexDataModelViewer']
    },
    {
        grant : ['*'],
        to    : ['CapexDataModelAdmin']
    }
    ]) as projection on my.Countries;

    annotate Countries with @odata.draft.enabled;

    entity Currencies @(restrict : [
    {
        grant : ['READ'],
        to    : ['CapexDataModelViewer']
    },
    {
        grant : ['*'],
        to    : ['CapexDataModelAdmin']
    }
    ]) as projection on my.Currencies;

    annotate Currencies with @odata.draft.enabled;

    entity Divisions @(restrict : [
    {
        grant : ['READ'],
        to    : ['CapexDataModelViewer']
    },
    {
        grant : ['*'],
        to    : ['CapexDataModelAdmin']
    }
    ]) as projection on my.Divisions;

    annotate Divisions with @odata.draft.enabled;

}
