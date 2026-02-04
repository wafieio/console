## Add to discovery/page.tsx page applications search input box and applications cards
* Create a new card for searching the applications cards 
  * Place within the search card on the right search icon: import { CiSearch } from "react-icons/ci";
  * After the search icon place the input box 
  * the width of the input box should be 100% 
* Under the search input box place discovered applications cards, each Application card should include the following information
  * Application name should be just a string 
  * Namespace - Should be presented as "Namespace: <actual-namespace>" the value should be wrapped into class="badge badge-accent"
  * Ingress - Should be presented as "Ingress: <actual-ingress>"  the value should be wrapped into class="badge badge-primary" 
  * Protection - should be presented as "Protection: protected or unprotected" 
    * if the value is protected, it should be wrapped into class="badge badge-success
    * if the value is unprotected, it should be wrapped into lass="badge badge-error"
* The data for the applications cards came in JSON format from an API call
* Make API call on each time to page is opened
* The API call must be executed from the NextJS backend, i.e the API should be mirrored from frontend to the NextJS backend, from there make another API call to the API Backend.   
* API Call details:
  * Current API host is http://wafie-api.192.168.64.8.nip.io, but you must make it configurable  
  * API PATH: /wafie.v1.ApplicationService/ListApplications
  * API Method: POST 
  * API Body: 
  ```json
  {
  "options": {
      "include_ingress": true
    }
  }
  ```
   * Example API response: 
  ```json
  {
      "applications": [
          {
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
                              }
                          ],
                          "upstreamRouteType": "UPSTREAM_ROUTE_TYPE_PORT"
                      },
                      "scheme": "http"
                  }
              ]
          }
      ]
  }
  ```