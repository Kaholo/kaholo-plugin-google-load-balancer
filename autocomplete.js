const GCCompute = require("@google-cloud/compute");

const {
  createListItemsFunction,
  listGcpProjects,
  listGcpRegions,
  listGcpZones,
} = require("./gcp-autocomplete-lib");

module.exports = {
  listProjectsAuto: listGcpProjects,
  listRegionsAuto: listGcpRegions,
  listZonesAuto: listGcpZones,
  listInstanceGroupsAuto: createListItemsFunction(GCCompute.InstanceGroupsClient, ["id", "name"]),
  listHealthChecksAuto: createListItemsFunction(GCCompute.HealthChecksClient, ["id", "name"]),
  listSslCertificatesAuto: createListItemsFunction(GCCompute.SslCertificatesClient, ["id", "name"]),
  listBackendServicesAuto: createListItemsFunction(GCCompute.BackendServicesClient, ["id", "name"]),
  listBackendBucketsAuto: createListItemsFunction(GCCompute.BackendBucketsClient, ["id", "name"]),
  listUrlMapsAuto: createListItemsFunction(GCCompute.UrlMapsClient, ["id", "name"]),
  listTargetHttpProxyAuto: createListItemsFunction(GCCompute.TargetHttpProxiesClient, ["id", "name"]),
  listTargetHttpsProxyAuto: createListItemsFunction(GCCompute.TargetHttpsProxiesClient, ["id", "name"]),
  listForwardingRulesAuto: createListItemsFunction(GCCompute.GlobalForwardingRulesClient, ["id", "name"]),
  listAddressesAuto: createListItemsFunction(GCCompute.GlobalAddressesClient, ["id", "name"]),
  listSslPoliciesAuto: createListItemsFunction(GCCompute.SslPoliciesClient, ["id", "name"]),
  listTargetInstancesAuto: createListItemsFunction(GCCompute.TargetInstancesClient, ["id", "name"]),
  listTargetPoolsAuto: createListItemsFunction(GCCompute.TargetPoolsClient, ["id", "name"]),

};
