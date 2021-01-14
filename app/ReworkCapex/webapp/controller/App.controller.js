sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/m/BusyDialog",
    "sap/m/MessagePopover",
    "sap/m/MessageItem",
    "sap/m/Token",
    "sap/m/Label",
    "sap/m/ColumnListItem",
    "sap/m/SearchField",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/commons/FileUploaderParameter",
    "sap/m/UploadCollectionParameter",
    "sap/ui/comp/filterbar/FilterBar",
    "sap/ui/comp/filterbar/FilterGroupItem",
    "sap/m/Input",
], function (BaseController, JSONModel, MessageBox, MessageToast, DateFormat, BusyDialog, MessagePopover, MessageItem, Token, Label, ColumnListItem, SearchField,
    Filter, FilterOperator, FileUploaderParameter, UploadCollectionParameter, FilterBar, FilterGroupItem, Input) {
    "use strict";
    var token;

    return BaseController.extend("com.sap.bpm.ReworkCapex.controller.App", {

        onInit: function () {
            var oMdlCommon = this.getParentModel("mCommon");
            this.setModel(oMdlCommon, "mCommon");

            // get locale of logged in user
            var sLangCode = sap.ui.getCore().getConfiguration().getLanguage().substring(0, 2).toUpperCase();
            oMdlCommon.setProperty("/sLangCode", sLangCode);

            this.configureView();

            // document service interaction
            this.oAttachmentsModel = new JSONModel();
            this.setModel(this.oAttachmentsModel, "attachmentsModel");
            this.loadAttachments();

            this.getContentDensityClass();
        },

        configureView: function () {

            var startupParameters = this.getComponentData().startupParameters;
            var sendForApprovalButtonText = this.getMessage("SEND_FOR_APPROVAL");

            var model = this.getModel();
            var sTitle = model.getProperty("/Title");
            var oMdlCommon = this.getParentModel("mCommon");
            oMdlCommon.setProperty("/sReworkTitle", this.getMessage("REWORK_TITLE") + " " + sTitle);

            var oThisController = this;

            /**
             * SEND FOR APPROVAL BUTTON
             */
            // Implementation for the send for approval action
            var oSendForApproval = {
                sBtnTxt: sendForApprovalButtonText,
                onBtnPressed: function () {
                    model.refresh(true);
                    var processContext = model.getData();

                    // Call a local method to perform further action
                    oThisController.onPressRequestApproval(
                        processContext,
                        startupParameters.taskModel.getData().InstanceID,
                        "reworked"
                    );
                }
            };

            // Add 'Send for Approve' action to the task
            startupParameters.inboxAPI.addAction({
                // confirm is a positive action
                action: oSendForApproval.sBtnTxt,
                label: oSendForApproval.sBtnTxt,
                type: "Accept"
            },
                // Set the onClick function
                oSendForApproval.onBtnPressed);

        },

        /**
         * Convenience method for all Input validation errors.
         * @public
         * @returns Validate all the required input fields.
         */
        onPressRequestApproval: function (processContext, taskId, approvalStatus) {

            var errorExist = false,
                oThisController = this,
                oMdlCommon = oThisController.getParentModel("mCommon"),
                oModel = oThisController.getModel();

            oThisController.getView().setBusy(true);

            // Checking Requester Fields
            var requesterFields = [
                "FirstName",
                "LastName"
            ];
            var requesterValue;
            for (var i = 0; i < requesterFields.length; i++) {
                requesterValue = oModel.getProperty("/" + "Requester" + "/" + requesterFields[i]);
                if (requesterValue && requesterValue.trim() && requesterValue !== "" && requesterValue !== "undefined" && requesterValue !==
                    "null") {
                    oMdlCommon.setProperty("/" + "oRequesterDetails" + "/" + requesterFields[i] + "State", "None");
                } else {
                    errorExist = true;
                    if (requesterFields[i] === "FirstName") {
                        oMdlCommon.setProperty("/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_FIRST_NAME"));
                    }
                    if (requesterFields[i] === "LastName") {
                        oMdlCommon.setProperty("/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_LAST_NAME"));
                    }
                    oMdlCommon.setProperty("/" + requesterFields[i] + "State", "Error");
                }
            }

            //Checking Title
            var titleValue = oModel.getProperty("/Title");
            if (titleValue && titleValue.trim() && titleValue !== "" && titleValue !== "undefined" && titleValue !== "null") {
                oMdlCommon.setProperty("/sTitleState", "None");
            } else {
                errorExist = true;
                oMdlCommon.setProperty("/sTitleState", "Error");
                oMdlCommon.setProperty("/sTitleStateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_TITLE"));
            }

            // Checking Investment Details Fields
            var investmentDetailsFields = [
                "Type",
                "Country",
                "BusinessUnit",
                "CAPEX",
                "OPEX",
                "TotalCost",
                "Currency"
            ];
            var investmentDetailsValue;
            for (var i = 0; i < investmentDetailsFields.length; i++) {
                investmentDetailsValue = oModel.getProperty("/" + "Investment" + "/" + investmentDetailsFields[i]).toString();
                if (investmentDetailsValue && investmentDetailsValue.trim() && investmentDetailsValue !== "" && investmentDetailsValue !== "undefined" && investmentDetailsValue !==
                    "null") {
                    oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "State", "None");
                } else {
                    errorExist = true;
                    if (investmentDetailsFields[i] === "Type") {
                        oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_TYPE"));
                    }
                    if (investmentDetailsFields[i] === "Country") {
                        oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_COUNTRY"));
                    }
                    if (investmentDetailsFields[i] === "BusinessUnit") {
                        oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_BUSINESS_UNIT"));
                    }
                    if (investmentDetailsFields[i] === "CAPEX") {
                        oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_CAPEX"));
                    }
                    if (investmentDetailsFields[i] === "OPEX") {
                        oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_OPEX"));
                    }
                    if (investmentDetailsFields[i] === "TotalCost") {
                        oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_TOTAL_COST"));
                    }
                    if (investmentDetailsFields[i] === "Currency") {
                        oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_CURRENCY"));
                    }
                    oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "State", "Error");
                }
            }

            if (errorExist) {
                var sGenericErrorText = oThisController.getMessage("FIELD_VALIDATION_ERROR_GENERIC");
                MessageToast.show(sGenericErrorText)
                oThisController.getView().setBusy(false);
                return;
            } else {
                oThisController._triggerComplete(processContext, taskId, approvalStatus);
            }

        },

        // This method is called when the confirm button is click by the end user
        _triggerComplete: function (processContext, taskId, approvalStatus) {

            var oThisController = this;

            this.openBusyDialog();

            var aObjects = oThisController.getModel("attachmentsModel").getData().objects;
            var aAttachments = [];

            if (aObjects && aObjects.length) {
                for (var i = 0; i < aObjects.length; i++) {
                    aAttachments.push({
                        objectId: aObjects[i].object.succinctProperties["cmis:objectId"],
                        name: aObjects[i].object.succinctProperties["cmis:name"],
                    });
                }
            }

            $.ajax({
                // Call workflow API to get the xsrf token
                url: "/comsapbpmReworkCapex/workflowruntime/v1/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (result, xhr, data) {

                    // After retrieving the xsrf token successfully
                    var token = data.getResponseHeader("X-CSRF-Token");

                    // form the context that will be updated
                    var oBasicData = {
                        context: {
                            "Title": processContext.Title,
                            "Requester": processContext.Requester,
                            "Investment": processContext.Investment,
                            "Sustainability": processContext.Sustainability,
                            "Attachments": aAttachments,
                            "comments": processContext.comments,
                            "approvalStatus": approvalStatus
                        },
                        "status": "COMPLETED"
                    };

                    $.ajax({
                        // Call workflow API to complete the task
                        url: "/comsapbpmReworkCapex/workflowruntime/v1/task-instances/" + taskId,
                        method: "PATCH",
                        contentType: "application/json",
                        // pass the updated context to the API
                        data: JSON.stringify(oBasicData),
                        headers: {
                            // pass the xsrf token retrieved earlier
                            "X-CSRF-Token": token
                        },
                        // refreshTask needs to be called on successful completion
                        success: function (result, xhr, data) {
                            oThisController._refreshTask();
                            oThisController.closeBusyDialog();
                        }

                    });
                }
            });

        },

        // Request Inbox to refresh the control once the task is completed
        _refreshTask: function () {
            var taskId = this.getComponentData().startupParameters.taskModel.getData().InstanceID;
            this.getComponentData().startupParameters.inboxAPI.updateTask("NA", taskId);
            console.log("task is refreshed");
        },

        /*
        * DOCUMENT SERVICE INTERACTIONS
        */
        loadAttachments: function () {
            // get workflow instance ID
            var workflowInstanceId = this.getModel("taskInstanceModel").getData().workflowInstanceId;

            var sAttachmentsUploadURL = "/comsapbpmReworkCapex/docservice/WorkflowManagement/CapitalExpenditureRequestsManagement/"
                + workflowInstanceId + "/";

            var oUploadCollection = this.byId("UploadCollection");
            oUploadCollection.setUploadUrl(sAttachmentsUploadURL);
            console.log("Upload URL: " + sAttachmentsUploadURL);

            var sUrl = sAttachmentsUploadURL + "?succinct=true";
            var oSettings = {
                "url": sUrl,
                "method": "GET",
                // "async": false
                "headers": {
                    "ContentType": 'application/json',
                    "Accept": 'application/json',
                    "cache": false,
                    'X-CSRF-Token': 'Fetch'
                }
            };

            var oThisController = this;

            $.ajax(oSettings)
                .done(function (results, textStatus, request) {
                    token = request.getResponseHeader('X-Csrf-Token');
                    oThisController._mapAttachmentsModel(results);
                    oUploadCollection.setBusy(false);
                })
                .fail(function (err) {
                    if (err !== undefined) {
                        var oErrorResponse = $.parseJSON(err.responseText);
                        MessageToast.show(oErrorResponse.message, {
                            duration: 6000
                        });
                    } else {
                        MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                    }
                });
        },

        // assign data to attachments model
        _mapAttachmentsModel: function (data) {
            this.oAttachmentsModel.setData(data);
            this.oAttachmentsModel.refresh();
        },

        // set parameters that are rendered as a hidden input field and used in ajax requests
        onAttachmentsChange: function (oEvent) {
            var oUploadCollection = oEvent.getSource();

            var cmisActionHiddenFormParam = new UploadCollectionParameter({
                name: "cmisAction",
                value: "createDocument" // create file
            });
            oUploadCollection.addParameter(cmisActionHiddenFormParam);

            var objectTypeIdHiddenFormParam1 = new UploadCollectionParameter({
                name: "propertyId[0]",
                value: "cmis:objectTypeId"
            });
            oUploadCollection.addParameter(objectTypeIdHiddenFormParam1);

            var propertyValueHiddenFormParam1 = new UploadCollectionParameter({
                name: "propertyValue[0]",
                value: "cmis:document"
            });
            oUploadCollection.addParameter(propertyValueHiddenFormParam1);

            var objectTypeIdHiddenFormParam2 = new UploadCollectionParameter({
                name: "propertyId[1]",
                value: "cmis:name"
            });
            oUploadCollection.addParameter(objectTypeIdHiddenFormParam2);

            var propertyValueHiddenFormParam2 = new UploadCollectionParameter({
                name: "propertyValue[1]",
                value: oEvent.getParameter("files")[0].name
            });
            oUploadCollection.addParameter(propertyValueHiddenFormParam2);

        },

        // show message when user attempts to attach file with size more than 10 MB
        onFileSizeExceed: function (oEvent) {
            var maxSize = oEvent.getSource().getMaximumFileSize();
            var sFileSizeErrorText = this.getMessage("FILE_SIZE_EXCEEDED_ERROR");
            MessageToast.show(sFileSizeErrorText + " " + maxSize + " MB");
        },

        // set parameters and headers before upload
        onBeforeUploadStarts: function (oEvent) {
            var oUploadCollection = this.getView().byId("UploadCollection"),
                oFileUploader = oUploadCollection._getFileUploader();

            // use multipart content (multipart/form-data) for posting files
            oFileUploader.setUseMultipart(true);

            console.log("Before Upload starts");

            // ad csrf token to header of request
            var oTokenHeader = new UploadCollectionParameter({
                name: "X-CSRF-Token",
                value: token
            });
            oEvent.getParameters().addHeaderParameter(oTokenHeader);

        },

        // refresh attachments collection after file was uploaded
        onUploadComplete: function (oEvent) {

            // workaround to remove busy indicator
            var oUploadCollection = this.byId("UploadCollection"),
                cItems = oUploadCollection.aItems.length,
                i;

            for (i = 0; i < cItems; i++) {
                if (oUploadCollection.aItems[i]._status === "uploading") {
                    oUploadCollection.aItems[i]._percentUploaded = 100;
                    oUploadCollection.aItems[i]._status = oUploadCollection._displayStatus;
                    oUploadCollection._oItemToUpdate = null;
                    break;
                }
            }

            if (oEvent.getParameter("files")[0].status != 201) {
                var response = JSON.parse(oEvent.getParameter("files")[0].responseRaw);
                MessageToast.show(response.message);
            }

            oUploadCollection.getBinding("items").refresh();
            this.loadAttachments();
        },

        // attributes formatting functions
        formatTimestampToDate: function (timestamp) {
            var oFormat = DateFormat.getDateTimeInstance();
            return oFormat.format(new Date(timestamp));
        },

        formatFileLength: function (fileSizeInBytes) {
            var i = -1;
            var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
            do {
                fileSizeInBytes = fileSizeInBytes / 1024;
                i++;
            } while (fileSizeInBytes > 1024);

            return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
        },

        formatDownloadUrl: function (objectId) {
            var oUploadCollection = this.byId("UploadCollection");
            var sAttachmentsUploadURL = oUploadCollection.getUploadUrl();

            return sAttachmentsUploadURL + "?objectId=" + objectId + "&cmisselector=content";
        },

        // delete document from temp folder based on users' input
        onDeletePressed: function (oEvent) {
            var oUploadCollection = this.byId("UploadCollection");
            var sAttachmentsUploadURL = oUploadCollection.getUploadUrl();

            var item = oEvent.getSource().getBindingContext("attachmentsModel").getModel("attachmentsModel")
                .getProperty(oEvent.getSource().getBindingContext("attachmentsModel").getPath());
            var objectId = item.object.succinctProperties["cmis:objectId"];
            var fileName = item.object.succinctProperties["cmis:name"];

            var oThisController = this;

            var oFormData = new window.FormData();
            oFormData.append("cmisAction", "delete");
            oFormData.append("objectId", objectId);

            var oSettings = {
                "url": sAttachmentsUploadURL,
                "method": "POST",
                "async": false,
                "data": oFormData,
                "cache": false,
                "contentType": false,
                "processData": false,
                "headers": {
                    'X-CSRF-Token': token
                }
            };

            $.ajax(oSettings)
                .done(function (results) {
                    MessageToast.show("File '" + fileName + "' is deleted");
                })
                .fail(function (err) {
                    if (err !== undefined) {
                        var oErrorResponse = $.parseJSON(err.responseText);
                        MessageToast.show(oErrorResponse.message, {
                            duration: 6000
                        });
                    } else {
                        MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                    }
                });

            this.loadAttachments();

        },

        /**
        * VALUE HELP / CAP MODEL INTEGRATION
        */

        onValueHelpRequested: function (oEvent) {
            var sInputField = oEvent.getSource().data().inputCustomData;

            if (sInputField === "aCountryValueHelpType") {
                var oMdlCommon = this.getParentModel("mCommon");
                var aCols = oMdlCommon.getData().oCountryValueHelpType.cols;
                this.onCallCAPService(aCols, sInputField, "Countries");
            } else if (sInputField === "aInvestmentTypeValueHelpType") {
                var oMdlCommon = this.getParentModel("mCommon");
                var aCols = oMdlCommon.getData().oInvestmentTypeValueHelpType.cols;
                this.onCallCAPService(aCols, sInputField, "InvestmentTypes");
            } else if (sInputField === "aDivisionValueHelpType") {
                var oMdlCommon = this.getParentModel("mCommon");
                var aCols = oMdlCommon.getData().oDivisionValueHelpType.cols;
                this.onCallCAPService(aCols, sInputField, "Divisions");
            } else if (sInputField === "aCurrencyValueHelpType") {
                var oMdlCommon = this.getParentModel("mCommon");
                var aCols = oMdlCommon.getData().oCurrencyValueHelpType.cols;
                this.onCallCAPService(aCols, sInputField, "Currencies");
            }
        },

        onCallCAPService: function (oColumns, sInputName, CAPModule) {
            var oThisController = this;

            var oMdlCommon = oThisController.getParentModel("mCommon");
            oThisController.selectedInput = oMdlCommon.setProperty("/sSelectedInput", sInputName);
            oMdlCommon.setProperty("/" + sInputName, []);

            var oView = oThisController.getView();
            oView.setBusy(true);

            var sLang = oMdlCommon.getProperty("/sLangCode")
            var sUrl = "/comsapbpmReworkCapex/service/capexdatamodel/" + CAPModule + "?$filter=lang eq '" + sLang + "'";
            var oSettings = {
                "url": sUrl,
                "method": "GET"
            };

            $.ajax(oSettings)
                .done(function (result1, xhr1, data1) {
                    oMdlCommon.setProperty("/usingDefaultLang", false);
                    oView.setBusy(false);

                    var oInputData = "/" + sInputName;
                    oMdlCommon.setProperty(oInputData, result1.value);

                    if (result1.value.length > 0) {
                        oThisController.fnCreateFragment(oMdlCommon, oColumns, oInputData);
                    } else {
                        // Retry with default language
                        var sUrlRetry = "/comsapbpmReworkCapex/service/capexdatamodel/" + CAPModule + "?$filter=lang eq '" + oMdlCommon.getProperty("/sDefaultLang") + "'";
                        var oSettingsRetry = {
                            "url": sUrlRetry,
                            "method": "GET"
                        };
                        $.ajax(oSettingsRetry)
                            .done(function (result1, xhr1, data1) {
                                oView.setBusy(false);

                                var oInputData = "/" + sInputName;
                                oMdlCommon.setProperty(oInputData, result1.value);

                                if (result1.value.length > 0) {
                                    oMdlCommon.setProperty("/usingDefaultLang", true);
                                    oThisController.fnCreateFragment(oMdlCommon, oColumns, oInputData);
                                } else {
                                    var sErrorText = oThisController.getMessage("VALUE_HELP_GET_DATA_ERROR_DEF_LANG");
                                    var sContactAdmin = oThisController.getMessage("CONTACT_ADMIN");
                                    MessageToast.show(sErrorText + oMdlCommon.getProperty("/sDefaultLangName") + sContactAdmin);
                                }
                            })
                            .fail(function (err) {
                                oView.setBusy(false);
                                if (err !== undefined) {
                                    var oErrorResponse = $.parseJSON(err.responseText);
                                    MessageToast.show(oErrorResponse.message, {
                                        duration: 6000
                                    });
                                } else {
                                    MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                                }
                            });
                    }
                })
                .fail(function (err) {
                    oView.setBusy(false);
                    if (err !== undefined) {
                        var oErrorResponse = $.parseJSON(err.responseText);
                        MessageToast.show(oErrorResponse.message, {
                            duration: 6000
                        });
                    } else {
                        MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                    }
                });

        },

        fnCreateFragment: function (oMdlCommon, oColumns, oInputData) {

            this._oBasicSearchField = new SearchField({
                showSearchButton: false
            });

            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = sap.ui.xmlfragment("com.sap.bpm.ReworkCapex.view.BusinessValueHelp", this);
                this.getView().addDependent(this._oValueHelpDialog);
            }

            var oThisController = this;
            var oFilterBar = new FilterBar("businessValueHelpFilterBar", {
                search: function () {
                    oThisController.onFilterBarSearch();
                }
            });
            oFilterBar.setFilterBarExpanded(false);
            oFilterBar.setBasicSearch(this._oBasicSearchField);
            oFilterBar.setAdvancedMode(true);

            var sSelectedInput = oMdlCommon.getProperty("/sSelectedInput");
            if (sSelectedInput === "aCountryValueHelpType") {
                oMdlCommon = this.getParentModel("mCommon");
                oMdlCommon.setProperty("/oDialog/sFilterLabel", oThisController.getMessage("COUNTRY"));
                oMdlCommon.setProperty("/oDialog/sDialogDes", "text");
                oMdlCommon.setProperty("/oDialog/sDialogKey", "code");
                oMdlCommon.setProperty("/oDialog/sTitle", oThisController.getMessage("COUNTRIES"));

                var oCountriesFilterGroupItemCode = new FilterGroupItem({
                    groupName: "Countries",
                    name: "code",
                    label: oThisController.getMessage("CODE"),
                    visibleInFilterBar: true,
                    control: new Input("filterBarCodeIntput", {
                        name: "code"
                    })
                });
                oFilterBar.addFilterGroupItem(oCountriesFilterGroupItemCode);

                var oCountriesFilterGroupItemName = new FilterGroupItem({
                    groupName: "Countries",
                    name: "name",
                    label: oThisController.getMessage("NAME"),
                    visibleInFilterBar: true,
                    control: new Input("filterBarNameIntput", {
                        name: "name"
                    })
                });
                oFilterBar.addFilterGroupItem(oCountriesFilterGroupItemName);
            } else if (sSelectedInput === "aInvestmentTypeValueHelpType") {
                oMdlCommon = this.getParentModel("mCommon");
                oMdlCommon.setProperty("/oDialog/sFilterLabel", oThisController.getMessage("INVESTMENT_TYPE"));
                oMdlCommon.setProperty("/oDialog/sDialogDes", "text");
                oMdlCommon.setProperty("/oDialog/sDialogKey", "type");
                oMdlCommon.setProperty("/oDialog/sTitle", oThisController.getMessage("INVESTMENT_TYPES"));

                var oCountriesFilterGroupItemCode = new FilterGroupItem({
                    groupName: "Investment Types",
                    name: "type",
                    label: oThisController.getMessage("TYPE"),
                    visibleInFilterBar: true,
                    control: new Input("filterBarTypeIntput", {
                        name: "type"
                    })
                });
                oFilterBar.addFilterGroupItem(oCountriesFilterGroupItemCode);

                var oCountriesFilterGroupItemName = new FilterGroupItem({
                    groupName: "Investment Types",
                    name: "name",
                    label: oThisController.getMessage("NAME"),
                    visibleInFilterBar: true,
                    control: new Input("filterBarNameIntputIT", {
                        name: "name"
                    })
                });
                oFilterBar.addFilterGroupItem(oCountriesFilterGroupItemName);
            } else if (sSelectedInput === "aDivisionValueHelpType") {
                oMdlCommon = this.getParentModel("mCommon");
                oMdlCommon.setProperty("/oDialog/sFilterLabel", oThisController.getMessage("BUSINESS_UNIT"));
                oMdlCommon.setProperty("/oDialog/sDialogDes", "text");
                oMdlCommon.setProperty("/oDialog/sDialogKey", "code");
                oMdlCommon.setProperty("/oDialog/sTitle", oThisController.getMessage("BUSINESS_UNITS"));

                var oCountriesFilterGroupItemCode = new FilterGroupItem({
                    groupName: "Divisions",
                    name: "code",
                    label: oThisController.getMessage("CODE"),
                    visibleInFilterBar: true,
                    control: new Input("filterBarCodeIntputD", {
                        name: "code"
                    })
                });
                oFilterBar.addFilterGroupItem(oCountriesFilterGroupItemCode);

                var oCountriesFilterGroupItemName = new FilterGroupItem({
                    groupName: "Divisions",
                    name: "name",
                    label: oThisController.getMessage("NAME"),
                    visibleInFilterBar: true,
                    control: new Input("filterBarNameIntputD", {
                        name: "name"
                    })
                });
                oFilterBar.addFilterGroupItem(oCountriesFilterGroupItemName);

            } else if (sSelectedInput === "aCurrencyValueHelpType") {
                oMdlCommon = this.getParentModel("mCommon");
                oMdlCommon.setProperty("/oDialog/sFilterLabel", oThisController.getMessage("CURRENCY"));
                oMdlCommon.setProperty("/oDialog/sDialogDes", "text");
                oMdlCommon.setProperty("/oDialog/sDialogKey", "code");
                oMdlCommon.setProperty("/oDialog/sTitle", oThisController.getMessage("CURRENCIES"));

                var oCountriesFilterGroupItemCode = new FilterGroupItem({
                    groupName: "Currencies",
                    name: "code",
                    label: oThisController.getMessage("CODE"),
                    visibleInFilterBar: true,
                    control: new Input("filterBarCodeIntputCur", {
                        name: "code"
                    })
                });
                oFilterBar.addFilterGroupItem(oCountriesFilterGroupItemCode);

                var oCountriesFilterGroupItemName = new FilterGroupItem({
                    groupName: "Currencies",
                    name: "name",
                    label: oThisController.getMessage("NAME"),
                    visibleInFilterBar: true,
                    control: new Input("filterBarNameIntputCur", {
                        name: "name"
                    })
                });
                oFilterBar.addFilterGroupItem(oCountriesFilterGroupItemName);
            }

            this._oValueHelpDialog.setFilterBar(oFilterBar);

            // Binding  Data to the Table 
            this._oValueHelpDialog.getTableAsync().then(function (oTable) {
                oTable.setModel(oMdlCommon);

                var oNewModel = new JSONModel();
                oNewModel.setData({
                    cols: oColumns
                });
                oTable.setModel(oNewModel, "columns");

                if (oTable.bindRows) {
                    oTable.bindAggregation("rows", oInputData);
                }

                if (oTable.bindItems) {

                    oTable.bindAggregation("items", oInputData, function () {
                        return new ColumnListItem({
                            cells: oColumns.map(function (column) {
                                return new Label({
                                    text: "{" + column.template + "}"
                                });
                            })
                        });
                    });
                }
                this._oValueHelpDialog.update();
            }.bind(this));
            this.closeBusyDialog();
            this._oValueHelpDialog.open();

        },

        onValueHelpOkPress: function (oEvent) {

            var oMdlCommon = this.getParentModel("mCommon");
            var oModel = this.getModel();
            var aTokens = oEvent.getParameter("tokens");
            var sSelectedInput = oMdlCommon.getProperty("/sSelectedInput");
            var aCustomData = aTokens[0].getAggregation("customData");
            var oSelectedRowData;


            for (var i = 0; i < aCustomData.length; i++) {
                if (aCustomData[i].getKey() == "row") {
                    oSelectedRowData = aCustomData[i].getValue()
                    break;
                }
            }

            if (sSelectedInput === "aCountryValueHelpType") {
                oModel.setProperty("/Investment/CountryCode", aTokens[0].getKey());
                oModel.setProperty("/Investment/Country", oSelectedRowData.text);

                var errorExist = oMdlCommon.getProperty("/CountryState");
                if (errorExist === "Error") {
                    oMdlCommon.setProperty("/CountryState", "None");
                    oMdlCommon.setProperty("/CountryStateText", "");

                }
            } else if (sSelectedInput === "aInvestmentTypeValueHelpType") {
                oModel.setProperty("/Investment/TypeCode", aTokens[0].getKey());
                oModel.setProperty("/Investment/Type", oSelectedRowData.text);

                var errorExist = oMdlCommon.getProperty("/TypeState");
                if (errorExist === "Error") {
                    oMdlCommon.setProperty("/TypeState", "None");
                    oMdlCommon.setProperty("/TypeStateText", "");
                }

            } else if (sSelectedInput === "aDivisionValueHelpType") {
                oModel.setProperty("/Investment/BusinessUnitCode", aTokens[0].getKey());
                oModel.setProperty("/Investment/BusinessUnit", oSelectedRowData.text);

                var errorExist = oMdlCommon.getProperty("/BusinessUnitState");

                if (errorExist === "Error") {
                    oMdlCommon.setProperty("/BusinessUnitState", "None");
                    oMdlCommon.setProperty("/BusinessUnitStateText", "");
                }

            } else if (sSelectedInput === "aCurrencyValueHelpType") {
                oModel.setProperty("/Investment/CurrencyCode", aTokens[0].getKey());
                oModel.setProperty("/Investment/Currency", oSelectedRowData.text);

                var errorExist = oMdlCommon.getProperty("/sCurrencyState");
                if (errorExist === "Error") {
                    oMdlCommon.setProperty("/sCurrencyState", "None");
                    oMdlCommon.setProperty("/sCurrencyStateText", "");
                }

            }

            this._oValueHelpDialog.close();
        },

        onValueHelpCancelPress: function () {
            this._oValueHelpDialog.close();
        },

        onValueHelpAfterClose: function () {
            var oThisController = this;
            var oMdlCommon = oThisController.getParentModel("mCommon");
            if (this._oValueHelpDialog) {
                this._oValueHelpDialog.destroy();
                this._oValueHelpDialog = null; // make it falsy so that it can be created next time
            }
            oMdlCommon.refresh();
        },

        onFilterBarSearch: function (oEvent) {
            var sSearchQuery = this._oBasicSearchField.getValue(),
                aSelectionSet = sap.ui.getCore().byId("businessValueHelpFilterBar")._retrieveCurrentSelectionSet();

            var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }

                return aResult;
            }, []);

            aFilters.push(new Filter({
                filters: [
                    new Filter({
                        path: "code",
                        operator: FilterOperator.Contains,
                        value1: sSearchQuery
                    }),
                    new Filter({
                        path: "text",
                        operator: FilterOperator.Contains,
                        value1: sSearchQuery
                    })
                ],
                and: false
            }));

            this._filterTable(new Filter({
                filters: aFilters,
                and: true
            }));
        },

        _filterTable: function (oFilter) {
            var oValueHelpDialog = this._oValueHelpDialog;

            oValueHelpDialog.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }

                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                oValueHelpDialog.update();
            });
        },

        onValueHelpAfterOpen: function (oEvent) {
            var oMdlCommon = this.getParentModel("mCommon");
            if (oMdlCommon.getProperty("/usingDefaultLang")) {
                var sErrorText = this.getMessage("VALUE_HELP_GET_DATA_ERROR");
                MessageToast.show(sErrorText + oMdlCommon.getProperty("/sDefaultLangName") + ")");
            }
        },

        /**
         * Convenience method for removing all required Input validation Error.
         * @public
         * @returns Remove errors from value help dialog.
         */
        onChange: function (oEvent) {
            var oThisController = this;
            var oMdlCommon = oThisController.getParentModel("mCommon");
            var oInput = oEvent.getSource();
            if (oInput.getProperty("value").length > 0 && oInput.getProperty("valueState") === "Error") {

                oInput.setProperty("valueState", "None");
                oInput.setProperty("valueStateText", "");
            }

        },


    });
});
