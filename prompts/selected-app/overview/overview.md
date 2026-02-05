## Application Overview Page 
Add 3 cards summarizing the most important information about current protection status of the application 
1. Basic Information Card 
   * Application Name 
   * Application namespace 
   * Application ID 
   * Card Icon: import { CiCircleInfo } from "react-icons/ci";
2. Active Protections Card 
   * Show the total number of available protections and how many from the total has been enabled
   * Type: badge with nginx string
   * Status: badge with healthy string 
   * Card Icon: import { FaShieldAlt } from "react-icons/fa";
3. Protection Status 
   * Protection: green badge with Protected string 
   * Protection ID: set to 1
   * Enable Protection toggle 
   * Card icon: import { IoMdSettings } from "react-icons/io";

Remove the mock data from @overivew/page.tsx and use real data from API
To fetch the data make an API call 
* API path: `/wafie.v1.ApplicationService/GetApplication`
* API method: POST
* JSON Body: `{"id": 1}` where ID is the current application ID 
Expect to get JSON response, for example: 
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

#### Extract the following data for the Basic Information Card from the JSON response 
* For Application Name use value of  `application.name`
* For Application Namespace use value of `application.ingress.namespace`
* For Application ID use value of `application.id`

#### Make another API call to fetch data for Protection Status Card 
For discovering the protection data, make API call 
* API path: `/wafie.v1.ProtectionService/GetProtection`
* API method: POST 
* Request JSON Body: `{"application_id": 1}` where application_id is an ID of the current application
* Example of JSON response 
   ```json
   {
       "protection": {
           "id": 1,
           "applicationId": 1,
           "protectionMode": "PROTECTION_MODE_ON",
           "desiredState": {
               "ipRules": {},
               "auth": {
                   "basicAuth": {},
                   "tokenAuth": {}
               },
               "antiBot": {
                   "captchaV2": {}
               }
           }
       }
   }
   ```
  
* For Protection 
  * If `/wafie.v1.ProtectionService/GetProtection` response 200 and `protection.protectionMode` = `PROTECTION_MODE_ON` Protection badge should be green with `Protected` string
  * If `/wafie.v1.ProtectionService/GetProtection` response 200 and `protection.protectionMode` = `PROTECTION_MODE_OFF` Protection badge should be red with `Unprotected` string
  * If `/wafie.v1.ProtectionService/GetProtection` response 404 Protection badge should be red with `Unprotected` string
* For Protection ID if response 200, use `protection.id` otherwise set the protection ID to `-`
* For Enable Protection: the toggle must be on only if response code was 200 and `protection.protectionMode` = `PROTECTION_MODE_ON`, otherwise the toggle must be off