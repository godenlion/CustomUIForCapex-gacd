sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/m/BusyDialog",
], function (BaseController, JSONModel, MessageBox, MessageToast, DateFormat, BusyDialog) {
    "use strict";
    var workflowInstanceId,
        prevFolderObjId,
        token;

    return BaseController.extend("com.sap.bpm.ApproveCapex.controller.App", {
        onInit: function () {

            this.configureView();

            // document service interaction
            this.oAttachmentsModel = new JSONModel();
            this.setModel(this.oAttachmentsModel, "attachmentsModel");
            this.checkIfWorkflowIsRestarted();

            this.getContentDensityClass();
        },

        checkIfWorkflowIsRestarted: function () {
            this.getView().setBusy(true);
            var isRestarted = this.getModel().getData().isRestarted;
            if (isRestarted) {
                //fetch token and get object id of previous folder before moving files
                this.fetchTokenAndGetPrevFolderObjId();
            } else {
                this.loadAttachments();
            }
        },

        configureView: function () {

            var startupParameters = this.getComponentData().startupParameters;
            var approveText = this.getMessage("APPROVE");
            var rejectText = this.getMessage("REJECT");
            var reworkText = this.getMessage("REWORK");

            var taskInstanceModel = this.getModel("taskInstanceModel");
            var sSubject = taskInstanceModel.getData().subject;
            this.byId("approvePageHeader").setObjectTitle(sSubject);

            var oThisController = this;

            /**
             * APPROVE BUTTON
             */
            // Implementation for the approve action
            var oApproveAction = {
                sBtnTxt: approveText,
                onBtnPressed: function () {
                    var model = oThisController.getModel();
                    model.refresh(true);
                    var processContext = model.getData();

                    // Call a local method to perform further action
                    oThisController._triggerComplete(
                        processContext,
                        startupParameters.taskModel.getData().InstanceID,
                        "approved"
                    );
                }
            };

            // Add 'Approve' action to the task
            startupParameters.inboxAPI.addAction({
                // confirm is a positive action
                action: oApproveAction.sBtnTxt,
                label: oApproveAction.sBtnTxt,
                type: "Accept"
            },
                // Set the onClick function
                oApproveAction.onBtnPressed);

            /**
            * REJECT BUTTON
            */
            // Implementation for the reject action
            var oRejectAction = {
                sBtnTxt: rejectText,
                onBtnPressed: function () {
                    var model = oThisController.getModel();
                    model.refresh(true);
                    var processContext = model.getData();

                    // Call a local method to perform further action
                    oThisController._triggerComplete(
                        processContext,
                        startupParameters.taskModel.getData().InstanceID,
                        "rejected"
                    );
                }
            };

            // Add 'Reject' action to the task
            startupParameters.inboxAPI.addAction({
                // confirm is a positive action
                action: oRejectAction.sBtnTxt,
                label: oRejectAction.sBtnTxt,
                type: "Reject"
            },
                // Set the onClick function
                oRejectAction.onBtnPressed);

            /**
            * REWORK BUTTON
            */
            // Implementation for the rework action
            var oReworkAction = {
                sBtnTxt: reworkText,
                onBtnPressed: function () {
                    var model = oThisController.getModel();
                    model.refresh(true);
                    var processContext = model.getData();

                    // Call a local method to perform further action
                    oThisController._triggerComplete(
                        processContext,
                        startupParameters.taskModel.getData().InstanceID,
                        "rework"
                    );
                }
            };

            // Add 'Rework' action to the task
            startupParameters.inboxAPI.addAction({
                // confirm is a positive action
                action: oReworkAction.sBtnTxt,
                label: oReworkAction.sBtnTxt
            },
                // Set the onClick function
                oReworkAction.onBtnPressed);
        },

        // This method is called when the confirm button is click by the end user
        _triggerComplete: function (processContext, taskId, approvalStatus /*, refreshTask*/) {

            var oThisController = this;

            this.openBusyDialog();

            $.ajax({
                // Call workflow API to get the xsrf token
                url: "/comsapbpmApproveCapex/workflowruntime/v1/xsrf-token",
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
                            "comments": processContext.comments,
                            "approvalStatus": approvalStatus
                        },
                        "status": "COMPLETED"
                    };

                    $.ajax({
                        // Call workflow API to complete the task
                        url: "/comsapbpmApproveCapex/workflowruntime/v1/task-instances/" + taskId,
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

        /**
         * DOCUMENT SERVICE INTEGRATION
         */
        //fetch token and get object id of previous folder before moving files
        fetchTokenAndGetPrevFolderObjId: function () {

            var oThisController = this;
            var prevFolderName = oThisController.getModel().getData().prevWorkflowInstanceId;
            var sUrl = "/comsapbpmApproveCapex/docservice/WorkflowManagement/CapitalExpenditureRequestsManagement/?succinct=true";
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

            $.ajax(oSettings)
                .done(function (results, textStatus, request) {
                    token = request.getResponseHeader('X-Csrf-Token');
                    for (var i = 0; i < results.objects.length; i++) {
                        if (results.objects[i].object.succinctProperties["cmis:objectTypeId"] == "cmis:folder"
                            && results.objects[i].object.succinctProperties["cmis:name"] == prevFolderName) {

                            prevFolderObjId = results.objects[i].object.succinctProperties["cmis:objectId"];
                        }
                    }
                    oThisController.checkIfTargetFolderExists();
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

        // check if folder with a given name exists
        checkIfTargetFolderExists: function () {

            var oThisController = this;

            var folderName = oThisController.getModel("taskInstanceModel").getData().workflowInstanceId;
            var sUrl = "/comsapbpmApproveCapex/docservice/WorkflowManagement/CapitalExpenditureRequestsManagement/" + folderName + "/?succinct=true";

            var oSettings = {
                "url": sUrl,
                "method": "GET",
                "async": false
            };

            var responseStatusCode,
                objects = [];

            $.ajax(oSettings)
                .done(function (results, textStatus, request) {
                    responseStatusCode = request.status;
                    objects = results;
                })
                .fail(function (err) {
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
            if (responseStatusCode == 200) {
                oThisController._mapAttachmentsModel(objects);
            } else if (responseStatusCode == 404) {
                oThisController.createTargetFolder();
            } else {
                console.log("something is wrong");
            }
        },

        // create new folder
        createTargetFolder: function () {

            var sUrl = "/comsapbpmApproveCapex/docservice/WorkflowManagement/CapitalExpenditureRequestsManagement/";

            var oThisController = this;

            var oFormData = new window.FormData();
            oFormData.append("cmisAction", "createFolder");
            oFormData.append("succinct", "true");
            oFormData.append("propertyId[0]", "cmis:name");
            oFormData.append("propertyValue[0]", oThisController.getModel("taskInstanceModel").getData().workflowInstanceId);
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
                    var newFolderObjId = results.succinctProperties["cmis:objectId"];
                    oThisController.moveFiles(newFolderObjId);
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

        // move files under new folder if workflow is restarted
        moveFiles: function (newFolderObjId) {
            var oThisController = this,
                oModel = oThisController.getModel();
            var sUrl = "/comsapbpmApproveCapex/docservice/";

            var aAttachments = oModel.getData().Attachments;
            var countMoves = 0;

            for (var i = 0; i < aAttachments.length; i++) {
                var oFormData = new window.FormData();
                oFormData.append("cmisAction", "move");
                oFormData.append("objectId", aAttachments[i].objectId);
                oFormData.append("sourceFolderId", prevFolderObjId);
                oFormData.append("targetFolderId", newFolderObjId);

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
                        console.log("file with id '" + aAttachments[i].objectId + "' is moved")
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

                countMoves++;
            }

            if (countMoves == aAttachments.length) {
                oThisController.deletePrevFolder();
            }
        },

        // delete previous folder (cleanup)
        deletePrevFolder: function () {
            console.log("deleting previous folder with a objId '" + prevFolderObjId + "'");

            var sUrl = "/comsapbpmApproveCapex/docservice/WorkflowManagement/CapitalExpenditureRequestsManagement/";
            var oThisController = this;

            var oFormData = new window.FormData();
            oFormData.append("cmisAction", "deleteTree");
            oFormData.append("objectId", prevFolderObjId);

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
                    oThisController.loadAttachments();
                })
                .fail(function (err) {
                    var responseStatusCode = err.status;
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
        },

        loadAttachments: function () {
            // get workflow ID
            var taskInstanceModel = this.getModel("taskInstanceModel");
            workflowInstanceId = taskInstanceModel.getData().workflowInstanceId;

            var sUrl = "/comsapbpmApproveCapex/docservice/WorkflowManagement/CapitalExpenditureRequestsManagement/"
                + workflowInstanceId + "/?succinct=true";

            var oSettings = {
                "url": sUrl,
                "method": "GET",
                // "async": false
            };
            var oThisController = this;

            $.ajax(oSettings)
                .done(function (results) {
                    oThisController._mapAttachmentsModel(results);
                })
                .fail(function (err) {
                    if (err !== undefined) {
                        var oErrorResponse = $.parseJSON(err.responseText);
                        MessageToast.show(oErrorResponse.message, {
                            duration: 6000
                        });
                    } else {
                        MessageToast.show("Unknown error!");
                    }
                });
        },

        // assign data to attachments model
        _mapAttachmentsModel: function (data) {
            this.oAttachmentsModel.setData(data);
            this.oAttachmentsModel.refresh();
            this.getView().setBusy(false);
        },

        // formatting functions
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
            return "/comsapbpmApproveCapex/docservice/WorkflowManagement/CapitalExpenditureRequestsManagement/"
                + workflowInstanceId + "?objectId=" + objectId + "&cmisselector=content";
        },

    });
});
