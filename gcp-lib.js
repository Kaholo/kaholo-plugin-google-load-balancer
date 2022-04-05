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

async function callResourceOperation(
  resourceOperation,
  clientClass,
  credentials,
  project,
  resource,
  waitForOperation,
) {
  const authorizedClient = helpers.getAuthorizedClient(clientClass, credentials);
  const request = _.merge({ project }, resource);

  const result = await resourceOperation(
    authorizedClient,
    credentials,
    request,
    waitForOperation,
  );
  return result;
}

async function createMultipleGCPServices(
  servicesDefinitions,
  action,
  credentials,
  project,
) {
  const createdResources = await createResources(servicesDefinitions, action, credentials, project);
  const zone = action.params.zone.value;
  const results = await getCreatedResources(createdResources, zone, credentials, project);
  return results;
}

async function createResources(servicesDefinitions, action, credentials, project) {
  const createdResources = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const serviceDefinition of servicesDefinitions) {
    try {
      const { client, createResourceFunc } = serviceDefinition;
      // eslint-disable-next-line no-await-in-loop
      const resource = await createResourceFunc(
        action,
        credentials,
        project,
      );
      // eslint-disable-next-line no-await-in-loop
      await callResourceOperation(
        RESOURCE_OPERATIONS.create,
        client,
        credentials,
        project,
        resource,
        true,
      );
      const { name } = resource[_.findKey(resource, "name")];
      createdResources.push({ ...serviceDefinition, name });
    } catch (err) {
      if (createdResources.length > 0) {
        console.error("Starting rollback");
        // eslint-disable-next-line no-await-in-loop
        await rollback(createdResources, credentials, project);
      }
      throw err;
    }
  }
  return createdResources;
}

async function getCreatedResources(createdResources, zone, credentials, project) {
  const results = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const resourceData of createdResources) {
    const resource = { zone };
    resource[resourceData.typeProperty] = resourceData.name;

    // eslint-disable-next-line no-await-in-loop
    const createdResource = await callResourceOperation(
      RESOURCE_OPERATIONS.get,
      resourceData.client,
      credentials,
      project,
      resource,
    );
    results[createdResource.kind] = createdResource;
  }

  return results;
}

async function rollback(createdResources, credentials, project) {
  const resourcesToRollback = _.reverse(createdResources);
  // eslint-disable-next-line no-restricted-syntax
  for (const resourceToRollback of resourcesToRollback) {
    const resource = {};
    resource[resourceToRollback.typeProperty] = resourceToRollback.name;
    try {
      // eslint-disable-next-line no-await-in-loop
      await callResourceOperation(
        RESOURCE_OPERATIONS.delete,
        resourceToRollback.client,
        credentials,
        project,
        resource,
        true,
      );
    } catch (rollbackError) {
      console.error(rollbackError, "Rollback failed ");
    }
  }
}

async function callMethod(methodName, client, credentials, request, waitForOperation = false) {
  const result = await client[methodName](request);

  if (!waitForOperation) {
    return result;
  }

  const operationsClient = new GCCompute.GlobalOperationsClient({
    credentials,
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
  createMultipleGCPServices,
};
