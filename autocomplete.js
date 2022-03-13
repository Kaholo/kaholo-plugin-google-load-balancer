require("lodash");
const GCCompute = require("@google-cloud/compute");

const {
  createListProjectsFunction,
  createListZonesFunction,
  createListItemsFunction,
} = require("./google-compute-lib");

module.exports = {
  listProjectsAuto: createListProjectsFunction(),
  listZonesAuto: createListZonesFunction(),
  listInstanceGroupsAuto: createListItemsFunction(GCCompute.InstanceGroupsClient, ["id", "name"]),
  listHealthChecksAuto: createListItemsFunction(GCCompute.HealthChecksClient, ["id", "name"]),
  listSSLCertificatesAuto: createListItemsFunction(GCCompute.SslCertificatesClient, ["id", "name"]),
  listBackendServicesAuto: createListItemsFunction(GCCompute.BackendServicesClient, ["id", "name"]),
  listUrlMapsAuto: createListItemsFunction(GCCompute.UrlMapsClient, ["id", "name"]),
  listTargetHttpProxyAuto: createListItemsFunction(GCCompute.TargetHttpProxiesClient, ["id", "name"]),
  listTargetHttpsProxyAuto: createListItemsFunction(GCCompute.TargetHttpsProxiesClient, ["id", "name"]),
  listForwardingRulesAuto: createListItemsFunction(GCCompute.GlobalForwardingRulesClient, ["id", "name"]),

};
