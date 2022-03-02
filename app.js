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
  const results = {
    loadBalancer: {},
  };
  // eslint-disable-next-line no-restricted-syntax
  for (const lbFunction of loadBalancerFunctions) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = (await lbFunction(action, settings))[0];
      // The promise returned from load balancer function resolves to an array.
      // The first element of the array is an object representing created resource.
      const resultKind = result.kind;
      results[resultKind] = result;
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
  const results = {
    loadBalancer: {},
  };
  // eslint-disable-next-line no-restricted-syntax
  for (const lbFunction of loadBalancerFunctions) {
    try {
      // The first element of the array is an object representing created resource.
      // eslint-disable-next-line no-await-in-loop
      const result = (await lbFunction(action, settings))[0];
      // The promise returned from load balancer function resolves to an array.

      results.loadBalancer[result.kind] = result;
    } catch (err) {
      // eslint-disable-next-line no-await-in-loop
      await computeClient.rollbackHttpsExternalLB(results, action, settings);
      throw err;
    }
  }

  return results;
}

async function createHealthCheckFromJSON(action, settings) {
  const computeClient = GoogleComputeService.from(action.params, settings);
  const result = await computeClient.createHealthCheckFromJSON(action, settings);
  return result;
}

async function createBackendServiceFromJSON(action, settings) {
  const computeClient = GoogleComputeService.from(action.params, settings);
  const result = await computeClient.createBackendServiceFromJSON(action, settings);
  return result;
}

async function createURLMapFromJSON(action, settings) {
  const computeClient = GoogleComputeService.from(action.params, settings);
  const result = await computeClient.createURLMapFromJSON(action, settings);
  return result;
}

async function createTargetHttpProxyFromJSON(action, settings) {
  const computeClient = GoogleComputeService.from(action.params, settings);
  const result = await computeClient.createTargetHttpProxyFromJSON(action, settings);
  return result;
}

async function createForwardRulesFromJSON(action, settings) {
  const computeClient = GoogleComputeService.from(action.params, settings);
  const result = await computeClient.createForwardRulesFromJSON(action, settings);
  return result;
}

module.exports = {
  createHttpExternalLoadBalancer,
  createHttpsExternalLoadBalancer,
  createHealthCheckFromJSON,
  createBackendServiceFromJSON,
  createURLMapFromJSON,
  createTargetHttpProxyFromJSON,
  createForwardRulesFromJSON,
  ...autocomplete,
};
