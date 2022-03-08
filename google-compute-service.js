const GCCompute = require("@google-cloud/compute");
const { ProjectsClient } = require("@google-cloud/resource-manager");
const parsers = require("./parsers");
const { removeUndefinedAndEmpty } = require("./helpers");
const GoogleComputeLib = require("./google-compute-lib");

module.exports = class GoogleComputeService {
  /**
   * Create a Google Cloud Compute service instance
   * @param {object} credentials The credentials of a service account to use to make the request
   * @param {string} projectId The ID of the project to make all the requests about.
   */
  constructor(credentials, projectId) {
    this.projectId = projectId;
    this.credentials = credentials;
  }

  /**
   * Get Google Compute Service Client from Kaholo action and settings objects
   * @param {object} params Kaholo Action Params Object
   * @param {string} settings Kaholo Settings Object
   * @return {GoogleComputeService} The Google Compute Service Client
   */
  static from(params, settings) {
    const creds = parsers.object(params.creds || settings.creds);
    if (!creds) { throw new Error("Must provide credentials to call any method in the plugin!"); }
    const project = parsers.autocomplete(params.project || settings.project) || undefined;
    return new GoogleComputeService(creds, project);
  }

  async createHealthCheck(action) {
    const healthChecksClient = new GCCompute.HealthChecksClient({ credentials: this.credentials });
    const operationsClient = new GCCompute.GlobalOperationsClient(
      { credentials: this.credentials },
    );
    const healthCheckResource = {
      name: action.params.healthCheckName,
      type: action.params.type,
      httpHealthCheck: {},
    };

    const request = {
      healthCheckResource,
      project: this.projectId,
    };

    let [operation] = await healthChecksClient.insert(request);
    while (operation.status !== "DONE") {
      // eslint-disable-next-line no-await-in-loop
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: this.projectId,
      });
    }

    const response = healthChecksClient.get({
      healthCheck: action.params.healthCheckName,
      project: this.projectId,
    });

    return response;
  }

  async createBackendService(action) {
    const backendServiceClient = new GCCompute.BackendServicesClient(
      { credentials: this.credentials },
    );

    const operationsClient = new GCCompute.GlobalOperationsClient(
      { credentials: this.credentials },
    );

    const backendServiceResource = {
      name: action.params.backendServiceName,
      backends: [
        {
          group: await this.getInstanceGroupURL(action.params),
        },
      ],
      healthChecks: [
        await this.getHealthCheckURL(action.params.healthCheckName),
      ],
    };

    const request = {
      backendServiceResource,
      project: this.projectId,
    };

    let [operation] = await backendServiceClient.insert(request);
    while (operation.status !== "DONE") {
      // eslint-disable-next-line no-await-in-loop
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: this.projectId,
      });
    }

    const response = await backendServiceClient.get({
      backendService: action.params.backendServiceName,
      project: this.projectId,
    });

    return response;
  }

  async createUrlMap(action) {
    const urlMapServiceClient = new GCCompute.UrlMapsClient({ credentials: this.credentials });
    const operationsClient = new GCCompute.GlobalOperationsClient(
      { credentials: this.credentials },
    );

    const urlMapResource = {
      name: action.params.urlMapName,
      defaultService: await this.getBackendServiceURL(action.params),
    };

    const request = {
      urlMapResource,
      project: this.projectId,
    };

    let [operation] = await urlMapServiceClient.insert(request);
    while (operation.status !== "DONE") {
      // eslint-disable-next-line no-await-in-loop
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: this.projectId,
      });
    }

    const response = await urlMapServiceClient.get({
      urlMap: action.params.urlMapName,
      project: this.projectId,
    });

    return response;
  }

  async createTargetHttpProxy(action) {
    const httpProxyClient = new GCCompute.TargetHttpProxiesClient(
      { credentials: this.credentials },
    );

    const operationsClient = new GCCompute.GlobalOperationsClient(
      { credentials: this.credentials },
    );

    const targetHttpProxyResource = {
      name: action.params.httpProxyName,
      urlMap: await this.getUrlMapURL(action.params),
    };

    const request = {
      targetHttpProxyResource,
      project: this.projectId,
    };

    let [operation] = await httpProxyClient.insert(request);
    while (operation.status !== "DONE") {
      // eslint-disable-next-line no-await-in-loop
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: this.projectId,
      });
    }

    const response = await httpProxyClient.get({
      targetHttpProxy: action.params.httpProxyName,
      project: this.projectId,
    });

    return response;
  }

  async createTargetHttpsProxy(action) {
    const httpsProxyClient = new GCCompute.TargetHttpsProxiesClient(
      { credentials: this.credentials },
    );

    const operationsClient = new GCCompute.GlobalOperationsClient(
      { credentials: this.credentials },
    );

    const sslCertificateURL = await this.getSSLCertificateURL(action.params);
    const targetHttpsProxyResource = {
      name: action.params.httpsProxyName,
      urlMap: await this.getUrlMapURL(action.params),
      sslCertificates: [sslCertificateURL],
    };

    const request = {
      targetHttpsProxyResource,
      project: this.projectId,
    };

    let [operation] = await httpsProxyClient.insert(request);
    while (operation.status !== "DONE") {
      // eslint-disable-next-line no-await-in-loop
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: this.projectId,
      });
    }

    const response = await httpsProxyClient.get({
      targetHttpsProxy: action.params.httpsProxyName,
      project: this.projectId,
    });

    return response;
  }

  async createForwardRules(action) {
    const forwardingRulesClient = new GCCompute.GlobalForwardingRulesClient(
      { credentials: this.credentials },
    );
    const operationsClient = new GCCompute.GlobalOperationsClient(
      { credentials: this.credentials },
    );

    const target = action.params.httpProxyName
      ? await this.getTargetHttpProxyURL(action.params)
      : await this.getTargetHttpsProxyURL(action.params);

    const forwardingRuleResource = {
      name: action.params.forwardingRuleName,
      target,
      portRange: action.params.forwardRulePortRange,
      loadBalancingScheme: "EXTERNAL",
    };

    const request = {
      forwardingRuleResource,
      project: this.projectId,
    };

    let [operation] = await forwardingRulesClient.insert(request);
    while (operation.status !== "DONE") {
      // eslint-disable-next-line no-await-in-loop
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: this.projectId,
      });
    }

    const response = await forwardingRulesClient.get({
      forwardingRule: action.params.forwardingRuleName,
      project: this.projectId,
    });

    return response;
  }

  async listProjects(params) {
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

  async listZones(params) {
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

  async listInstanceGroups(params) {
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

  async listSSLCertificates(params) {
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

  async getHealthCheckURL(healthCheckName) {
    const healthChecksClient = new GCCompute.HealthChecksClient({ credentials: this.credentials });

    const request = {
      project: this.projectId,
      healthCheck: healthCheckName,
    };

    const iterable = await healthChecksClient.get(request);
    const res = [];

    try {
      // eslint-disable-next-line no-restricted-syntax
      for await (const response of iterable) {
        res.push(response);
      }
    } catch (err) {
      return Promise.reject(err);
    }
    return res[0].selfLink;
  }

  async getInstanceGroupURL(params) {
    const instanceGroupsClient = new GCCompute.InstanceGroupsClient({
      credentials: this.credentials,
    });

    const request = {
      project: this.projectId,
      zone: params.zone.value,
      instanceGroup: params.instanceGroupName.value,
    };

    const res = [];
    const iterable = await instanceGroupsClient.get(request);

    try {
      // eslint-disable-next-line no-restricted-syntax
      for await (const response of iterable) {
        res.push(response);
      }
    } catch (err) {
      return Promise.reject(err);
    }
    return res[0].selfLink;
  }

  async getBackendServiceURL(params) {
    const backendServiceClient = new GCCompute.BackendServicesClient(
      { credentials: this.credentials },
    );
    const backendService = params.backendServiceName;

    const request = {
      backendService,
      project: this.projectId,
    };

    const res = [];
    const iterable = await backendServiceClient.get(request);

    try {
      // eslint-disable-next-line no-restricted-syntax
      for await (const response of iterable) {
        res.push(response);
      }
    } catch (err) {
      return Promise.reject(err);
    }
    return res[0].selfLink;
  }

  async getUrlMapURL(params) {
    const urlMapServiceClient = new GCCompute.UrlMapsClient({ credentials: this.credentials });

    const urlMap = params.urlMapName;

    const request = {
      urlMap,
      project: this.projectId,
    };

    const res = [];
    const iterable = await urlMapServiceClient.get(request);

    try {
      // eslint-disable-next-line no-restricted-syntax
      for await (const response of iterable) {
        res.push(response);
      }
    } catch (err) {
      return Promise.reject(err);
    }
    return res[0].selfLink;
  }

  async getTargetHttpProxyURL(params) {
    const httpProxyClient = new GCCompute.TargetHttpProxiesClient(
      { credentials: this.credentials },
    );

    const targetHttpProxy = params.httpProxyName;

    const request = {
      targetHttpProxy,
      project: this.projectId,
    };

    const res = [];
    const iterable = await httpProxyClient.get(request);

    try {
      // eslint-disable-next-line no-restricted-syntax
      for await (const response of iterable) {
        res.push(response);
      }
    } catch (err) {
      return Promise.reject(err);
    }
    return res[0].selfLink;
  }

  async getTargetHttpsProxyURL(params) {
    const httpsProxyClient = new GCCompute.TargetHttpsProxiesClient(
      { credentials: this.credentials },
    );

    const targetHttpsProxy = params.httpsProxyName;

    const request = {
      targetHttpsProxy,
      project: this.projectId,
    };

    const res = [];
    const iterable = await httpsProxyClient.get(request);

    try {
      // eslint-disable-next-line no-restricted-syntax
      for await (const response of iterable) {
        res.push(response);
      }
    } catch (err) {
      return Promise.reject(err);
    }
    return res[0].selfLink;
  }

  async getSSLCertificateURL(params) {
    const sslCertificatesClient = new GCCompute.SslCertificatesClient(
      { credentials: this.credentials },
    );

    const sslCertificate = params.sslCertificateName.value;

    const request = {
      sslCertificate,
      project: this.projectId,
    };

    const res = [];
    const iterable = await sslCertificatesClient.get(request);

    try {
      // eslint-disable-next-line no-restricted-syntax
      for await (const response of iterable) {
        res.push(response);
      }
    } catch (err) {
      return Promise.reject(err);
    }
    return res[0].selfLink;
  }

  async deleteHealthCheck(action) {
    const healthChecksClient = new GCCompute.HealthChecksClient({ credentials: this.credentials });
    const operationsClient = new GCCompute.GlobalOperationsClient(
      { credentials: this.credentials },
    );

    const request = {
      healthCheck: action.params.healthCheckName,
      project: this.projectId,
    };

    let [operation] = await healthChecksClient.delete(request);
    while (operation.status !== "DONE") {
      // eslint-disable-next-line no-await-in-loop
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: this.projectId,
      });
    }
  }

  async deleteBackendService(action) {
    const backendServiceClient = new GCCompute.BackendServicesClient(
      { credentials: this.credentials },
    );
    const operationsClient = new GCCompute.GlobalOperationsClient(
      { credentials: this.credentials },
    );

    const request = {
      backendService: action.params.backendServiceName,
      project: this.projectId,
    };

    let [operation] = await backendServiceClient.delete(request);
    while (operation.status !== "DONE") {
      // eslint-disable-next-line no-await-in-loop
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: this.projectId,
      });
    }
  }

  async deleteUrlMap(action) {
    const urlMapServiceClient = new GCCompute.UrlMapsClient({ credentials: this.credentials });
    const operationsClient = new GCCompute.GlobalOperationsClient(
      { credentials: this.credentials },
    );

    const request = {
      urlMap: action.params.urlMapName,
      project: this.projectId,
    };

    let [operation] = await urlMapServiceClient.delete(request);
    while (operation.status !== "DONE") {
      // eslint-disable-next-line no-await-in-loop
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: this.projectId,
      });
    }
  }

  async deleteTargetHttpProxy(action) {
    const httpProxyClient = new GCCompute.TargetHttpProxiesClient(
      { credentials: this.credentials },
    );
    const operationsClient = new GCCompute.GlobalOperationsClient(
      { credentials: this.credentials },
    );

    const request = {
      targetHttpProxy: action.params.httpProxyName,
      project: this.projectId,
    };

    let [operation] = await httpProxyClient.delete(request);
    while (operation.status !== "DONE") {
      // eslint-disable-next-line no-await-in-loop
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: this.projectId,
      });
    }
  }

  async deleteTargetHttpsProxy(action) {
    const httpsProxyClient = new GCCompute.TargetHttpsProxiesClient(
      { credentials: this.credentials },
    );
    const operationsClient = new GCCompute.GlobalOperationsClient(
      { credentials: this.credentials },
    );

    const request = {
      targetHttpsProxy: action.params.httpsProxyName,
      project: this.projectId,
    };

    let [operation] = await httpsProxyClient.delete(request);
    while (operation.status !== "DONE") {
      // eslint-disable-next-line no-await-in-loop
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: this.projectId,
      });
    }
  }

  async deleteForwardRules(action) {
    const forwardingRulesClient = new GCCompute.GlobalForwardingRulesClient(
      { credentials: this.credentials },
    );
    const operationsClient = new GCCompute.GlobalOperationsClient(
      { credentials: this.credentials },
    );

    const request = {
      forwardingRule: action.params.forwardingRuleName,
      project: this.projectId,
    };

    let [operation] = await forwardingRulesClient.delete(request);
    while (operation.status !== "DONE") {
      // eslint-disable-next-line no-await-in-loop
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: this.projectId,
      });
    }
  }

  // order is important, since this components depend on each other
  deleteHttpExternalLBFunctions = [
    this.deleteForwardRules.bind(this),
    this.deleteTargetHttpProxy.bind(this),
    this.deleteUrlMap.bind(this),
    this.deleteBackendService.bind(this),
    this.deleteHealthCheck.bind(this),
  ];

  async rollbackHttpExternalLB(results, action, settings) {
    const deleteLoadBalancerFuncs = this.deleteHttpExternalLBFunctions.slice(-results.length);
    // eslint-disable-next-line no-restricted-syntax
    for (const deleteLoadBalancerFunction of deleteLoadBalancerFuncs) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await deleteLoadBalancerFunction(action, settings);
      } catch (err) {
        console.error(err, "Rollback failed");
      }
    }
  }

  // order is important, since this components depend on each other
  deleteHttpsExternalLBFunctions = [
    this.deleteForwardRules.bind(this),
    this.deleteTargetHttpsProxy.bind(this),
    this.deleteUrlMap.bind(this),
    this.deleteBackendService.bind(this),
    this.deleteHealthCheck.bind(this),
  ];

  async rollbackHttpsExternalLB(results, action, settings) {
    const deleteLoadBalancerFuncs = this.deleteHttpsExternalLBFunctions.slice(-results.length);
    // eslint-disable-next-line no-restricted-syntax
    for (const deleteLoadBalancerFunction of deleteLoadBalancerFuncs) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await deleteLoadBalancerFunction(action, settings);
      } catch (err) {
        console.error(`${deleteLoadBalancerFunction.name} rollback failed: `, err);
      }
    }
  }
};
