const GCCompute = require("@google-cloud/compute");
const {
  RESOURCE_OPERATIONS,
  callResourceOperation,
  createMultipleGCPServices,
} = require("./gcp-lib");
const helpers = require("./helpers");

function createHealthCheckResource(action) {
  return {
    healthCheckResource: {
      name: action.params.healthCheckName,
      type: action.params.type,
      httpHealthCheck: {},
    },
  };
}

async function createBackendServiceResource(action, credentials, project) {
  const instanceGroupsResource = await callResourceOperation(
    RESOURCE_OPERATIONS.get,
    GCCompute.InstanceGroupsClient,
    credentials,
    project,
    {
      zone: action.params.zone.value,
      instanceGroup: action.params.instanceGroupName.value,
    },
  );

  const healthCheckResource = await callResourceOperation(
    RESOURCE_OPERATIONS.get,
    GCCompute.HealthChecksClient,
    credentials,
    project,
    {
      zone: action.params.zone.value,
      healthCheck: action.params.healthCheckName,
    },
  );

  const backendServiceResource = {
    backendServiceResource: {
      name: action.params.backendServiceName,
      backends: [
        {
          group: instanceGroupsResource.selfLink,
        },
      ],
      healthChecks: [
        healthCheckResource.selfLink,
      ],
    },
  };

  return backendServiceResource;
}

async function createUrlMapResource(action, credentials, project) {
  const defaultServiceResource = await callResourceOperation(
    RESOURCE_OPERATIONS.get,
    GCCompute.BackendServicesClient,
    credentials,
    project,
    {
      backendService: action.params.backendServiceName,
    },
  );

  const urlMapResource = {
    urlMapResource: {
      name: action.params.urlMapName,
      defaultService: defaultServiceResource.selfLink,
    },
  };

  return urlMapResource;
}

async function createTargetHttpProxyResource(action, credentials, project) {
  const urlMapsResource = await callResourceOperation(
    RESOURCE_OPERATIONS.get,
    GCCompute.UrlMapsClient,
    credentials,
    project,
    {
      urlMap: action.params.urlMapName,
    },
  );

  const targetHttpProxyResource = {
    targetHttpProxyResource:
      {
        name: action.params.httpProxyName,
        urlMap: urlMapsResource.selfLink,
      },
  };

  return targetHttpProxyResource;
}

async function createTargetHttpsProxyResource(action, credentials, project) {
  const urlMapsResource = await callResourceOperation(
    RESOURCE_OPERATIONS.get,
    GCCompute.UrlMapsClient,
    credentials,
    project,
    {
      urlMap: action.params.urlMapName,
    },
  );

  const sslCertificateURL = await callResourceOperation(
    RESOURCE_OPERATIONS.get,
    GCCompute.SslCertificatesClient,
    credentials,
    project,
    {
      sslCertificate: action.params.sslCertificateName.value,
    },
  );

  const targetHttpsProxyResource = {
    targetHttpsProxyResource:
      {
        name: action.params.httpsProxyName,
        urlMap: urlMapsResource.selfLink,
        sslCertificates: [sslCertificateURL.selfLink],
      },
  };
  return targetHttpsProxyResource;
}

async function createHttpForwardingRuleResource(action, credentials, project) {
  const targetHttpProxyClient = await callResourceOperation(
    RESOURCE_OPERATIONS.get,
    GCCompute.TargetHttpProxiesClient,
    credentials,
    project,
    { targetHttpProxy: action.params.httpProxyName },
  );

  const forwardingRuleResource = {
    forwardingRuleResource: {
      name: action.params.forwardingRuleName,
      target: targetHttpProxyClient.selfLink,
      portRange: action.params.forwardRulePortRange,
      loadBalancingScheme: "EXTERNAL",
    },
  };

  return forwardingRuleResource;
}

async function createHttpsForwardingRuleResource(action, credentials, project) {
  const targetHttpsProxyClient = await callResourceOperation(
    RESOURCE_OPERATIONS.get,
    GCCompute.TargetHttpsProxiesClient,
    credentials,
    project,
    { targetHttpsProxy: action.params.httpsProxyName },
  );

  const forwardingRuleResource = {
    forwardingRuleResource: {
      name: action.params.forwardingRuleName,
      target: targetHttpsProxyClient.selfLink,
      portRange: action.params.forwardRulePortRange,
      loadBalancingScheme: "EXTERNAL",
    },
  };
  return forwardingRuleResource;
}

const httpLoadBalancerServicesDefinitions = [
  { client: GCCompute.HealthChecksClient, createResourceFunc: createHealthCheckResource, typeProperty: "healthCheck" },
  { client: GCCompute.BackendServicesClient, createResourceFunc: createBackendServiceResource, typeProperty: "backendService" },
  { client: GCCompute.UrlMapsClient, createResourceFunc: createUrlMapResource, typeProperty: "urlMap" },
  { client: GCCompute.TargetHttpProxiesClient, createResourceFunc: createTargetHttpProxyResource, typeProperty: "targetHttpProxy" },
  { client: GCCompute.GlobalForwardingRulesClient, createResourceFunc: createHttpForwardingRuleResource, typeProperty: "forwardingRule" },
];

const httpsLoadBalancerServicesDefinitions = [
  { client: GCCompute.HealthChecksClient, createResourceFunc: createHealthCheckResource, typeProperty: "healthCheck" },
  { client: GCCompute.BackendServicesClient, createResourceFunc: createBackendServiceResource, typeProperty: "backendService" },
  { client: GCCompute.UrlMapsClient, createResourceFunc: createUrlMapResource, typeProperty: "urlMap" },
  { client: GCCompute.TargetHttpsProxiesClient, createResourceFunc: createTargetHttpsProxyResource, typeProperty: "targetHttpsProxy" },
  { client: GCCompute.GlobalForwardingRulesClient, createResourceFunc: createHttpsForwardingRuleResource, typeProperty: "forwardingRule" },
];

module.exports = {
  runHttpExternalLoadBalancerCreation: (action, settings) => createMultipleGCPServices(
    httpLoadBalancerServicesDefinitions,
    action,
    helpers.getCredentials(action.params, settings),
    helpers.getProject(action.params, settings),
  ),
  runHttpsExternalLoadBalancerCreation: (action, settings) => createMultipleGCPServices(
    httpsLoadBalancerServicesDefinitions,
    action,
    helpers.getCredentials(action.params, settings),
    helpers.getProject(action.params, settings),
  ),
};
