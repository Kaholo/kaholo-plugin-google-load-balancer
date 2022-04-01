const GCCompute = require("@google-cloud/compute");
const autocomplete = require("./autocomplete");
const {
  RESOURCE_OPERATIONS,
  callResourceOperation,
} = require("./google-compute-lib");
const {
  runHttpExternalLoadBalancerCreation,
  runHttpsExternalLoadBalancerCreation,
} = require("./gcp-compute-service-adapter");

async function createHttpsExternalLoadBalancer(action, settings) {
  return runHttpsExternalLoadBalancerCreation(action, settings);
}

async function createHttpExternalLoadBalancer(action, settings) {
  return runHttpExternalLoadBalancerCreation(action, settings);
}

class GcpResourceMethodDefinition {
  constructor(GCPMethod, resourceOperation, createResourceDefinitionFn) {
    this.GCPMethod = GCPMethod;
    this.resourceOperation = resourceOperation;
    this.createResourceDefinitionFn = createResourceDefinitionFn;
  }
}

const GCP_RESOURCE_METHODS_DEFINITIONS = {
  createHealthCheckFromJSON: new GcpResourceMethodDefinition(
    GCCompute.HealthChecksClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      healthCheckResource: action.params.healthCheckJSON,
    }),
  ),
  createBackendServiceFromJSON: new GcpResourceMethodDefinition(
    GCCompute.BackendServicesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      backendServiceResource: action.params.backendServiceJSON,
    }),
  ),
  createURLMapFromJSON: new GcpResourceMethodDefinition(
    GCCompute.UrlMapsClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      urlMapResource: action.params.urlMapJSON,
    }),
  ),
  createTargetHttpProxyFromJSON: new GcpResourceMethodDefinition(
    GCCompute.TargetHttpProxiesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      targetHttpProxyResource: action.params.targetHttpProxyJSON,
    }),
  ),
  createTargetHttpsProxyFromJSON: new GcpResourceMethodDefinition(
    GCCompute.TargetHttpsProxiesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      targetHttpsProxyResource: action.params.targetHttpsProxyJSON,
    }),
  ),
  createForwardRulesFromJSON: new GcpResourceMethodDefinition(
    GCCompute.GlobalForwardingRulesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      forwardingRuleResource: action.params.forwardRulesJSON,
    }),
  ),
  createAddressFromJSON: new GcpResourceMethodDefinition(
    GCCompute.AddressesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      addressResource: action.params.addressJSON,
    }),
  ),
  createBackendBucketFromJSON: new GcpResourceMethodDefinition(
    GCCompute.BackendBucketsClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      targetPoolResource: action.params.targetPoolJSON,
      region: action.params.region,
    }),
  ),
  createSslCertificateFromJSON: new GcpResourceMethodDefinition(
    GCCompute.SslCertificatesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      sslCertificateResource: action.params.sslCertificateJSON,
    }),
  ),
  createSslPolicyFromJSON: new GcpResourceMethodDefinition(
    GCCompute.SslPoliciesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      sslPolicyResource: action.params.sslPolicyJSON,
    }),
  ),
  createTargetInstanceFromJSON: new GcpResourceMethodDefinition(
    GCCompute.TargetInstancesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      targetInstanceResource: action.params.targetInstanceJSON,
      zone: action.params.zone,
    }),
  ),
  createTargetPoolFromJSON: new GcpResourceMethodDefinition(
    GCCompute.TargetPoolsClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      targetPoolResource: action.params.targetPoolJSON,
      region: action.params.region,
    }),
  ),
  deleteHealthCheck: new GcpResourceMethodDefinition(
    GCCompute.HealthChecksClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      healthCheck: action.params.healthCheckName.value,
    }),
  ),
  deleteBackendService: new GcpResourceMethodDefinition(
    GCCompute.BackendServicesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      backendService: action.params.backendServiceName.value,
    }),
  ),
  deleteUrlMap: new GcpResourceMethodDefinition(
    GCCompute.UrlMapsClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      urlMap: action.params.urlMapName.value,
    }),
  ),
  deleteTargetHttpProxy: new GcpResourceMethodDefinition(
    GCCompute.TargetHttpProxiesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      targetHttpProxy: action.params.targetHttpProxyName.value,
    }),
  ),
  deleteTargetHttpsProxy: new GcpResourceMethodDefinition(
    GCCompute.TargetHttpsProxiesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      targetHttpsProxy: action.params.targetHttpsProxyName.value,
    }),
  ),
  deleteForwardingRules: new GcpResourceMethodDefinition(
    GCCompute.GlobalForwardingRulesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      forwardingRule: action.params.forwardingRuleName.value,
    }),
  ),
  deleteAddress: new GcpResourceMethodDefinition(
    GCCompute.AddressesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      address: action.params.addressName.value,
    }),
  ),
  deleteBackendBucket: new GcpResourceMethodDefinition(
    GCCompute.BackendBucketsClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      backendBucket: action.params.backendBucketName.value,
    }),
  ),
  deleteSslCertificate: new GcpResourceMethodDefinition(
    GCCompute.SslCertificatesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      sslCertificate: action.params.sslCertificateName.value,
    }),
  ),
  deleteSslPolicy: new GcpResourceMethodDefinition(
    GCCompute.SslPoliciesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      sslPolicy: action.params.sslPolicyName.value,
    }),
  ),
  deleteTargetInstance: new GcpResourceMethodDefinition(
    GCCompute.TargetInstancesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      targetInstance: action.params.targetInstanceName.value,
      zone: action.params.zone.value,
    }),
  ),
  deleteTargetPool: new GcpResourceMethodDefinition(
    GCCompute.TargetPoolsClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      targetPool: action.params.targetPoolName.value,
    }),
  ),
};

