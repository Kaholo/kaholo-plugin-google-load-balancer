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
    const project = parsers.autocomplete(params.project) || undefined;
    return new GoogleComputeService(creds, project);
  }

  async createHealthCheck(action, settings) {
    const healthChecksClient = new GCCompute.HealthChecksClient();

    try {
      const healthCheckResource = {
        name: action.params.name,
        type: action.params.type,
        httpHealthCheck: {},
      };

      // Construct request
      const request = {
        healthCheckResource,
        project: action.params.project || settings.project,
      };

      // Run request
      const response = await healthChecksClient.insert(request);
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
};
