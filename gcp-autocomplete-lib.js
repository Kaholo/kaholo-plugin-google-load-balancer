const GCCompute = require("@google-cloud/compute");
const { ProjectsClient } = require("@google-cloud/resource-manager");
const _ = require("lodash");

const {
  RESOURCE_OPERATIONS,
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
  return getProjects(["projectId", "displayName"], pluginSettings, pluginParams);
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

  const credentials = helpers.getCredentials(params, settings);
  const authorizedClient = helpers.getAuthorizedClient(ProjectsClient, credentials);

  const projectsResult = await searchProjects(params.query, credentials, authorizedClient);
  return projectsResult.map(parseFunc);
}

async function searchProjects(query, credentials, authorizedClient) {
  const request = {};
  if (query) {
    request.query = `name:*${query}*`;
  }

  const iterable = await RESOURCE_OPERATIONS.searchProjectsAsync(
    authorizedClient,
    credentials,
    request,
  );
  const res = [];

  // eslint-disable-next-line no-restricted-syntax
  for await (const proj of iterable) {
    res.push(proj);
  }

  return res;
}

async function getListResults(fields, pluginSettings, pluginParams, clientClass) {
  const parseFunc = helpers.getParseFromParam(...fields);
  const settings = helpers.mapAutoParams(pluginSettings);
  const params = helpers.mapAutoParams(pluginParams);

  const credentials = helpers.getCredentials(params, settings);
  const authorizedClient = helpers.getAuthorizedClient(clientClass, credentials);

  const project = helpers.getProject(params, settings);
  const region = helpers.getRegion(params);
  const zone = helpers.getZone(params);

  let result = await listResources(credentials, authorizedClient, project, region, zone, clientClass);
  result = result.map(parseFunc);
  return { params, result };
}

async function listResources(credentials, authorizedClient, project, region, zone, resource = {}) {
  const request = _.merge({ project, region, zone }, resource);

  const res = [];
  const iterable = await RESOURCE_OPERATIONS.listAsync(authorizedClient, credentials, request);

  // eslint-disable-next-line no-restricted-syntax
  for await (const response of iterable) {
    res.push({ id: response.id, name: response.name });
  }

  return res;
}

module.exports = {
  createListItemsFunction,
  listGcpProjects,
  listGcpRegions,
  listGcpZones,
};
