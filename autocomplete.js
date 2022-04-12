const GCCompute = require("@google-cloud/compute");
const {
  ProjectsClient,
} = require("@google-cloud/resource-manager");

const {
  generateGCPAutocompleter,
  getProjects,
} = require("./gcp-autocomplete-lib");
const parsers = require("./parsers");

function generateListZonesFilter(query, settings, params) {
  // none of the methods use both zones and regions params,
  // but since it's present in settings, we check params just in case
  const region = parsers.autocomplete(params.region || settings.region);
  return (zone) => !region || zone.name.includes(region);
}

module.exports = {
  listProjectsAuto: generateGCPAutocompleter(ProjectsClient, ["projectId", "displayName"], {
    listingFunction: getProjects,
  }),
  listRegionsAuto: generateGCPAutocompleter(GCCompute.RegionsClient, ["name"]),
  listZonesAuto: generateGCPAutocompleter(GCCompute.ZonesClient, ["name"], {
    filterGenerator: generateListZonesFilter,
  }),
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