function generateGCPResourceMethod({
  GCPMethod,
  resourceOperation,
  createResourceDefinitionFn,
}) {
  return (action, settings) => callResourceOperation(
    resourceOperation,
    action.params,
    settings,
    GCPMethod,
    createResourceDefinitionFn(action),
  );
}

/* eslint-disable max-len */
module.exports = {
  createHttpsExternalLoadBalancer,
  createHttpExternalLoadBalancer,
  createHealthCheckFromJSON: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.createHealthCheckFromJSON),
  createBackendServiceFromJSON: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.createBackendServiceFromJSON),
  createURLMapFromJSON: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.createURLMapFromJSON),
  createTargetHttpProxyFromJSON: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.createTargetHttpProxyFromJSON),
  createTargetHttpsProxyFromJSON: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.createTargetHttpsProxyFromJSON),
  createForwardRulesFromJSON: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.createForwardRulesFromJSON),
  createAddressFromJSON: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.createAddressFromJSON),
  createBackendBucketFromJSON: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.createBackendBucketFromJSON),
  createSslCertificateFromJSON: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.createSslCertificateFromJSON),
  createSslPolicyFromJSON: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.createSslPolicyFromJSON),
  createTargetInstanceFromJSON: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.createTargetInstanceFromJSON),
  createTargetPoolFromJSON: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.createTargetPoolFromJSON),
  deleteHealthCheck: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.deleteHealthCheck),
  deleteBackendService: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.deleteBackendService),
  deleteUrlMap: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.deleteUrlMap),
  deleteTargetHttpProxy: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.deleteTargetHttpProxy),
  deleteTargetHttpsProxy: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.deleteTargetHttpsProxy),
  deleteForwardingRules: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.deleteForwardingRules),
  deleteAddress: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.deleteAddress),
  deleteBackendBucket: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.deleteBackendBucket),
  deleteSslCertificate: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.deleteSslCertificate),
  deleteSslPolicy: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.deleteSslPolicy),
  deleteTargetInstance: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.deleteTargetInstance),
  deleteTargetPool: generateGCPResourceMethod(GCP_RESOURCE_METHODS_DEFINITIONS.deleteTargetPool),
  ...autocomplete,
};
/* eslint-enable max-len */
