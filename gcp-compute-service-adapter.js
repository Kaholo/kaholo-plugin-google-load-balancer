const GCCompute = require("@google-cloud/compute");
const _ = require("lodash");
const {
  RESOURCE_OPERATIONS,
  callResourceOperation,
} = require("./gcp-lib");
const helpers = require("./helpers");

function createHealthCheckResource(name, type) {
  return {
    healthCheckResource: {
      name,
      type,
      httpHealthCheck: {},
    },
  };
}

async function createBackendServiceResource(action, credentials, project) {
  const backendServiceResource = {
    backendServiceResource: {
      name: action.params.backendServiceName,
      backends: [
        {
          group: (await callResourceOperation(
            RESOURCE_OPERATIONS.get,
            GCCompute.InstanceGroupsClient,
            credentials,
            project,
            {
              zone: action.params.zone.value,
              instanceGroup: action.params.instanceGroupName.value,
            },
          )).selfLink,
        },
      ],
      healthChecks: [
        (await callResourceOperation(
          RESOURCE_OPERATIONS.get,
          GCCompute.HealthChecksClient,
          credentials,
          project,
          {
            zone: action.params.zone.value,
            healthCheck: action.params.healthCheckName,
          },
        )).selfLink,
      ],
    },
  };
  return backendServiceResource;
}

async function createUrlMapResource(action, credentials, project) {
  const urlMapResource = {
    urlMapResource: {
      name: action.params.urlMapName,
      defaultService: (await callResourceOperation(
        RESOURCE_OPERATIONS.get,
        GCCompute.BackendServicesClient,
        credentials,
        project,
        {
          backendService: action.params.backendServiceName,
        },
      )).selfLink,
    },
  };
  return urlMapResource;
}

async function createTargetHttpProxyResource(action, credentials, project) {
  const targetHttpProxyResource = {
    targetHttpProxyResource:
      {
        name: action.params.httpProxyName,
        urlMap: (await callResourceOperation(
          RESOURCE_OPERATIONS.get,
          GCCompute.UrlMapsClient,
          credentials,
          project,
          {
            urlMap: action.params.urlMapName,
          },
        )).selfLink,
      },
  };
  return targetHttpProxyResource;
}

async function createTargetHttpsProxyResource(action, credentials, project) {
  const sslCertificateURL = (await callResourceOperation(
    RESOURCE_OPERATIONS.get,
    GCCompute.SslCertificatesClient,
    credentials,
    project,
    {
      sslCertificate: action.params.sslCertificateName.value,
    },
  )).selfLink;

  const targetHttpsProxyResource = {
    targetHttpsProxyResource:
      {
        name: action.params.httpsProxyName,
        urlMap: (await callResourceOperation(
          RESOURCE_OPERATIONS.get,
          GCCompute.UrlMapsClient,
          credentials,
          project,
          {
            urlMap: action.params.urlMapName,
          },
        )).selfLink,
        sslCertificates: [sslCertificateURL],
      },
  };
  return targetHttpsProxyResource;
}

async function createForwardingRuleResource(action, credentials, project) {
  let target;
  if (action.params.httpProxyName) {
    target = (await callResourceOperation(
      RESOURCE_OPERATIONS.get,
      GCCompute.TargetHttpProxiesClient,
      credentials,
      project,
      { targetHttpProxy: action.params.httpProxyName },
    )).selfLink;
  } else {
    target = (await callResourceOperation(
      RESOURCE_OPERATIONS.get,
      GCCompute.TargetHttpsProxiesClient,
      credentials,
      project,
      { targetHttpsProxy: action.params.httpsProxyName },
    )).selfLink;
  }

  const forwardingRuleResource = {
    forwardingRuleResource: {
      name: action.params.forwardingRuleName,
      target,
      portRange: action.params.forwardRulePortRange,
      loadBalancingScheme: "EXTERNAL",
    },
  };
  return forwardingRuleResource;
}

async function rollback(createdResources, credentials, project) {
  const resourcesToRollback = _.reverse(createdResources);
  // eslint-disable-next-line no-restricted-syntax
  for (const resourceToRollback of resourcesToRollback) {
    const resource = {};
    resource[resourceToRollback.typeProperty] = resourceToRollback.name;
    try {
      // eslint-disable-next-line no-await-in-loop
      await callResourceOperation(
        RESOURCE_OPERATIONS.delete,
        resourceToRollback.client,
        credentials,
        project,
        resource,
        true,
      );
    } catch (rollbackError) {
      console.error(rollbackError, "Rollback failed ");
    }
  }
}

async function createGCPServices(loadBalancerResourcesData, action, credentials, project) {
  const results = {};
  const createdResources = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const resourceData of loadBalancerResourcesData) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const resource = await resourceData.createResourceFunc(
        action,
        credentials,
        project,
      );
      const { client } = resourceData;
      // eslint-disable-next-line no-await-in-loop
      await callResourceOperation(
        RESOURCE_OPERATIONS.create,
        client,
        credentials,
        project,
        resource,
        true,
      );
      const { name } = resource[_.findKey(resource, "name")];
      createdResources.push({ ...resourceData, name });
    } catch (err) {
      if (createdResources.length > 0) {
        console.error("Starting rollback");
        // eslint-disable-next-line no-await-in-loop
        await rollback(createdResources, credentials, project);
      }
      throw err;
    }
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const resourceData of createdResources) {
    const resource = { zone: action.params.zone.value };
    resource[resourceData.typeProperty] = resourceData.name;

    // eslint-disable-next-line no-await-in-loop
    const createdResource = await callResourceOperation(
      RESOURCE_OPERATIONS.get,
      resourceData.client,
      credentials,
      project,
      resource,
    );
    results[createdResource.kind] = createdResource;
  }

  return results;
}

function createLoadBalancerResourcesData(proxyType) {
  return [
    { client: GCCompute.HealthChecksClient, createResourceFunc: (action) => createHealthCheckResource(action.params.healthCheckName, action.params.type), typeProperty: "healthCheck" },
    { client: GCCompute.BackendServicesClient, createResourceFunc: createBackendServiceResource, typeProperty: "backendService" },
    { client: GCCompute.UrlMapsClient, createResourceFunc: createUrlMapResource, typeProperty: "urlMap" },
    proxyType === "http"
      ? { client: GCCompute.TargetHttpProxiesClient, createResourceFunc: createTargetHttpProxyResource, typeProperty: "targetHttpProxy" }
      : { client: GCCompute.TargetHttpsProxiesClient, createResourceFunc: createTargetHttpsProxyResource, typeProperty: "targetHttpsProxy" },
    { client: GCCompute.GlobalForwardingRulesClient, createResourceFunc: createForwardingRuleResource, typeProperty: "forwardingRule" },
  ];
}

module.exports = {
  runHttpExternalLoadBalancerCreation: (action, settings) => createGCPServices(
    createLoadBalancerResourcesData("http"),
    action,
    helpers.getCredentials(action.params, settings),
    helpers.getProject(action.params, settings),
  ),
  runHttpsExternalLoadBalancerCreation: (action, settings) => createGCPServices(
    createLoadBalancerResourcesData("https"),
    action,
    helpers.getCredentials(action.params, settings),
    helpers.getProject(action.params, settings),
  ),
};
