/* eslint no-use-before-define: 0 */

const _ = require("lodash");
const { ProjectsClient } = require("@google-cloud/resource-manager");
const GCCompute = require("@google-cloud/compute");
const parsers = require("./parsers");
const helpers = require("./helpers");

const RESOURCE_OPERATIONS = {
  create: callInsert,
  get: callGet,
  delete: callDelete,
};

async function callResourceOperation(resourceOperation, params, settings, clientClass, resource) {
  const credentials = helpers.getCredentials(params, settings);
  const authorizedClient = getAuthorizedClient(clientClass, credentials);

  const project = helpers.getProject(params, settings);
  const request = _.merge({ project }, resource);

  const result = await resourceOperation(
    authorizedClient,
    request,
    params.waitForOperation,
  );
  return result;
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
  const authorizedClient = getAuthorizedClient(ProjectsClient, credentials);
  const { query } = params;

  const request = { query: query ? `name:*${query}*` : undefined };

  const iterable = await callSearchProjectsAsync(authorizedClient, request);
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

function createListItemsFunction(clientClass, fields) {
  return async function listGcpItems(query, pluginSettings, pluginParams) {
    const { result } = await getListResults(fields, pluginSettings, pluginParams, clientClass);
    return result;
  };
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
  const authorizedClient = getAuthorizedClient(clientClass, credentials);

  const request = _.merge({ project, region, zone }, resource);

  const res = [];
  const iterable = await callListAsync(authorizedClient, request);

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

async function callSearchProjectsAsync(client, request) {
  return _.partial(callMethod, "searchProjectsAsync")(client, request);
}

async function callInsert(client, request, waitForOperation) {
  return _.partial(callMethod, "insert")(client, request, waitForOperation);
}

async function callGet(client, request) {
  return (await _.partial(callMethod, "get")(client, request))[0];
}

async function callListAsync(client, request) {
  return _.partial(callMethod, "listAsync")(client, request);
}

async function callDelete(client, request, waitForOperation = false) {
  return _.partial(callMethod, "delete")(client, request, waitForOperation);
}

async function callMethod(methodName, client, request, waitForOperation = false) {
  const result = await client.clientInstance[methodName](request);

  if (!waitForOperation) {
    return result;
  }

  const operationsClient = new GCCompute.GlobalOperationsClient({
    credentials: client.credentials,
  });

  let [operation] = result;
  while (operation.status !== "DONE") {
    // eslint-disable-next-line no-await-in-loop
    [operation] = await operationsClient.wait({
      operation: operation.name,
      project: request.project,
    });
  }

  return operation;
}

function getAuthorizedClient(ClientClass, credentials) {
  const clientInstance = new ClientClass({ credentials });
  return { clientInstance, credentials };
}

module.exports = {
  RESOURCE_OPERATIONS,
  callResourceOperation,
  createListItemsFunction,
  listGcpProjects,
  listGcpRegions,
  listGcpZones,
};
