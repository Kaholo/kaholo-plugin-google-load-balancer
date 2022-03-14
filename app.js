const GCCompute = require("@google-cloud/compute");
const autocomplete = require("./autocomplete");
const {
  createResource,
  deleteResource,
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

async function createTargetHttpsProxyFromJSON(action, settings) {
  const resource = { targetHttpsProxyResource: action.params.targetHttpsProxyJSON };

  return createResource(
    action.params,
    settings,
    GCCompute.TargetHttpsProxiesClient,
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

async function deleteHealthCheck(action, settings) {
  const resource = {
    healthCheck: action.params.healthCheckName.value,
  };
  return deleteResource(
    action.params,
    settings,
    GCCompute.HealthChecksClient,
    resource,
  );
}

async function deleteBackendService(action, settings) {
  const resource = {
    backendService: action.params.backendServiceName.value,
  };
  return deleteResource(
    action.params,
    settings,
    GCCompute.BackendServicesClient,
    resource,
  );
}

async function deleteUrlMap(action, settings) {
  const resource = {
    urlMap: action.params.urlMapName.value,
  };
  return deleteResource(
    action.params,
    settings,
    GCCompute.UrlMapsClient,
    resource,
  );
}

async function deleteTargetHttpProxy(action, settings) {
  const resource = {
    targetHttpProxy: action.params.targetHttpProxyName.value,
  };
  return deleteResource(
    action.params,
    settings,
    GCCompute.TargetHttpProxiesClient,
    resource,
  );
}

async function deleteTargetHttpsProxy(action, settings) {
  const resource = {
    targetHttpsProxy: action.params.targetHttpsProxyName.value,
  };
  return deleteResource(
    action.params,
    settings,
    GCCompute.TargetHttpsProxiesClient,
    resource,
  );
}

async function deleteForwardingRules(action, settings) {
  const resource = {
    forwardingRule: action.params.forwardingRuleName.value,
  };
  return deleteResource(
    action.params,
    settings,
    GCCompute.GlobalForwardingRulesClient,
    resource,
  );
}

async function deleteAddress(action, settings) {
  const resource = {
    address: action.params.addressName.value,

  };
  return deleteResource(
    action.params,
    settings,
    GCCompute.AddressesClient,
    resource,
  );
}

async function deleteBackendBucket(action, settings) {
  const resource = {
    backendBucket: action.params.backendBucketName.value,
  };
  return deleteResource(
    action.params,
    settings,
    GCCompute.BackendBucketsClient,
    resource,
  );
}

async function deleteSslCertificate(action, settings) {
  const resource = {
    sslCertificate: action.params.sslCertificateName.value,
  };
  return deleteResource(
    action.params,
    settings,
    GCCompute.SslCertificatesClient,
    resource,
  );
}

async function deleteSslPolicy(action, settings) {
  const resource = {
    sslPolicy: action.params.sslPolicyName.value,
  };
  return deleteResource(
    action.params,
    settings,
    GCCompute.SslPoliciesClient,
    resource,
  );
}

async function deleteTargetInstance(action, settings) {
  const resource = {
    targetInstance: action.params.targetInstanceName.value,
    zone: action.params.zone.value,
  };
  return deleteResource(
    action.params,
    settings,
    GCCompute.TargetInstancesClient,
    resource,
  );
}

async function deleteTargetPool(action, settings) {
  const resource = {
    targetPool: action.params.targetPoolName.value,
  };
  return deleteResource(
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
  createTargetHttpsProxyFromJSON,
  createForwardRulesFromJSON,
  createAddressFromJSON,
  createBackendBucketFromJSON,
  createSslCertificateFromJSON,
  createSslPolicyFromJSON,
  createTargetInstanceFromJSON,
  createTargetPoolFromJSON,
  createHttpExternalLoadBalancer,
  createHttpsExternalLoadBalancer,
  deleteHealthCheck,
  deleteBackendService,
  deleteUrlMap,
  deleteTargetHttpProxy,
  deleteTargetHttpsProxy,
  deleteForwardingRules,
  deleteAddress,
  deleteBackendBucket,
  deleteSslCertificate,
  deleteSslPolicy,
  deleteTargetInstance,
  deleteTargetPool,
  ...autocomplete,
};
