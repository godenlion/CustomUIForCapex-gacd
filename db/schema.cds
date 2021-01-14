namespace sap.bpm.capexdatamodel;
using { managed } from '@sap/cds/common';

  entity InvestmentTypes : managed {
    key ID      : UUID    @(Core.Computed : true);
    type        : String(100) not null;
    lang        : String(5) not null;
    text        : String(100) not null;
  }

  entity Countries : managed {
    key ID      : UUID    @(Core.Computed : true);
    code        : String(10) not null;
    lang        : String(5) not null;
    text        : String(100) not null;
  }

  entity Currencies : managed {
    key ID      : UUID    @(Core.Computed : true);
    code        : String(10) not null;
    lang        : String(5) not null;
    text        : String(100) not null;
  }

  entity Divisions : managed {
    key ID      : UUID    @(Core.Computed : true);
    code        : String(10) not null;
    lang        : String(5) not null;
    text        : String(100) not null;
  }

