const GoogleComputeService = require("./google-compute-service");
const autocomplete = require("./autocomplete");

async function createLoadBalancer(action, settings) {
  const computeClient = GoogleComputeService.from(action.params, settings);

  const result = await computeClient.createHealthCheck(action, settings);
  return result;
}

module.exports = {
  createLoadBalancer,
  ...autocomplete,
};
