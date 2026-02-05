## Network Topology
Add new section in @app/applications/[id]/overview/page.tsx under the top level card 
* The section should create application network topology
* The network topology is based on the JSON response from `/wafie.v1.ProtectionService/GetProtection` API call
* Create network flow diagram, follow this steps: 
  * Make sure you've the data from the `/wafie.v1.ProtectionService/GetProtection` API call
  * All components of the diagram must be connected with arrows with dots representing network cables   
  * Animate network packets representing the data passing between the components 
  * Create the following components:
    1. Ingress Component:   
       * Use this icon: https://raw.githubusercontent.com/kubernetes/community/master/icons/png/resources/unlabeled/ing-128.png
       * Under the icon, place a blue badge with string: `nginx` 
       * This is the most left component representing traffic ingress
       * Ingress connected to service with single network connection represented by single arrow with dots
    2. Service Component:
       * Use this icon: https://raw.githubusercontent.com/kubernetes/community/master/icons/png/resources/unlabeled/svc-128.png
       * Under the icon place a badge with data taken from the API response, the data path: `application.ingress[0].upstream.svcFqdn`
       * Service connected to the endpoints. Depending on the API response, service can be connected to single endpoint or to multiple endpoints. Make sure you create all the network connections properly between a service and single or multiple endpoints
    3. Endpoint Component:
       * Use this icon: https://raw.githubusercontent.com/kubernetes/community/master/icons/png/resources/unlabeled/ep-128.png
       * Under the icon place a badge with data taken from the API response. the data path: `application.ingress[0].upstream.endpoints[].ip`
       * Note, might be multiple endpoints, verify first how many endpoints returned in API response, then start creating them. The total number of the endpoint will be equal to the length of `application.ingress[0].upstream.endpoints`
       * Each endpoint connected to the pod. Might be single pod or multiple pods. Make sure you create all the network connections properly between each endpoint and each pod.  
    4. Pod component:
       * Use this icon: https://raw.githubusercontent.com/kubernetes/community/master/icons/png/resources/unlabeled/pod-128.png
       * Under the icon place a badges with data taken from API response. add badges with `application.ingress[0].upstream.endpoints[].name`,`application.ingress[0].upstream.endpoints[].namespace` and `application.ingress[0].upstream.endpoints[].nodeName`
    
### JSON response example:
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
              "upstream": {
                  "svcFqdn": "httpbin.default.svc",
                  "endpoints": [
                      {
                          "ip": "10.244.0.8",
                          "nodeName": "kind-control-plane",
                          "kind": "Pod",
                          "name": "httpbin-654df84766-mqzbz",
                          "namespace": "default"
                      },
                      {
                          "ip": "10.244.0.31",
                          "nodeName": "kind-control-plane",
                          "kind": "Pod",
                          "name": "httpbin-654df84766-t5l9s",
                          "namespace": "default"
                      }
                  ],
                  "upstreamRouteType": "UPSTREAM_ROUTE_TYPE_PORT"
              },
              "scheme": "http"
          }
      ]
  }
}
```