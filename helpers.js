const parsers = require("./parsers");

function mapAutoParams(autoParams) {
  const params = {};
  autoParams.forEach((param) => {
    params[param.name] = parsers.autocomplete(param.value);
  });
  return params;
}

function getParseFromParam(idParamName, valParamName) {
  return (item) => ({
    id: item[idParamName],
    value: item[valParamName] || item[idParamName],
  });
}

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

function getRegion(params) {
  const region = parsers.autocomplete(params.region);
  return region;
}

function getZone(params) {
  const zone = parsers.autocomplete(params.zone);
  return zone;
}

function getAuthorizedClient(ClientClass, credentials) {
  const clientInstance = new ClientClass({ credentials });
  return clientInstance;
}

module.exports = {
  getParseFromParam,
  mapAutoParams,
  getCredentials,
  getProject,
  getRegion,
  getZone,
  getAuthorizedClient,
};
