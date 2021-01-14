sap.ui.define([
    "./BaseController",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
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
    "sap/ui/core/format/DateFormat",
    "sap/ui/comp/filterbar/FilterBar",
    "sap/ui/comp/filterbar/FilterGroupItem",
    "sap/m/Input",
], function (BaseController, MessageToast, JSONModel, MessageBox, MessagePopover, MessageItem, Token, Label, ColumnListItem, SearchField,
    Filter, FilterOperator, FileUploaderParameter, UploadCollectionParameter, DateFormat, FilterBar, FilterGroupItem, Input) {
    "use strict";

    var tempFolderObjId,
        token;

    return BaseController.extend("com.sap.bpm.StartCapex.controller.ExpenditureRequest", {
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         * @memberOf com.sap.bpm.StartCapex.view.ExpenditureRequest
         */
        onInit: function () {
            var oThisController = this;
            var oMdlCommon = oThisController.getParentModel("mCommon");
            oThisController.getView().setModel(oMdlCommon);

            // get locale of logged in user
            var sLangCode = sap.ui.getCore().getConfiguration().getLanguage().substring(0, 2).toUpperCase();
            oMdlCommon.setProperty("/sLangCode", sLangCode);

            // document service interaction
            this.oAttachmentsModel = new JSONModel();
            this.setModel(this.oAttachmentsModel);

        },
        /**
        * Called when the rendering of the ComponentContainer is completed
        */
        onAfterRendering: function () {
            // check if 'WorkflowManagement' folder exists
            this.checkIfFolderExists("WorkflowManagement");
        },

        /*
        * Called upon desctuction of the View
        */
        onExit: function () {
            var tempFolderName = this.getParentModel("mCommon").getProperty("/oInvestmentDetails/sRequestId");
            // delete temporary folder if it exists
            this.checkIfFolderExists(tempFolderName);
        },

        /*
        * DOCUMENT SERVICE INTERACTIONS
        */
        // check if folder with a given name exists
        checkIfFolderExists: function (folderName) {

            var oUploadCollection = this.byId("UploadCollection");
            oUploadCollection.setBusy(true);
            var responseStatusCode;

            if (folderName == "WorkflowManagement") {
                var sUrl = "/comsapbpmStartCapex/docservice/WorkflowManagement/";
            } else if (folderName == "CapitalExpenditureRequestsManagement") {
                var sUrl = "/comsapbpmStartCapex/docservice/WorkflowManagement/CapitalExpenditureRequestsManagement/";
            } else {
                var sUrl = "/comsapbpmStartCapex/docservice/WorkflowManagement/CapitalExpenditureRequestsManagement/" + folderName + "/";
            }
            var oSettings = {
                "url": sUrl,
                "method": "GET",
                "async": false,
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
                    responseStatusCode = request.status;
                })
                .fail(function (err) {
                    token = err.getResponseHeader('X-Csrf-Token');
                    responseStatusCode = err.status;
                    if (responseStatusCode != 404) {
                        if (err !== undefined) {
                            var oErrorResponse = $.parseJSON(err.responseText);
                            MessageToast.show(oErrorResponse.message, {
                                duration: 6000
                            });
                        } else {
                            MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                        }
                    }
                });

            if (folderName == "WorkflowManagement") {
                if (responseStatusCode == 404) {
                    this.createFolder(folderName);
                } else if (responseStatusCode == 200) {
                    console.log("folder 'root/WorkflowManagement' already exisits");
                    this.checkIfFolderExists("CapitalExpenditureRequestsManagement");
                } else {
                    console.log("something is wrong");
                }
            } else if (folderName == "CapitalExpenditureRequestsManagement") {
                if (responseStatusCode == 404) {
                    this.createFolder(folderName);
                } else if (responseStatusCode == 200) {
                    console.log("folder with a name 'CapitalExpenditureRequestsManagement' already exisits");
                    var tempFolderName = this.getParentModel("mCommon").getProperty("/oInvestmentDetails/sRequestId");
                    this.createFolder(tempFolderName);
                } else {
                    console.log("something is wrong");
                }
            } else {
                if (responseStatusCode == 200) {
                    this.deleteTempFolder();
                } else if (responseStatusCode == 404) {
                    console.log("temporary folder is already deleted");
                } else {
                    console.log("something is wrong");
                }
            }
        },

        // create folder with a given name
        createFolder: function (folderName) {

            var oThisController = this;

            if (folderName == "WorkflowManagement") {
                console.log("creating a folder 'root/WorkflowManagement'");
                var sUrl = "/comsapbpmStartCapex/docservice/";
            } else if (folderName == "CapitalExpenditureRequestsManagement") {
                console.log("creating a folder 'root/WorkflowManagement/CapitalExpenditureRequestsManagement'");
                var sUrl = "/comsapbpmStartCapex/docservice/WorkflowManagement/";
            } else {
                var oUploadCollection = oThisController.byId("UploadCollection");
                var sAttachmentsUploadURL = "/comsapbpmStartCapex/docservice/WorkflowManagement/CapitalExpenditureRequestsManagement/" + folderName + "/";
                oUploadCollection.setUploadUrl(sAttachmentsUploadURL);
                console.log("creating temporary folder with a name '" + folderName + "'");
                var sUrl = "/comsapbpmStartCapex/docservice/WorkflowManagement/CapitalExpenditureRequestsManagement/";
            }

            var oFormData = new window.FormData();
            oFormData.append("cmisAction", "createFolder");
            oFormData.append("succinct", "true");
            oFormData.append("propertyId[0]", "cmis:name");
            oFormData.append("propertyValue[0]", folderName);
            oFormData.append("propertyId[1]", "cmis:objectTypeId");
            oFormData.append("propertyValue[1]", "cmis:folder");

            var oSettings = {
                "url": sUrl,
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
                    if (folderName == "WorkflowManagement") {
                        oThisController.checkIfFolderExists("CapitalExpenditureRequestsManagement");
                    } else if (folderName == "CapitalExpenditureRequestsManagement") {
                        var tempFolderName = oThisController.getParentModel("mCommon").getProperty("/oInvestmentDetails/sRequestId");
                        oThisController.createFolder(tempFolderName);
                    } else {
                        tempFolderObjId = results.succinctProperties["cmis:objectId"];
                        oThisController.loadAttachments();
                    }
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

        loadAttachments: function () {
            var oUploadCollection = this.byId("UploadCollection");
            var sAttachmentsUploadURL = oUploadCollection.getUploadUrl();
            console.log("Upload URL: " + sAttachmentsUploadURL);
            var sUrl = sAttachmentsUploadURL + "?succinct=true";
            var oSettings = {
                "url": sUrl,
                "method": "GET",
                // "async": false
            };

            var oThisController = this;

            $.ajax(oSettings)
                .done(function (results) {
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
            var sAttachmentsUploadURL = this.byId("UploadCollection").getUploadUrl();
            var item = oEvent.getSource().getBindingContext().getModel().getProperty(oEvent.getSource().getBindingContext().getPath());
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

        // delete temp folder (cleanup)
        deleteTempFolder: function () {
            console.log("deleting temporary folder with a objId '" + tempFolderObjId + "'");

            var sUrl = "/comsapbpmStartCapex/docservice/WorkflowManagement/CapitalExpenditureRequestsManagement/";
            var oThisController = this;

            var oFormData = new window.FormData();
            oFormData.append("cmisAction", "deleteTree");
            oFormData.append("objectId", tempFolderObjId);

            var oSettings = {
                "url": sUrl,
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

        // create permanent folder
        createTargetFolder: function (targetFolderName) {
            console.log("creating a permanent folder 'WorkflowManagement/CapitalExpenditureRequestsManagement/" + targetFolderName + "/'");

            var sUrl = "/comsapbpmStartCapex/docservice/WorkflowManagement/CapitalExpenditureRequestsManagement/";

            var oFormData = new window.FormData();
            oFormData.append("cmisAction", "createFolder");
            oFormData.append("succinct", "true");
            oFormData.append("propertyId[0]", "cmis:name");
            oFormData.append("propertyValue[0]", targetFolderName);
            oFormData.append("propertyId[1]", "cmis:objectTypeId");
            oFormData.append("propertyValue[1]", "cmis:folder");

            var oSettings = {
                "url": sUrl,
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

            var oThisController = this;

            $.ajax(oSettings)
                .done(function (results) {
                    var targetFolderId = results.succinctProperties["cmis:objectId"];
                    var oUploadCollection = oThisController.byId("UploadCollection");
                    var sAttachmentsUploadURL = "/comsapbpmStartCapex/docservice/WorkflowManagement/CapitalExpenditureRequestsManagement/" + targetFolderName + "/";
                    oUploadCollection.setUploadUrl(sAttachmentsUploadURL);
                    oThisController.oAttachmentsModel.refresh(true);
                    oThisController.moveFiles(targetFolderId);
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

        // move files from temporary folder to permanent
        moveFiles: function (targetFolderId) {
            var oThisController = this,
                oMdlCommon = oThisController.getParentModel("mCommon"),
                oAttachmentsModel = oThisController.getModel();
            var sUrl = "/comsapbpmStartCapex/docservice/";

            var aObjects = oAttachmentsModel.getData().objects;
            var countMoves = 0;

            for (var i = 0; i < aObjects.length; i++) {
                var oFormData = new window.FormData();
                oFormData.append("cmisAction", "move");
                oFormData.append("objectId", aObjects[i].object.succinctProperties["cmis:objectId"]);
                oFormData.append("sourceFolderId", tempFolderObjId);
                oFormData.append("targetFolderId", targetFolderId);

                var oSettings = {
                    "url": sUrl,
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

                var oThisController = this;

                $.ajax(oSettings)
                    .done(function (results) {
                        console.log("file with id '" + aObjects[i].object.succinctProperties["cmis:objectId"] +
                            "' is moved to permanent folder")
                    })
                    .fail(function (err) {
                        if (err !== undefined) {
                            var oErrorResponse = $.parseJSON(err.responseText);
                            MessageToast.show(oErrorResponse.message, {
                                duration: 6000
                            });
                        } else {
                            ;
                            MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                        }
                    });

                countMoves++;
            }

            if (countMoves == aObjects.length) {
                oThisController.deleteTempFolder();
            }
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
            var sUrl = "/comsapbpmStartCapex/service/capexdatamodel/" + CAPModule + "?$filter=lang eq '" + sLang + "'";
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
                        var sUrlRetry = "/comsapbpmStartCapex/service/capexdatamodel/" + CAPModule + "?$filter=lang eq '" + oMdlCommon.getProperty("/sDefaultLang") + "'";
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
                this._oValueHelpDialog = sap.ui.xmlfragment("com.sap.bpm.StartCapex.view.BusinessValueHelp", this);
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
                oMdlCommon.setProperty("/oInvestmentDetails/sCountryCode", aTokens[0].getKey());
                oMdlCommon.setProperty("/oInvestmentDetails/sCountryName", oSelectedRowData.text);

                var errorExist = oMdlCommon.getProperty("/sCountryNameState");
                if (errorExist === "Error") {
                    oMdlCommon.setProperty("/sCountryNameState", "None");
                    oMdlCommon.setProperty("/sCountryNameStateText", "");

                }
            } else if (sSelectedInput === "aInvestmentTypeValueHelpType") {
                oMdlCommon.setProperty("/oInvestmentDetails/sTypeCode", aTokens[0].getKey());
                oMdlCommon.setProperty("/oInvestmentDetails/sTypeName", oSelectedRowData.text);

                var errorExist = oMdlCommon.getProperty("/sTypeNameState");
                if (errorExist === "Error") {
                    oMdlCommon.setProperty("/sTypeNameState", "None");
                    oMdlCommon.setProperty("/sTypeNameStateText", "");
                }

            } else if (sSelectedInput === "aDivisionValueHelpType") {
                oMdlCommon.setProperty("/oInvestmentDetails/sDivisionCode", aTokens[0].getKey());
                oMdlCommon.setProperty("/oInvestmentDetails/sDivisionName", oSelectedRowData.text);

                var errorExist = oMdlCommon.getProperty("/sDivisionNameState");

                if (errorExist === "Error") {
                    oMdlCommon.setProperty("/sDivisionNameState", "None");
                    oMdlCommon.setProperty("/sDivisionNameStateText", "");
                }

            } else if (sSelectedInput === "aCurrencyValueHelpType") {
                oMdlCommon.setProperty("/oInvestmentDetails/sCurrencyCode", aTokens[0].getKey());
                oMdlCommon.setProperty("/oInvestmentDetails/sCurrencyName", oSelectedRowData.text);

                var errorExist = oMdlCommon.getProperty("/sCurrencyNameState");
                if (errorExist === "Error") {
                    oMdlCommon.setProperty("/sCurrencyNameState", "None");
                    oMdlCommon.setProperty("/sCurrencyNameStateText", "");
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

        /**
         * Convenience method for all Input validation errors.
         * @public
         * @returns Validate all the required input fields.
         */
        onPressRequestApproval: function (oEvent) {

            var errorExist = false,
                oThisController = this,
                oMdlCommon = oThisController.getParentModel("mCommon");

            oThisController.getView().setBusy(true);

            // Checking Requester Fields
            var requesterFields = [
                "sRequesterFirstName",
                "sRequesterLastName",
                "sRequesterEmail",
                "sRequesterUserId"
            ];
            var requesterValue;
            for (var i = 0; i < requesterFields.length; i++) {
                requesterValue = oMdlCommon.getProperty("/" + "oRequesterDetails" + "/" + requesterFields[i]);
                if (requesterValue && requesterValue.trim() && requesterValue !== "" && requesterValue !== "undefined" && requesterValue !==
                    "null") {
                    oMdlCommon.setProperty("/" + requesterFields[i] + "State", "None");
                } else {
                    errorExist = true;
                    if (requesterFields[i] === "sRequesterFirstName") {
                        oMdlCommon.setProperty("/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_FIRST_NAME"));
                    }
                    if (requesterFields[i] === "sRequesterLastName") {
                        oMdlCommon.setProperty("/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_LAST_NAME"));
                    }
                    if (requesterFields[i] === "sRequesterEmail") {
                        oMdlCommon.setProperty("/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_EMAIL"));
                    }
                    if (requesterFields[i] === "sRequesterUserId") {
                        oMdlCommon.setProperty("/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_USER_ID"));
                    }

                    oMdlCommon.setProperty("/" + requesterFields[i] + "State", "Error");

                }
            }

            // Checking Investment Details Fields
            var investmentDetailsFields = [
                "sTitle",
                "sTypeName",
                "sCountryName",
                "sDivisionName",
                "sCapexValue",
                "sOpexValue",
                "sTotalCost",
                "sCurrencyName"
            ];
            var investmentDetailsValue;
            for (var i = 0; i < investmentDetailsFields.length; i++) {
                investmentDetailsValue = oMdlCommon.getProperty("/" + "oInvestmentDetails" + "/" + investmentDetailsFields[i]);
                if (investmentDetailsValue && investmentDetailsValue.trim() && investmentDetailsValue !== "" && investmentDetailsValue !== "undefined" && investmentDetailsValue !==
                    "null") {
                    oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "State", "None");
                } else {
                    errorExist = true;
                    if (investmentDetailsFields[i] === "sTitle") {
                        oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_TITLE"));
                    }
                    if (investmentDetailsFields[i] === "sTypeName") {
                        oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_TYPE"));
                    }
                    if (investmentDetailsFields[i] === "sCountryName") {
                        oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_COUNTRY"));
                    }
                    if (investmentDetailsFields[i] === "sDivisionName") {
                        oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_BUSINESS_UNIT"));
                    }
                    if (investmentDetailsFields[i] === "sCapexValue") {
                        oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_CAPEX"));
                    }
                    if (investmentDetailsFields[i] === "sOpexValue") {
                        oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_OPEX"));
                    }
                    if (investmentDetailsFields[i] === "sTotalCost") {
                        oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_TOTAL_COST"));
                    }
                    if (investmentDetailsFields[i] === "sCurrencyName") {
                        oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_CURRENCY"));
                    }

                    oMdlCommon.setProperty("/" + investmentDetailsFields[i] + "State", "Error");

                }
            }

            // Email Validation
            var requesterEmail = oMdlCommon.getProperty("/oRequesterDetails/sRequesterEmail");

            var mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
            if (requesterEmail && !mailregex.test(requesterEmail)) {
                var invalidReqEmail = oThisController.getMessage("INVALID_EMAIL_ERROR")
                errorExist = true;
                oMdlCommon.setProperty("/sRequesterEmailState", "Error");
                oMdlCommon.setProperty("/sRequesterEmailStateText", invalidReqEmail);
            }

            if (errorExist) {
                var sGenericErrorText = oThisController.getMessage("FIELD_VALIDATION_ERROR_GENERIC");
                MessageToast.show(sGenericErrorText)
                oThisController.getView().setBusy(false);
                return;
            } else {
                this.initiateRequestApprovalProcess();
            }

        },



        /**
        * WORKFLOW SERVICE INTEGRATION
        */
        /**
        * Convenience method for accessing the workflow service.
        * @public
        * @returns start workflow instance.
        */

        initiateRequestApprovalProcess: function () {
            this.getView().setBusy(false);
            // this.fetchToken();
            this.getDefinitionId();
        },

        getDefinitionId: function () {
            // First get the CSRF token
            var oThisController = this;
            var oMdlCommon = oThisController.getParentModel("mCommon");
            var oPayload = {
                "RuleServiceId": "6975efda3dc747c7915b371400328792",
                "RuleServiceRevision": "2008",
                "Vocabulary": [{
                    "Investment": {
                        "TotalCost": Number(oMdlCommon.getProperty("/oInvestmentDetails/sTotalCost")),
                        "CountryCode": oMdlCommon.getProperty("/oInvestmentDetails/sCountryCode"),
                        "BusinessUnitCode": oMdlCommon.getProperty("/oInvestmentDetails/sDivisionCode"),
                        "TypeCode": oMdlCommon.getProperty("/oInvestmentDetails/sTypeCode")
                    }
                }]
            };

            $.ajax({
                url: "/comsapbpmStartCapex/bpmrulesruntime/rules-service/v1/rules/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (result, xhr, data) {
                    var bpmruletoken = data.getResponseHeader("X-CSRF-Token");

                    //Then invoke the business rules service via public API
                    $.ajax({
                        url: "/comsapbpmStartCapex/bpmrulesruntime/rules-service/rest/v2/rule-services",
                        method: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(oPayload),
                        async: false,
                        headers: {
                            "X-CSRF-Token": bpmruletoken
                        },

                        success: function (result1, xhr1, data1) {

                            if (result1.Result.length === 0) {
                                //info: the output from rules will be wrapped in result1 object, you can 
                                // access this json object to get the output variable.
                                MessageBox.warning("DefinitionId is not available.");
                                return;
                            } else {

                                oMdlCommon.setProperty("/sDefinitionId", result1.Result[0].ProcessVariant.ProcessVariant);
                                oThisController.fetchToken();
                            }
                        },
                        error: function (jqXHR, textStatus, errorThrown) {

                            MessageBox.error("Error occurred while accessing Configure Business Rules.");
                            return;
                        }
                    });
                },
                error: function (jqXHR, textStatus, errorThrown) {

                    MessageBox.error("Error occured while fetching Business Rules access token. /n/" + "Error:" + " " + errorThrown);
                    return;
                }
            });
        },

        fetchToken: function () {
            var oThisController = this;
            oThisController.getView().setBusy(true);
            $.ajax({
                url: "/comsapbpmStartCapex/workflowruntime/v1/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (result, xhr, data) {

                    // After retrieving the xsrf token successfully
                    var workflowtoken = data.getResponseHeader("X-CSRF-Token");

                    // Values entered by the user stored in the payload and push to the server.
                    oThisController.startInstance(workflowtoken);

                },
                error: function (jqXHR, textStatus, errorThrown) {

                    //MessageBox.error("Error occurred while fetching work-flow access token.");
                    var sErrorText = oThisController.getMessage("WORKFLOW_ACCESS_TOKEN_ERROR");
                    MessageBox.error(sErrorText + "\n Error:" + errorThrown + ".");
                    oThisController.oBusyDialog.close();
                    return;

                }
            });
        },

        startInstance: function (workflowtoken) {

            var oThisController = this,
                oMdlCommon = oThisController.getParentModel("mCommon"),
                oAttachmentsModel = oThisController.getModel();
            var sUrl = "/comsapbpmStartCapex/workflowruntime/v1/workflow-instances";

            var aObjects = oAttachmentsModel.getData().objects;
            var aAttachments = [];

            for (var i = 0; i < aObjects.length; i++) {
                aAttachments.push({
                    objectId: aObjects[i].object.succinctProperties["cmis:objectId"],
                    name: aObjects[i].object.succinctProperties["cmis:name"],
                });
            }

            var sDefinitionId = oMdlCommon.getProperty("/sDefinitionId");
            var sPayload = {
                "definitionId": sDefinitionId,
                "context": {
                    "RequestId": oMdlCommon.getProperty("/oInvestmentDetails/sRequestId").toString(),
                    "Title": oMdlCommon.getProperty("/oInvestmentDetails/sTitle"),
                    "Requester": {
                        "FirstName": oMdlCommon.getProperty("/oRequesterDetails/sRequesterFirstName"),
                        "LastName": oMdlCommon.getProperty("/oRequesterDetails/sRequesterLastName"),
                        "Email": oMdlCommon.getProperty("/oRequesterDetails/sRequesterEmail"),
                        "UserId": oMdlCommon.getProperty("/oRequesterDetails/sRequesterUserId"),
                        "Comments": oMdlCommon.getProperty("/oRequesterDetails/sRequesterComment")
                    },
                    "Investment": {
                        "TotalCost": Number(oMdlCommon.getProperty("/oInvestmentDetails/sTotalCost")),
                        "Type": oMdlCommon.getProperty("/oInvestmentDetails/sTypeName"),
                        "TypeCode": oMdlCommon.getProperty("/oInvestmentDetails/sTypeCode"),
                        "CAPEX": Number(oMdlCommon.getProperty("/oInvestmentDetails/sCapexValue")),
                        "OPEX": Number(oMdlCommon.getProperty("/oInvestmentDetails/sOpexValue")),
                        "Currency": oMdlCommon.getProperty("/oInvestmentDetails/sCurrencyName"),
                        "CurrencyCode": oMdlCommon.getProperty("/oInvestmentDetails/sCurrencyCode"),
                        "ROI": Number(oMdlCommon.getProperty("/oInvestmentDetails/sROI")),
                        "IRR": Number(oMdlCommon.getProperty("/oInvestmentDetails/sIRR")),
                        "Country": oMdlCommon.getProperty("/oInvestmentDetails/sCountryName"),
                        "CountryCode": oMdlCommon.getProperty("/oInvestmentDetails/sCountryCode"),
                        "BusinessUnit": oMdlCommon.getProperty("/oInvestmentDetails/sDivisionName"),
                        "BusinessUnitCode": oMdlCommon.getProperty("/oInvestmentDetails/sDivisionCode"),
                        "Description": oMdlCommon.getProperty("/oInvestmentDetails/sInvestmentDesc")
                    },
                    "Sustainability": {
                        "EnergyEfficiency": Number(oMdlCommon.getProperty("/oSustainabilityDetails/sEnergyEfficiency")),
                        "CO2Efficiency": Number(oMdlCommon.getProperty("/oSustainabilityDetails/sCO2Efficiency")),
                        "EnergyCostSavings": Number(oMdlCommon.getProperty("/oSustainabilityDetails/sEnergySavings")),
                        "WaterSavings": Number(oMdlCommon.getProperty("/oSustainabilityDetails/sWaterSavings"))
                    },
                    "Attachments": aAttachments,
                    "isTesting": false
                }
            };

            $.ajax({
                url: sUrl,
                method: "POST",
                dataType: "json",
                crossDomain: false,
                contentType: "application/json",
                data: JSON.stringify(sPayload),
                cache: true,
                headers: { // pass the xsrf token retrieved earlier
                    "X-CSRF-Token": workflowtoken

                },
                success: function (data) {
                    var workflowId = data.id;
                    oThisController.createTargetFolder(workflowId);
                    oMdlCommon.setProperty("/sWorkflowId", workflowId);
                    oMdlCommon.setProperty("/oEnable/sInput", false);
                    oMdlCommon.setProperty("/oEnable/sInput", false);
                    oMdlCommon.setProperty("/oEnable/bRegister", false);
                    var currRequestTitle = oMdlCommon.getProperty("/oInvestmentDetails/sTitle");
                    oMdlCommon.refresh(true);
                    oThisController.getView().setBusy(false);
                    MessageBox.success("Capital Expenditure Request '" + currRequestTitle + "' is submitted.");

                },
                error: function (jqXHR, textStatus, errorThrown) {
                    oThisController.getView().setBusy(false);
                    var sErrorText = oThisController.getMessage("WORKFLOW_SERVICE_ERROR");
                    MessageBox.error(sErrorText + "\n Error: " + errorThrown + ".");
                    return;
                }
            });
        },

    });
});
