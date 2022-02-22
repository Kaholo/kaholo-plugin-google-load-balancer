const GoogleComputeService = require("./google-compute-service");
const autocomplete = require("./autocomplete");

async function createLoadBalancer(action, settings) {
  const computeClient = GoogleComputeService.from(action.params, settings);

  const resultOfHealthCheck = await computeClient.createHealthCheck(action, settings);
  const resultOfBackendService = await computeClient.createBackendService(action, settings);
  const resultOfUrlMap = await computeClient.createUrlMap(action, settings);
  const resultOfTargetHttpProxy = await computeClient.createTargetHttpProxy(action, settings);

  return Promise.all([
    resultOfHealthCheck,
    resultOfBackendService,
    resultOfUrlMap,
    resultOfTargetHttpProxy,
  ]);
}

module.exports = {
  createLoadBalancer,
  ...autocomplete,
};
