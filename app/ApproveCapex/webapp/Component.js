sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "com/sap/bpm/ApproveCapex/model/models",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, Device, models, JSONModel) {
    "use strict";

    return UIComponent.extend("com.sap.bpm.ApproveCapex.Component", {

        metadata: {
            manifest: "json"
        },

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // enable routing
            this.getRouter().initialize();

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // get task data
            var startupParameters = this.getComponentData().startupParameters;
            var taskModel = startupParameters.taskModel;
            var taskData = taskModel.getData();
            var taskId = taskData.InstanceID;

            // read process context & bind it to the view's main model
            var contextModel = new JSONModel("/comsapbpmApproveCapex/workflowruntime/v1/task-instances/" + taskId + "/context");
            // contextModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
            this.setModel(contextModel);

            // read task instance model & bind it to retrieve workflowInstanceId later
            var taskInstanceModel = new JSONModel("/comsapbpmApproveCapex/workflowruntime/v1/task-instances/" + taskId);
            taskInstanceModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
            this.setModel(taskInstanceModel, "taskInstanceModel");

        },

        getContentDensityClass: function () {
            if (!this._sContentDensityClass) {
                if (!sap.ui.Device.support.touch) {
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        }
    });
});