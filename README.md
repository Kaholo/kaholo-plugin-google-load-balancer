# Kaholo GCP Load Balancer Plugin 
GCP Load Balancer Plugin for Kaholo GCP

This plugin uses [Node.js client libraries for GCP Compute Engine](https://cloud.google.com/nodejs/docs/reference/compute/latest). Please see the [Google documentation regarding Load Balancing](https://cloud.google.com/load-balancing/docs) for general knowledge about the resources this plugin manages.

##  Settings
Plugin Settings are reached by clicking on the plugin's name or icon in the Kaholo Settings | Plugins page. Settings are default values pre-configured for all actions of this plugin's type. If configured in Settings, in individual actions they needn't be configured, or may configured anyway to over-ride the plugin-level defaults.
1. Default Project ID (String), e.g. `my-gcp-project`
2. Default Service Account Credentials (Vault) - GCP Credentials as supplied by Google as a JSON document (not p12)
3. Default Region (String) - The GCP region where resources are or should be located, e.g. `europe-west1`.


## Supported features
GCP Load Balancers are comprised as a collection of various combinations of resources. Not all can be created using the plugin with a single action. Currently the following restrictions exist for the single-action methods, e.g. `Create External HTTP Load Balancer`:
* Only external (internet-facing) load balancers are supported.
* Instance groups both manual and automatic are supported as load balancer backends. Network endpoint groups (NEG) are **not** supported. This means the "Create Load Balancer" method cannot be used with Cloud Run, Kubernetes, Cloud Functions, App Engine, or Status websites using bucket backends. A pipeline of [JSON-type methods](#create-from-json) can however be used to create the specifically needed resources. The Kubernetes plugin method "Apply" with service of `type: LoadBalancer` causes an appropriate NEG-backed load balancer to be automatically created by GKE.
* Only premium network tier is supported. Premium network tier load balancers may work with standard network tier backends, see Google's documentation for [allowed configurations](https://cloud.google.com/network-tiers/docs/overview).
* Only global load balancing is supported. This works for both global and regional backends. For more information about available alternatives, see Google's documentation on [choosing a load balancer](https://cloud.google.com/load-balancing/docs/choosing-load-balancer).

The [Create from JSON](#create-from-json) methods create nearly any arrangement of resources that GCP allows, but are not as easy to use. Additional user-friendly single-action "Create Load Balancer" type methods may be added by popular request.

## Rollback

Some methods, specifically the single-action methods, create several GCP resources that work together to provide the complete load balancing result. For example, method `Create HTTP External Load Balancer` creates in sequence the following resources: 
- Health check  
- Backend service  
- URL map (aka Load Balancer)
- Global target HTTP proxy  
- Global forwarding rule  

If creation of any one of these resources fails, then **all resources** in the sequence are rolled back, i.e. destroyed in order to return things to the state before the action was run.

## Create from JSON
Several of the methods accept a JSON document as the only parameter apart from credentials, project, and region. This removes any limitations imposed by configurable parameters and makes available even GCP features that did not exist when the plugin was authored. To use these JSON methods directly, e.g. to create a NEG backend, regional, standard-network-tier load balancer, see the [Google Compute Engine API](https://cloud.google.com/compute/docs/reference/rest/v1) documentation. Specifically, use the API documentation to know what schema of JSON is required for a given method and what configurations are possible. Note that a create-from-JSON equivalent to a single-action "Create Load Balancer" type method is a pipeline of at least five actions.

## Create from JSON Example
As an example, we have an TLS certificate and private key we wish to use with an HTTPS load balancer. For this we use the `Create SSL certificate from JSON` method to put this cert into GCP. The correct format of the JSON is described [here](https://cloud.google.com/compute/docs/reference/rest/v1/sslCertificates/insert)

In the Kaholo parameter `SSL Certificate JSON`, we simply paste in the appropriate JSON document. (The cert and key are truncated to keep this document to a managable size.)
<pre>
{
    "name": "dillio-cert",
    "description": "TLS cert for Dillio website - www.dillio.com",
    "certificate": "-----BEGIN CERTIFICATE-----\nMIIFSjCC...very long string",
    "privateKey": "-----BEGIN RSA PRIVATE KEY-----\nMIIEowI...very long string"
}
</pre>
JSON can also be managed on the code page as variables, and then the parameter can be coded with simply the variable name - `dilliocert = { above example JSON doc}`.

## Methods
Single action methods are those that take in multiple parameters and invoke a serios of other methods to create a functional end results, i.e. a load balancer. The "from JSON" methods create resources that are useful only if combined in meaningful ways with other resources.
- Create HTTP External Load Balancer (single action) - creates a load balancer that has one external global IP address that redirects traffic to two or more GCP VMs.
  - Service Account Credentials - the Vaulted JSON document credentials provided by GCP
  - Project - the name of the GCP project within which the load balancer should be created
  - Zone - the zone of the instance group to be load balanced
  - Instance Group Name - the instance group to be load balanced.
  - UrlMapName - the load balancer name
  - Forward Rule Port Range - the port exposed on the internet side, typically 80 for HTTP or 443 for HTTPS
  - HealthCheck Type - protocol of health check, which connects to backend systems to test if they are available. Typically HTTP for HTTP backend and HTTPS for HTTPS backend web servers.
  - HealthCheck Name - any random name will do
  - HttpProxyName - any random name will do
  - ForwardingRuleName - any random name will do
  - Backend Service Name - any random name will do
- Create HTTPS External Load Balancer (single action)
- Create health check from JSON
- Create backend service from JSON
- Create URL map from JSON
- Create target HTTP proxy from JSON 
- Create target HTTPS proxy from JSON
- Create forward rules from JSON
- Create addresses from JSON 
- Create backend bucket from JSON 
- Create SSL certificate from JSON 
- Create SSL policy from JSON 
- Create target instance from JSON 
- Create target pool from JSON  
- Delete health check
- Delete backend service
- Delete URL map
- Delete target HTTP proxy
- Delete target HTTPS proxy
- Delete forward rule
- Delete address
- Delete backend bucket
- Delete SSL certificate
- Delete SSL policy
- Delete target instance
- Delete target pool 


