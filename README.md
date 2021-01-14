# Capital Expenditure Approval Process using SAP Cloud Platform Workflow Management
## Overview
The CAPEX process enables customers to automate capital expenditure request approvals and provide automation across all steps. A request is created by the user and depending on the amount of investment and other related attributes, number of approval steps are determined.  The following steps are included as a part of this CAPEX process:
- Business user creates a Capital Expenditure Approval Process request
- Approvers are determined using decisions
- Approvers are notified via email
- Approvers have three decision options (Approve, Reject, Request Rework), and based on the decision, the next approval step will be created or requested for a rework or the approval request will be terminated.
- Acceptance from all Approvers will send a notification to the requestor and complete the process.
## Pre-Requisites
The following SAP Cloud Platform services are required for this scenario:
  - Application Runtime
  - SAP Cloud Platform Workflow management
  - SAP Cloud Platform Portal
  - SAP Cloud Platform Document Management Service, Integration option
  - SAP HANA Cloud
  - SAP Cloud Platform Identity Authentication Service (optional)
  
A service instance with name **"Workflow"** of SAP Cloud Platform Workflow with the following scopes:
  - WORKFLOW_INSTANCE_START

## CustomUIForCapex
This project contains custom HTML5 apps as well as FLP and CAP modules which are required for capital expenditure request creation and for the approval process. 

To enable users to manage and/or view data in HANA please assign **ValueHelpViewer** and **ValueHelpManager** roles to the relevant users in SAP Cloud Platform Cockpit.

Please note that during deployment of the project those resources will be processed:
  - Destination service with the name *Destination* (will be created, if not existent);
  - Workflow Management service with the name *WorkflowMgmt* (will be created, if not existent);
  - Process Visibility service with the name *ProcessVisibility* (will be created, if not existent);
  - Workflow service with the name *Workflow* (you should have created the service instance with this name);
  - Business Rules service with the name *BusinessRulesInternal* (will be created, if not existent);
  
If you have previously created these service instances with the different names and would like to reuse them in this project, please modify mta.yaml file accordingly.

## Build and Deploy Multi Target Applications

### Capital Expenditure Approval Process - Custom UIs
1. Unzip CustomUIForCapex.zip under the folder Custom UI into your local folder
2. Import the project into SAP Business Application Studio.
3. [Build the project and deploy the archive](https://help.sap.com/viewer/9d1db9835307451daa8c930fbd9ab264/Cloud/en-US/97ef204c568c4496917139cee61224a6.html)  to your cloud platform account.

### Document Approval Process - Visibility Actions
1. Unzip VisibilityActionsCapex.zip under the folder Visibility Actions into your local folder
2. Import the project into SAP Business Application Studio.
3. [Build the project and deploy the archive](https://help.sap.com/viewer/9d1db9835307451daa8c930fbd9ab264/Cloud/en-US/97ef204c568c4496917139cee61224a6.html)  to your cloud platform account
