const gcpCompute = require("@google-cloud/compute");
const _ = require("lodash");
require("@google-cloud/compute");
const { ProjectsClient } = require("@google-cloud/resource-manager");
const GCCompute = require("@google-cloud/compute");
const parsers = require("./parsers");

function getCredentials(params, settings) {
  const creds = parsers.object(params.creds || settings.creds);
  if (!creds) {
    throw new Error("Must provide credentials to call any method in the plugin!");
  }
  return creds;
}

function getProject(params, settings) {
  const project = parsers.autocomplete(params.project || settings.project) || undefined;
  return project;
}

function getAuthorizedClient(ClientClass, credentials) {
  const clientInstance = new ClientClass({ credentials });
  return { clientInstance, credentials };
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

async function callSearchProjectsAsync(client, request) {
  return _.partial(callMethod, "searchProjectsAsync")(client, request);
}

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

async function listResources(params, settings, clientClass, resource = {}) {
  const credentials = getCredentials(params, settings);
  const project = getProject(params, settings);
  const authorizedClient = getAuthorizedClient(clientClass, credentials);

  const request = _.merge({ project }, resource);

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

async function listProjects(params, settings) {
  const credentials = getCredentials(params, settings);
  const authorizedClient = getAuthorizedClient(ProjectsClient, credentials);
  const { query } = params;

  // const request = removeUndefinedAndEmpty({
  //   query: query ? `name:*${query}*` : undefined,
  // });

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

function autocomplete(value) {
  if (_.isNil(value)) { return ""; }
  if (_.isString(value)) { return value; }
  if (_.isObject(value) && _.has(value, "id")) { return value.id; }
  throw new Error(`Value "${value}" is not a valid autocomplete result nor string.`);
}

function mapAutoParams(autoParams) {
  const params = {};
  autoParams.forEach((param) => {
    params[param.name] = autocomplete(param.value);
  });
  return params;
}

function getParseFromParam(idParamName, valParamName) {
  return (item) => ({
    id: item[idParamName],
    value: item[valParamName] || item[idParamName],
  });
}

async function getProjects(fields, pluginSettings, pluginParams) {
  const parseFunc = getParseFromParam(...fields);
  const settings = mapAutoParams(pluginSettings);
  const params = mapAutoParams(pluginParams);

  let result = await listProjects(params, settings);
  result = [...result.map(parseFunc)];
  return { params, result };
}

async function getListResults(fields, pluginSettings, pluginParams, clientClass) {
  const parseFunc = getParseFromParam(...fields);
  const settings = mapAutoParams(pluginSettings);
  const params = mapAutoParams(pluginParams);

  let result = await listResources(params, settings, clientClass);
  result = [...result.map(parseFunc)];
  return { params, result };
}

function createListItemsFunction(clientClass, fields) {
  return async function listGcpItems(query, pluginSettings, pluginParams) {
    const { result } = await getListResults(fields, pluginSettings, pluginParams, clientClass);
    return result;
  };
}

function createListZonesFunction() {
  return async function listGcpItems(query, pluginSettings, pluginParams) {
    const { result, params } = await getListResults(["name"], pluginSettings, pluginParams, GCCompute.ZonesClient);

    const region = autocomplete(params.region);
    result.filter((zone) => !region || zone.name.includes(region));

    return result;
  };
}

function createListProjectsFunction() {
  return async function listGcpProjects(query, pluginSettings, pluginParams) {
    const { result } = await getProjects(["projectId", "displayName"], pluginSettings, pluginParams);
    return result;
  };
}

module.exports = {
  createListItemsFunction,
  createListZonesFunction,
  createListProjectsFunction,
  createResource,
  createResourceWaitForCreation,
  deleteResource,
  deleteResourceWaitForDeletion,
  getResource,
  listResources,
};
