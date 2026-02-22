# Trusted Proxy configuration - The Client IP page
## Update ApplicationClientIP.tsx and implement an UI for XFF original IP detection

#### General Context 
* The client IP page allows the user to instruct the Wafie Secure Gateway about how to extract the real client IP.
* Each request has a XFF header which can hold one or more IP addresses. 
* The user need to specify an index of an IP address within the XFF header which represent real client ip.
* Each IP in XFF header represent hop-by-hop path of a web request
* Because anyone can write whatever they want in an HTTP header, you should never just take the leftmost IP as the "truth."

#### Implementation 
* Build request network flow animation similar to Network Diagram in @ApplicationOverview.tsx  
* The request network flow should show a user making a request 
* the request goes through multiple load balancers and proxies and finally arriving to the application 
* each hop in ths loop should define similar to as we defined Ingress element in @ApplicationOverview.tsx Application Network Topology
* To detect how many hops should be included in the animation you'll need to get applications data
* To get application data make an API call
  * URI: `/wafie.v1.ApplicationService/GetApplication`
  * Method: POST   
  * BODY: JSON with application id: {"id": 1}
* An example of API JSON response
```json
{
    "application": {
        "id": 1,
        "name": "httpbin.192.168.64.8.nip.io",
        "ingress": [
            {
                "name": "httpbin",
                "namespace": "default",
                "host": "httpbin.192.168.64.8.nip.io",
                "path": "/",
                "applicationId": 1,
                "ingressType": "INGRESS_TYPE_NGINX",
                "discoveryStatus": "DISCOVERY_STATUS_TYPE_SUCCESS",
                "upstream": {},
                "scheme": "http"
            }
        ]
    }
}
```
* Extract from the response  `application.ingress[1].scheme` and `application.ingress[].host` 
* Make another API call, compose the URL as following: 
  * `application.ingress[1].scheme`://`application.ingress[].host`/v1/wafie/cip/xff
* Expect to receive JSON response, for example: 
```json
{
  "x-forwarded-for": "1.1.1.1, 192.168.64.1"
}
```
* Split the value of x-forwarded-for by comma. Each IP will represent a hop in the network request 
* When should choose with hop in the network diagram is the one he trusts to act as a client IP provider
* The indexes go from the right to the left, starting from 1
* For example, having "x-forwarded-for": "1.1.1.1, 192.168.64.1", the 192.168.64.1 -> will have index 1, 1.1.1.1 -> will have index 2 and so one

== On click on Save Configuration button do: 
1. Compose API JSON Body, where `id` is a protection ID and `xff_num_trusted_hops` is selected hop index
  ```json
    {
     "id": 1,
     "xff_num_trusted_hops": 1
    }
  ```
2. Make PUT api call to the backend, the backend URI: `/wafie.v1.ProtectionService/PutProtection` 
3. IMPORTANT: you should mirror the requests, first the request go to the Next.JS backend, then to Wafie backend. follow the current implementation as defined here in app/api/wafie.v1.ProtectionService/PutProtection   
