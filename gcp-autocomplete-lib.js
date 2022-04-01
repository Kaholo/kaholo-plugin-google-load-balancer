const GCCompute = require("@google-cloud/compute");
const { ProjectsClient } = require("@google-cloud/resource-manager");
const _ = require("lodash");

const {
  callMethod,
} = require("./gcp-lib");
const parsers = require("./parsers");
const helpers = require("./helpers");

function createListItemsFunction(clientClass, fields) {
  return async function listGcpItems(query, pluginSettings, pluginParams) {
    const { result } = await getListResults(fields, pluginSettings, pluginParams, clientClass);
    return result;
  };
}

async function listGcpProjects(query, pluginSettings, pluginParams) {
  const { result } = await getProjects(["projectId", "displayName"], pluginSettings, pluginParams);
  return result;
}

async function listGcpRegions(query, pluginSettings, pluginParams) {
  const { result } = await getListResults(["name"], pluginSettings, pluginParams, GCCompute.RegionsClient);
  return result;
}

async function listGcpZones(query, pluginSettings, pluginParams) {
  const { result, params } = await getListResults(["name"], pluginSettings, pluginParams, GCCompute.ZonesClient);

  const region = parsers.autocomplete(params.region);
  result.filter((zone) => !region || zone.name.includes(region));

  return result;
}

async function getProjects(fields, pluginSettings, pluginParams) {
  const parseFunc = helpers.getParseFromParam(...fields);
  const settings = helpers.mapAutoParams(pluginSettings);
  const params = helpers.mapAutoParams(pluginParams);

  let result = await searchProjects(params, settings);
  result = [...result.map(parseFunc)];
  return { params, result };
}

async function searchProjects(params, settings) {
  const credentials = helpers.getCredentials(params, settings);
  const authorizedClient = helpers.getAuthorizedClient(ProjectsClient, credentials);
  const { query } = params;

  const request = { query: query ? `name:*${query}*` : undefined };

  const iterable = await _.partial(callMethod, "searchProjectsAsync")(authorizedClient, request);
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

async function getListResults(fields, pluginSettings, pluginParams, clientClass) {
  const parseFunc = helpers.getParseFromParam(...fields);
  const settings = helpers.mapAutoParams(pluginSettings);
  const params = helpers.mapAutoParams(pluginParams);

  let result = await listResources(params, settings, clientClass);
  result = [...result.map(parseFunc)];
  return { params, result };
}

async function listResources(params, settings, clientClass, resource = {}) {
  const credentials = helpers.getCredentials(params, settings);
  const project = helpers.getProject(params, settings);
  const region = helpers.getRegion(params);
  const zone = helpers.getZone(params);
  const authorizedClient = helpers.getAuthorizedClient(clientClass, credentials);

  const request = _.merge({ project, region, zone }, resource);

  const res = [];
  const iterable = await _.partial(callMethod, "listAsync")(authorizedClient, request);

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
  createListItemsFunction,
  listGcpProjects,
  listGcpRegions,
  listGcpZones,
};
