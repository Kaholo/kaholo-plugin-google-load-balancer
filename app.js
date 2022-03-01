const GoogleComputeService = require("./google-compute-service");
const autocomplete = require("./autocomplete");

async function createHttpExternalLoadBalancer(action, settings) {
  const computeClient = GoogleComputeService.from(action.params, settings);

  const loadBalancerFunctions = [
    computeClient.createHealthCheck.bind(computeClient),
    computeClient.createBackendService.bind(computeClient),
    computeClient.createUrlMap.bind(computeClient),
    computeClient.createTargetHttpProxy.bind(computeClient),
    computeClient.createForwardRules.bind(computeClient),
  ];
  const results = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const lbFunction of loadBalancerFunctions) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await lbFunction(action, settings);
      // The promise returned from load balancer function resolves to an array.
      // The first element of the array is an object representing created resource.
      results.push(result[0]);
    } catch (err) {
      // eslint-disable-next-line no-await-in-loop
      await computeClient.rollbackHttpExternalLB(results, action, settings);
      throw err;
    }
  }

  return results;
}

async function createHttpsExternalLoadBalancer(action, settings) {
  const computeClient = GoogleComputeService.from(action.params, settings);

  const loadBalancerFunctions = [
    computeClient.createHealthCheck.bind(computeClient),
    computeClient.createBackendService.bind(computeClient),
    computeClient.createUrlMap.bind(computeClient),
    computeClient.createTargetHttpsProxy.bind(computeClient),
    computeClient.createForwardRules.bind(computeClient),
  ];
  const results = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const lbFunction of loadBalancerFunctions) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await lbFunction(action, settings);
      // The promise returned from load balancer function resolves to an array.
      // The first element of the array is an object representing created resource.
      results.push(result[0]);
    } catch (err) {
      // eslint-disable-next-line no-await-in-loop
      await computeClient.rollbackHttpsExternalLB(results, action, settings);
      throw err;
    }
  }

  return results;
}

module.exports = {
  createHttpExternalLoadBalancer,
  createHttpsExternalLoadBalancer,
  ...autocomplete,
};
