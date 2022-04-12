const {
  RESOURCE_OPERATIONS,
} = require("./gcp-lib");
const helpers = require("./helpers");

function generateGCPAutocompleter(
  ClientClass,
  fieldsToSelect,
  {
    filterGenerator = null,
    listingFunction = genericList,
  } = {},
) {
  return async function gcpAutocompleter(query, pluginSettings, pluginParams) {
    const settings = helpers.mapAutoParams(pluginSettings);
    const params = helpers.mapAutoParams(pluginParams);

    const credentials = helpers.getCredentials(params, settings);
    const authorizedClient = new ClientClass({ credentials });

    const mapToAutocomplete = helpers.generateToAutocompleteMapper(...fieldsToSelect);

    const gcpListingResults = await listingFunction(
      settings,
      params,
      credentials,
      authorizedClient,
    );
    const autocompleteResults = gcpListingResults.map(mapToAutocomplete);

    return filterGenerator
      ? autocompleteResults.filter(filterGenerator(query, settings, params))
      : autocompleteResults;
  };
}

async function genericList(settings, params, credentials, authorizedClient) {
  const project = helpers.getProject(params, settings);
  const region = helpers.getRegion(params);
  const zone = helpers.getZone(params);

  const request = { project, region, zone };

  return sendGCPRequest(
    authorizedClient,
    credentials,
    RESOURCE_OPERATIONS.listAsync,
    request,
  );
}

async function getProjects(settings, params, credentials, authorizedClient) {
  const { query } = params;

  const request = {};
  if (query) {
    request.query = `name:*${query}*`;
  }

  return sendGCPRequest(
    authorizedClient,
    credentials,
    RESOURCE_OPERATIONS.searchProjectsAsync,
    request,
  );
}

async function sendGCPRequest(authorizedClient, credentials, func, request) {
  const iterable = await func(
    authorizedClient,
    credentials,
    request,
  );

  const results = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const response of iterable) {
    results.push(response);
  }

  return results;
}

module.exports = {
  generateGCPAutocompleter,
  genericList,
  getProjects,
};
