const GCCompute = require("@google-cloud/compute");
const _ = require("lodash");

const autocomplete = require("./autocomplete");
const helpers = require("./helpers");
const {
  RESOURCE_OPERATIONS,
  callResourceOperation,
} = require("./gcp-lib");
const {
  runHttpExternalLoadBalancerCreation,
  runHttpsExternalLoadBalancerCreation,
} = require("./gcp-load-balancer");

function generateGcpPluginMethod({
  GCPMethod,
  resourceOperationType,
  createResourceDefinitionFn,
}) {
  return (action, settings) => {
    const credentials = helpers.getCredentials(action.params, settings);
    const project = helpers.getProject(action.params, settings);
    const resource = createResourceDefinitionFn(action);
    return callResourceOperation(
      resourceOperationType,
      GCPMethod,
      credentials,
      project,
      resource,
    );
  };
}

class SimpleGcpMethodDefinition {
  constructor(GCPMethod, resourceOperationType, createResourceDefinitionFn) {
    this.GCPMethod = GCPMethod;
    this.resourceOperationType = resourceOperationType;
    this.createResourceDefinitionFn = createResourceDefinitionFn;
  }
}

const simpleGcpMethodsDefinitions = {
  createHealthCheckFromJSON: new SimpleGcpMethodDefinition(
    GCCompute.HealthChecksClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      healthCheckResource: action.params.healthCheckJSON,
    }),
  ),
  createBackendServiceFromJSON: new SimpleGcpMethodDefinition(
    GCCompute.BackendServicesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      backendServiceResource: action.params.backendServiceJSON,
    }),
  ),
  createURLMapFromJSON: new SimpleGcpMethodDefinition(
    GCCompute.UrlMapsClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      urlMapResource: action.params.urlMapJSON,
    }),
  ),
  createTargetHttpProxyFromJSON: new SimpleGcpMethodDefinition(
    GCCompute.TargetHttpProxiesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      targetHttpProxyResource: action.params.targetHttpProxyJSON,
    }),
  ),
  createTargetHttpsProxyFromJSON: new SimpleGcpMethodDefinition(
    GCCompute.TargetHttpsProxiesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      targetHttpsProxyResource: action.params.targetHttpsProxyJSON,
    }),
  ),
  createForwardRulesFromJSON: new SimpleGcpMethodDefinition(
    GCCompute.GlobalForwardingRulesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      forwardingRuleResource: action.params.forwardRulesJSON,
    }),
  ),
  createAddressFromJSON: new SimpleGcpMethodDefinition(
    GCCompute.AddressesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      addressResource: action.params.addressJSON,
    }),
  ),
  createBackendBucketFromJSON: new SimpleGcpMethodDefinition(
    GCCompute.BackendBucketsClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      targetPoolResource: action.params.targetPoolJSON,
      region: action.params.region,
    }),
  ),
  createSslCertificateFromJSON: new SimpleGcpMethodDefinition(
    GCCompute.SslCertificatesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      sslCertificateResource: action.params.sslCertificateJSON,
    }),
  ),
  createSslPolicyFromJSON: new SimpleGcpMethodDefinition(
    GCCompute.SslPoliciesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      sslPolicyResource: action.params.sslPolicyJSON,
    }),
  ),
  createTargetInstanceFromJSON: new SimpleGcpMethodDefinition(
    GCCompute.TargetInstancesClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      targetInstanceResource: action.params.targetInstanceJSON,
      zone: action.params.zone,
    }),
  ),
  createTargetPoolFromJSON: new SimpleGcpMethodDefinition(
    GCCompute.TargetPoolsClient,
    RESOURCE_OPERATIONS.create,
    (action) => ({
      targetPoolResource: action.params.targetPoolJSON,
      region: action.params.region,
    }),
  ),
  deleteHealthCheck: new SimpleGcpMethodDefinition(
    GCCompute.HealthChecksClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      healthCheck: action.params.healthCheckName.value,
    }),
  ),
  deleteBackendService: new SimpleGcpMethodDefinition(
    GCCompute.BackendServicesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      backendService: action.params.backendServiceName.value,
    }),
  ),
  deleteUrlMap: new SimpleGcpMethodDefinition(
    GCCompute.UrlMapsClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      urlMap: action.params.urlMapName.value,
    }),
  ),
  deleteTargetHttpProxy: new SimpleGcpMethodDefinition(
    GCCompute.TargetHttpProxiesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      targetHttpProxy: action.params.targetHttpProxyName.value,
    }),
  ),
  deleteTargetHttpsProxy: new SimpleGcpMethodDefinition(
    GCCompute.TargetHttpsProxiesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      targetHttpsProxy: action.params.targetHttpsProxyName.value,
    }),
  ),
  deleteForwardingRules: new SimpleGcpMethodDefinition(
    GCCompute.GlobalForwardingRulesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      forwardingRule: action.params.forwardingRuleName.value,
    }),
  ),
  deleteAddress: new SimpleGcpMethodDefinition(
    GCCompute.AddressesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      address: action.params.addressName.value,
    }),
  ),
  deleteBackendBucket: new SimpleGcpMethodDefinition(
    GCCompute.BackendBucketsClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      backendBucket: action.params.backendBucketName.value,
    }),
  ),
  deleteSslCertificate: new SimpleGcpMethodDefinition(
    GCCompute.SslCertificatesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      sslCertificate: action.params.sslCertificateName.value,
    }),
  ),
  deleteSslPolicy: new SimpleGcpMethodDefinition(
    GCCompute.SslPoliciesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      sslPolicy: action.params.sslPolicyName.value,
    }),
  ),
  deleteTargetInstance: new SimpleGcpMethodDefinition(
    GCCompute.TargetInstancesClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      targetInstance: action.params.targetInstanceName.value,
      zone: action.params.zone.value,
    }),
  ),
  deleteTargetPool: new SimpleGcpMethodDefinition(
    GCCompute.TargetPoolsClient,
    RESOURCE_OPERATIONS.delete,
    (action) => ({
      targetPool: action.params.targetPoolName.value,
    }),
  ),
};

const simpleGCPMethods = _.mapValues(
  simpleGcpMethodsDefinitions,
  (methodDefinition) => generateGcpPluginMethod(methodDefinition),
);

/* eslint-disable max-len */
module.exports = {
  createHttpsExternalLoadBalancer: runHttpExternalLoadBalancerCreation,
  createHttpExternalLoadBalancer: runHttpsExternalLoadBalancerCreation,
  ...simpleGCPMethods,
  ...autocomplete,
};
/* eslint-enable max-len */
