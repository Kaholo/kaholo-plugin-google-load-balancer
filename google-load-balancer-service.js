const GCCompute = require("@google-cloud/compute");
const _ = require("lodash");
const {
  getResource,
  createResourceWaitForCreation,
  deleteResource,
  deleteResourceWaitForDeletion,
} = require("./google-compute-lib");
const parsers = require("./parsers");
const { removeUndefinedAndEmpty } = require("./helpers");
const { ProjectsClient } = require("@google-cloud/resource-manager");

function createHealthCheckResource(action) {
  return {
    healthCheckResource: {
      name: action.params.healthCheckName,
      type: action.params.type,
      httpHealthCheck: {},
    },
  };
}
async function createBackendServiceResource(action, settings) {
  const backendServiceResource = {
    backendServiceResource: {
      name: action.params.backendServiceName,
      backends: [
        {
          group: (await getResource(
            action.params,
            settings,
            GCCompute.InstanceGroupsClient,
            {
              zone: action.params.zone.value,
              instanceGroup: action.params.instanceGroupName.value,
            },
          )).selfLink,
        },
      ],
      healthChecks: [
        (await getResource(
          action.params,
          settings,
          GCCompute.HealthChecksClient,
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
async function createUrlMapResource(action, settings) {
  const urlMapResource = {
    urlMapResource: {
      name: action.params.urlMapName,
      defaultService: (await getResource(
        action.params,
        settings,
        GCCompute.BackendServicesClient,
        {
          backendService: action.params.backendServiceName,
        },
      )).selfLink,
    },
  };
  return urlMapResource;
}
async function createTargetHttpProxyResource(action, settings) {
  const targetHttpProxyResource = {
    targetHttpProxyResource:
      {
        name: action.params.httpProxyName,
        urlMap: (await getResource(
          action.params,
          settings,
          GCCompute.UrlMapsClient,
          {
            urlMap: action.params.urlMapName,
          },
        )).selfLink,
      },
  };
  return targetHttpProxyResource;
}
async function createTargetHttpsProxyResource(action, settings) {
  const sslCertificateURL = (await getResource(
    action.params,
    settings,
    GCCompute.SslCertificatesClient,
    {
      sslCertificate: action.params.sslCertificateName.value,
    },
  )).selfLink;

  const targetHttpsProxyResource = {
    targetHttpsProxyResource:
      {
        name: action.params.httpsProxyName,
        urlMap: (await getResource(
          action.params,
          settings,
          GCCompute.UrlMapsClient,
          {
            urlMap: action.params.urlMapName,
          },
        )).selfLink,
        sslCertificates: [sslCertificateURL],
      },
  };
  return targetHttpsProxyResource;
}
async function createForwardingRuleResource(action, settings) {
  let target;
  if (action.params.httpProxyName) {
    target = (await getResource(
      action.params,
      settings,
      GCCompute.TargetHttpProxiesClient,
      { targetHttpProxy: action.params.httpProxyName },
    )).selfLink;
  } else {
    target = (await getResource(
      action.params,
      settings,
      GCCompute.TargetHttpsProxiesClient,
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

async function rollback(createdResources, action, settings) {
  const resourcesToRollback = _.reverse(createdResources);
  // eslint-disable-next-line no-restricted-syntax
  for (const resourceToRollback of resourcesToRollback) {
    const resource = {};
    resource[resourceToRollback.typeProperty] = resourceToRollback.name;
    try {
      // eslint-disable-next-line no-await-in-loop
      await deleteResourceWaitForDeletion(
        action.params,
        settings,
        resourceToRollback.client,
        resource,
      );
    } catch (rollbackError) {
      console.error(rollbackError, "Rollback failed ");
    }
  }
}

async function createGCPServices(loadBalancerResourcesData, action, settings) {
  const results = {};
  const createdResources = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const resourceData of loadBalancerResourcesData) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const resource = await resourceData.createResourceFunc(action, settings);
      const { client } = resourceData;
      // eslint-disable-next-line no-await-in-loop
      await createResourceWaitForCreation(
        action.params,
        settings,
        client,
        resource,
      );
      const { name } = resource[_.findKey(resource, "name")];
      createdResources.push({ ...resourceData, name });
    } catch (err) {
      if (createdResources.length > 0) {
        console.error("Starting rollback");
        // eslint-disable-next-line no-await-in-loop
        await rollback(createdResources, action, settings);
      }
      throw err;
    }
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const resourceData of createdResources) {
    const resource = { zone: action.params.zone.value };
    resource[resourceData.typeProperty] = resourceData.name;

    // eslint-disable-next-line no-await-in-loop
    const createdResource = await getResource(
      action.params,
      settings,
      resourceData.client,
      resource,
    );
    results[createdResource.kind] = createdResource;
  }

  return results;
}

async function runHttpExternalLoadBalancerCreation(action, settings) {
  const loadBalancerResourcesData = [
    { client: GCCompute.HealthChecksClient, createResourceFunc: createHealthCheckResource, typeProperty: "healthCheck" },
    { client: GCCompute.BackendServicesClient, createResourceFunc: createBackendServiceResource, typeProperty: "backendService" },
    { client: GCCompute.UrlMapsClient, createResourceFunc: createUrlMapResource, typeProperty: "urlMap" },
    { client: GCCompute.TargetHttpProxiesClient, createResourceFunc: createTargetHttpProxyResource, typeProperty: "targetHttpProxy" },
    { client: GCCompute.GlobalForwardingRulesClient, createResourceFunc: createForwardingRuleResource, typeProperty: "forwardingRule" },
  ];

  const result = await createGCPServices(loadBalancerResourcesData, action, settings);
  return result;
}

async function runHttpsExternalLoadBalancerCreation(action, settings) {
  const loadBalancerResourcesData = [
    { client: GCCompute.HealthChecksClient, createResourceFunc: createHealthCheckResource, typeProperty: "healthCheck" },
    { client: GCCompute.BackendServicesClient, createResourceFunc: createBackendServiceResource, typeProperty: "backendService" },
    { client: GCCompute.UrlMapsClient, createResourceFunc: createUrlMapResource, typeProperty: "urlMap" },
    { client: GCCompute.TargetHttpsProxiesClient, resource: createTargetHttpsProxyResource, typeProperty: "targetHttpsProxy" },
    { client: GCCompute.GlobalForwardingRulesClient, createResourceFunc: createForwardingRuleResource, typeProperty: "forwardingRule" },
  ];
  const result = await createGCPServices(loadBalancerResourcesData, action, settings);
  return result;
}

async function listProjects(params) {
  const projectsClient = new ProjectsClient({ credentials: this.credentials });
  const { query } = params;

  const request = removeUndefinedAndEmpty({
    query: query ? `name:*${query}*` : undefined,
  });

  const iterable = projectsClient.searchProjectsAsync(request);
  const res = [];

  try {
    // eslint-disable-next-line no-restricted-syntax
    for await (const proj of iterable) {
      res.push(proj);
    }
  } catch (error) {
    return Promise.reject(error);
  }

  return res;
}

async function listZones(params) {
  const zonesClient = new GCCompute.ZonesClient({ credentials: this.credentials });
  const region = parsers.autocomplete(params.region);

  const request = removeUndefinedAndEmpty({
    project: this.projectId,
  });

  const iterable = zonesClient.listAsync(request);
  const res = [];

  try {
    // eslint-disable-next-line no-restricted-syntax
    for await (const zone of iterable) {
      res.push(zone);
    }
  } catch (error) {
    return Promise.reject(error);
  }

  return res.filter((zone) => !region || zone.name.includes(region));
}

async function listInstanceGroups(params) {
  const instanceGroupsClient = new GCCompute.InstanceGroupsClient({
    credentials: this.credentials,
  });

  const request = {
    project: this.projectId,
    zone: params.zone,
  };

  const res = [];
  const iterable = await instanceGroupsClient.listAsync(request);

  try {
    // eslint-disable-next-line no-restricted-syntax
    for await (const response of iterable) {
      res.push({ id: response.id, name: response.name });
    }
  } catch (err) {
    return Promise.reject(err);
  }
  return res;
}

async function listSSLCertificates(params) {
  const sslCertificatesClient = new GCCompute.SslCertificatesClient({
    credentials: this.credentials,
  });

  const request = {
    project: this.projectId,
    zone: params.zone,
  };

  const res = [];
  const iterable = await sslCertificatesClient.listAsync(request);

  try {
    // eslint-disable-next-line no-restricted-syntax
    for await (const response of iterable) {
      res.push({ id: response.id, name: response.name });
    }
  } catch (err) {
    return Promise.reject(err);
  }
  return res;
}

module.exports = {
  runHttpExternalLoadBalancerCreation,
  runHttpsExternalLoadBalancerCreation,
};
