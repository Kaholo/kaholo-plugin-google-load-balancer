const GCCompute = require("@google-cloud/compute");
const { ProjectsClient } = require("@google-cloud/resource-manager");
const { JWT } = require("google-auth-library");

const parsers = require("./parsers");
const { removeUndefinedAndEmpty } = require("./helpers");

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
    try {
      const healthCheckResource = {
        name: action.params.healthCheckName,
        type: action.params.type,
        httpHealthCheck: {
        },
      };

      // Construct request
      const request = {
        healthCheckResource,
        project: this.projectId,
        // project: action.params.project || settings.project,
      };

      // Run request
      // const response = await healthChecksClient.insert(request);
      let [operation] = await healthChecksClient.insert(request);
      while (operation.status === "DONE") {
        [operation] = await operationsClient.wait({
          operation: operation.name,
          project: this.projectId,
        });
      }

      const [response] = await healthChecksClient.get({
        healthCheck: action.params.healthCheckName,
        project: this.projectId,
      });

      return Promise.resolve(response);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async createBackendService(action) {
    const backendServiceClient = new GCCompute.BackendServicesClient(
      { credentials: this.credentials },
    );

    const operationsClient = new GCCompute.GlobalOperationsClient(
      { credentials: this.credentials },
    );

    try {
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

      // const response = await backendServiceClient.insert(request);
      let [operation] = await backendServiceClient.insert(request);
      while (operation.status !== "DONE") {
        [operation] = await operationsClient.wait({
          operation: operation.name,
          project: this.projectId,
        });
      }

      const [response] = await backendServiceClient.get({
        backendService: action.params.backendServiceName,
        project: this.projectId,
      });

      return Promise.resolve(response);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async createUrlMap(action) {
    const urlMapServiceClient = new GCCompute.UrlMapsClient({ credentials: this.credentials });
    const operationsClient = new GCCompute.GlobalOperationsClient(
      { credentials: this.credentials },
    );

    try {
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
        [operation] = await operationsClient.wait({
          operation: operation.name,
          project: this.projectId,
        });
      }

      const [response] = await urlMapServiceClient.get({
        urlMap: action.params.urlMapName,
        project: this.projectId,
      });

      return Promise.resolve(response);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async createTargetHttpProxy(action) {
    const httpProxyClient = new GCCompute.TargetHttpProxiesClient(
      { credentials: this.credentials },
    );

    const operationsClient = new GCCompute.GlobalOperationsClient(
      { credentials: this.credentials },
    );

    try {
      const httpProxyResource = {
        name: action.params.httpProxyName,
        urlMap: await this.getUrlMapURL(action.params),
      };

      const request = {
        httpProxyResource,
        project: this.projectId,
      };

      let [operation] = await httpProxyClient.insert(request);
      while (operation.status !== "DONE") {
        [operation] = await operationsClient.wait({
          operation: operation.name,
          project: this.projectId,
        });
      }

      const [response] = await httpProxyClient.get({
        targetHttpProxy: action.params.httpProxyName,
        project: this.projectId,
      });

      return Promise.resolve(response);
    } catch (err) {
      return Promise.reject(err);
    }
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

    const { urlMapName } = params;

    const request = {
      urlMapName,
      project: this.projectId,
    };

    const res = [];
    const iterable = await urlMapServiceClient.get(request);

    try {
      for await (const response of iterable) {
        res.push(response);
      }
    } catch (err) {
      return Promise.reject(err);
    }
    return res[0].selfLink;
  }
};
