/* eslint no-use-before-define: 0 */

const gcpCompute = require("@google-cloud/compute");
const _ = require("lodash");
require("@google-cloud/compute");
const { ProjectsClient } = require("@google-cloud/resource-manager");
const GCCompute = require("@google-cloud/compute");
const parsers = require("./parsers");
const {
  getParseFromParam,
  mapAutoParams,
  getCredentials,
  getProject,
  getRegion,
  getZone,
} = require("./helpers");

async function createResource(params, settings, clientClass, resource) {
  const credentials = getCredentials(params, settings);
  const project = getProject(params, settings);
  const authorizedClient = getAuthorizedClient(clientClass, credentials);

  const request = _.merge({ project }, resource);

  const result = await callInsert(
    authorizedClient,
    request,
    params.waitForOperation,
  );
  return result;
}

async function createResourceWaitForCreation(params, settings, clientClass, resource) {
  const paramsWithWaitForOperation = { ...params, waitForOperation: true };
  return createResource(paramsWithWaitForOperation, settings, clientClass, resource);
}

async function deleteResource(params, settings, clientClass, resource) {
  const credentials = getCredentials(params, settings);
  const project = getProject(params, settings);
  const authorizedClient = getAuthorizedClient(clientClass, credentials);

  const request = _.merge({ project }, resource);

  const result = await callDelete(
    authorizedClient,
    request,
    params.waitForOperation,
  );
  return result;
}

async function deleteResourceWaitForDeletion(params, settings, clientClass, resource) {
  const paramsWithWaitForOperation = { ...params, waitForOperation: true };
  return deleteResource(paramsWithWaitForOperation, settings, clientClass, resource);
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

async function getResource(params, settings, clientClass, resource) {
  const credentials = getCredentials(params, settings);
  const project = getProject(params, settings);
  const authorizedClient = getAuthorizedClient(clientClass, credentials);

  const request = _.merge({ project }, resource);

  const result = await callGet(
    authorizedClient,
    request,
  );
  return result[0];
}

async function getProjects(fields, pluginSettings, pluginParams) {
  const parseFunc = getParseFromParam(...fields);
  const settings = mapAutoParams(pluginSettings);
  const params = mapAutoParams(pluginParams);

  let result = await searchProjects(params, settings);
  result = [...result.map(parseFunc)];
  return { params, result };
}

async function searchProjects(params, settings) {
  const credentials = getCredentials(params, settings);
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
  const parseFunc = getParseFromParam(...fields);
  const settings = mapAutoParams(pluginSettings);
  const params = mapAutoParams(pluginParams);

  let result = await listResources(params, settings, clientClass);
  result = [...result.map(parseFunc)];
  return { params, result };
}

async function listResources(params, settings, clientClass, resource = {}) {
  const credentials = getCredentials(params, settings);
  const project = getProject(params, settings);
  const region = getRegion(params);
  const zone = getZone(params);
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
  return _.partial(callMethod, "get")(client, request);
}

async function callListAsync(client, request) {
  return _.partial(callMethod, "listAsync")(client, request);
}

async function callDelete(client, request, waitForOperation = false) {
  return _.partial(callMethod, "delete")(client, request, waitForOperation);
}

async function callMethod(methodName, client, request, waitForOperation = false) {
  if (waitForOperation) {
    const operationsClient = new gcpCompute.GlobalOperationsClient({
      credentials: client.credentials,
    });

    let [operation] = await client.clientInstance[methodName](request);

    while (operation.status !== "DONE") {
      // eslint-disable-next-line no-await-in-loop
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: request.project,
      });
    }
    return operation;
  }
  const result = await client.clientInstance[methodName](request);
  return result;
}

function getAuthorizedClient(ClientClass, credentials) {
  const clientInstance = new ClientClass({ credentials });
  return { clientInstance, credentials };
}

module.exports = {
  createListItemsFunction,
  createResource,
  createResourceWaitForCreation,
  deleteResource,
  deleteResourceWaitForDeletion,
  getResource,
  listGcpProjects,
  listGcpRegions,
  listGcpZones,
};
