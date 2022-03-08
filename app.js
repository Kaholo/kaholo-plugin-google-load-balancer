const GCCompute = require("@google-cloud/compute");
require("./google-compute-service");
const autocomplete = require("./autocomplete");
const {
  createResource,
} = require("./google-compute-lib");
const {
  runHttpExternalLoadBalancerCreation,
  runHttpsExternalLoadBalancerCreation,
} = require("./google-load-balancer-service");

async function createHttpsExternalLoadBalancer(action, settings) {
  return runHttpsExternalLoadBalancerCreation(action, settings);
}

async function createHttpExternalLoadBalancer(action, settings) {
  return runHttpExternalLoadBalancerCreation(action, settings);
}

async function createHealthCheckFromJSON(action, settings) {
  const resource = { healthCheckResource: action.params.healthCheckJSON };

  return createResource(
    action.params,
    settings,
    GCCompute.HealthChecksClient,
    resource,
  );
}

async function createBackendServiceFromJSON(action, settings) {
  const resource = { backendServiceResource: action.params.backendServiceJSON };

  return createResource(
    action.params,
    settings,
    GCCompute.BackendServicesClient,
    resource,
  );
}

async function createURLMapFromJSON(action, settings) {
  const resource = { urlMapResource: action.params.urlMapJSON };

  return createResource(
    action.params,
    settings,
    GCCompute.UrlMapsClient,
    resource,
  );
}

async function createTargetHttpProxyFromJSON(action, settings) {
  const resource = { targetHttpProxyResource: action.params.targetHttpProxyJSON };

  return createResource(
    action.params,
    settings,
    GCCompute.TargetHttpProxiesClient,
    resource,
  );
}

async function createForwardRulesFromJSON(action, settings) {
  const resource = { forwardingRuleResource: action.params.forwardRulesJSON };

  return createResource(
    action.params,
    settings,
    GCCompute.GlobalForwardingRulesClient,
    resource,
  );
}

async function createAddressFromJSON(action, settings) {
  const resource = { addressResource: action.params.addressJSON };

  return createResource(
    action.params,
    settings,
    GCCompute.AddressesClient,
    resource,
  );
}

async function createBackendBucketFromJSON(action, settings) {
  const resource = { backendBucketResource: action.params.backendBucketJSON };

  return createResource(
    action.params,
    settings,
    GCCompute.BackendBucketsClient,
    resource,
  );
}

async function createSslCertificateFromJSON(action, settings) {
  const resource = { sslCertificateResource: action.params.sslCertificateJSON };

  return createResource(
    action.params,
    settings,
    GCCompute.SslCertificatesClient,
    resource,
  );
}

async function createSslPolicyFromJSON(action, settings) {
  const resource = { sslPolicyResource: action.params.sslPolicyJSON };

  return createResource(
    action.params,
    settings,
    GCCompute.SslPoliciesClient,
    resource,
  );
}

async function createTargetInstanceFromJSON(action, settings) {
  const resource = {
    targetInstanceResource: action.params.targetInstanceJSON,
    zone: action.params.zone,
  };

  return createResource(
    action.params,
    settings,
    GCCompute.SslPoliciesClient,
    resource,
  );
}

async function createTargetPoolFromJSON(action, settings) {
  const resource = {
    targetPoolResource: action.params.targetPoolJSON,
    region: action.params.region,
  };

  return createResource(
    action.params,
    settings,
    GCCompute.TargetPoolsClient,
    resource,
  );
}

module.exports = {
  createHealthCheckFromJSON,
  createBackendServiceFromJSON,
  createURLMapFromJSON,
  createTargetHttpProxyFromJSON,
  createForwardRulesFromJSON,
  createAddressFromJSON,
  createBackendBucketFromJSON,
  createSslCertificateFromJSON,
  createSslPolicyFromJSON,
  createTargetInstanceFromJSON,
  createTargetPoolFromJSON,
  createHttpExternalLoadBalancer,
  createHttpsExternalLoadBalancer,
  ...autocomplete,
};
