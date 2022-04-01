/* eslint no-use-before-define: 0 */

const _ = require("lodash");
const GCCompute = require("@google-cloud/compute");
const helpers = require("./helpers");

const RESOURCE_OPERATIONS = {
  create: _.partial(callMethod, "insert"),
  get: async (client, request) => (await _.partial(callMethod, "get")(client, request))[0],
  delete: _.partial(callMethod, "delete"),
  listAsync: _.partial(callMethod, "listAsync"),
  searchProjectsAsync: _.partial(callMethod, "searchProjectsAsync"),
};

async function callResourceOperation(resourceOperation, params, settings, clientClass, resource) {
  const credentials = helpers.getCredentials(params, settings);
  const authorizedClient = helpers.getAuthorizedClient(clientClass, credentials);

  const project = helpers.getProject(params, settings);
  const request = _.merge({ project }, resource);

  const result = await resourceOperation(
    authorizedClient,
    request,
    params.waitForOperation,
  );
  return result;
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

module.exports = {
  RESOURCE_OPERATIONS,
  callResourceOperation,
};
