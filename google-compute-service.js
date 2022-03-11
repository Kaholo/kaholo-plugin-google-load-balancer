const GCCompute = require("@google-cloud/compute");
const { ProjectsClient } = require("@google-cloud/resource-manager");
const parsers = require("./parsers");
const { removeUndefinedAndEmpty } = require("./helpers");
const _ = require("lodash");

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

  async listHealthChecks() {
    const client = new GCCompute.HealthChecksClient({
      credentials: this.credentials,
    });

    const request = {
      project: this.projectId,
    };

    const res = [];
    const iterable = await client.listAsync(request);

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

  async listBackendServices() {
    const client = new GCCompute.BackendServicesClient({
      credentials: this.credentials,
    });

    const request = {
      project: this.projectId,
    };

    const res = [];
    const iterable = await client.listAsync(request);

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

  async listUrlMaps() {
    const client = new GCCompute.UrlMapsClient({
      credentials: this.credentials,
    });

    const request = {
      project: this.projectId,
    };

    const res = [];
    const iterable = await client.listAsync(request);

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

  async listTargetHttpProxy() {
    const client = new GCCompute.TargetHttpProxiesClient({
      credentials: this.credentials,
    });

    const request = {
      project: this.projectId,
    };

    const res = [];
    const iterable = await client.listAsync(request);

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

  async listTargetHttpsProxy() {
    const client = new GCCompute.TargetHttpsProxiesClient({
      credentials: this.credentials,
    });

    const request = {
      project: this.projectId,
    };

    const res = [];
    const iterable = await client.listAsync(request);

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

  async listForwardingRules() {
    const client = new GCCompute.GlobalForwardingRulesClient({
      credentials: this.credentials,
    });

    const request = {
      project: this.projectId,
    };

    const res = [];
    const iterable = await client.listAsync(request);

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

  async listForwardingRules2(ClientClass, credentials, project, resource = {} ) {
    const client = new ClientClass({
      credentials,
    });

    const request = _.merge({ project }, resource);

    const res = [];
    const iterable = await client.listAsync(request);

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
};
