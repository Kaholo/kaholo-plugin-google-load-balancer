const gcpCompute = require("@google-cloud/compute");
const _ = require("lodash");
require("@google-cloud/compute");
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
  const operation = await client.clientInstance[methodName](request);
  return operation;
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

async function listResources(params, settings, clientClass, resource) {
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

module.exports = {
  createResource,
  createResourceWaitForCreation,
  getResource,
  deleteResource,
  deleteResourceWaitForDeletion,
  listResources,
};
