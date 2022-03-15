# Kaholo GCP Load Balancer Plugin 
GCP Load Balancer Plugin for Kaholo GCP
This plugin uses Node.js client libraries for CCP Compute Engine:
https://cloud.google.com/nodejs/docs/reference/compute/latest

In order to get to know more about resources that you will able to create using this plugin visit:
https://cloud.google.com/load-balancing/docs

##  Settings
1. Default Project ID (Vault) **Required if not in action** 
2. Service Account Credentials (Vault) **Required if not in action** - GCP Credentials JSON
3. Default Region (String) **Required if not in action** - The GCP region to make requests to on default.


## Methods
- Create HTTP External Load Balancer (With rollback [Read below](#loadbalancer))
- Create HTTPS External Load Balancer (With rollback [Read below](#loadbalancer))


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


##  <a name="loadbalancer"></a> Create HTTP and HTTPS External Load Balancer Methods

This methods create preconfigured load balancer with minimal default configuration.

The HTTP(S) method creates (in exact this order): 

- Health check  
- Backend service  
- URL map  
- Global target HTTP(S) proxy  
- Global forwarding rule  


**IMPORTANT**  
If creation of one of the resources fails, then all resources that were created earlier are rollbacked.
