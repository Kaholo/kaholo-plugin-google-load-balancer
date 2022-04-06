const GCCompute = require("@google-cloud/compute");
const {
  ProjectsClient,
} = require("@google-cloud/resource-manager");

const {
  generateGCPAutocompleter,
  getProjects,
} = require("./gcp-autocomplete-lib");
const helpers = require("./helpers");
const parsers = require("./parsers");

function generateListZonesFilter(pluginSettings, pluginParams) {
  const params = helpers.mapAutoParams(pluginParams);
  const region = parsers.autocomplete(params.region);
  return (zone) => !region || zone.name.includes(region);
}

module.exports = {
  listProjectsAuto: generateGCPAutocompleter(ProjectsClient, ["projectId", "displayName"], getProjects),
  listRegionsAuto: generateGCPAutocompleter(GCCompute.RegionsClient, ["name"]),
  listZonesAuto: generateGCPAutocompleter(GCCompute.ZonesClient, ["name"], null, generateListZonesFilter),
  listInstanceGroupsAuto: generateGCPAutocompleter(GCCompute.InstanceGroupsClient, ["id", "name"]),
  listHealthChecksAuto: generateGCPAutocompleter(GCCompute.HealthChecksClient, ["id", "name"]),
  listSslCertificatesAuto: generateGCPAutocompleter(GCCompute.SslCertificatesClient, ["id", "name"]),
  listBackendServicesAuto: generateGCPAutocompleter(GCCompute.BackendServicesClient, ["id", "name"]),
  listBackendBucketsAuto: generateGCPAutocompleter(GCCompute.BackendBucketsClient, ["id", "name"]),
  listUrlMapsAuto: generateGCPAutocompleter(GCCompute.UrlMapsClient, ["id", "name"]),
  listTargetHttpProxyAuto: generateGCPAutocompleter(GCCompute.TargetHttpProxiesClient, ["id", "name"]),
  listTargetHttpsProxyAuto: generateGCPAutocompleter(GCCompute.TargetHttpsProxiesClient, ["id", "name"]),
  listForwardingRulesAuto: generateGCPAutocompleter(GCCompute.GlobalForwardingRulesClient, ["id", "name"]),
  listAddressesAuto: generateGCPAutocompleter(GCCompute.GlobalAddressesClient, ["id", "name"]),
  listSslPoliciesAuto: generateGCPAutocompleter(GCCompute.SslPoliciesClient, ["id", "name"]),
  listTargetInstancesAuto: generateGCPAutocompleter(GCCompute.TargetInstancesClient, ["id", "name"]),
  listTargetPoolsAuto: generateGCPAutocompleter(GCCompute.TargetPoolsClient, ["id", "name"]),
};
