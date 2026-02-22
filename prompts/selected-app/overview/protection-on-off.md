  
When disabling protection by moving the Enable Protection toggle to off, 
make an API call to disable protection on the backend
API URI: `/wafie.v1.ProtectionService/PutProtection`
API METHOD: `POST`
API BODY is a JSON where `id` is a Protection ID, and the `protection_mode` is statically set to "PROTECTION_MODE_OFF"
Example body: 
```json
{
    "id": 1,
    "protection_mode": "PROTECTION_MODE_OFF"
}
```

When page is opening you should check if protection is enabled or disabled for selected application. 
If protection is enabled, the Enable Protection toggle should be On, otherwise Off. 
To check if protection is enabled for application make an API
API URI: `/wafie.v1.ProtectionService/GetProtection`
API Body is a JSON with `application_id` parameter.
Example of the JSON BODY:
```json
{application_id: 4}
```
* If receiving response status code 404, meaning protection for applications is OFF
* If receiving response status code 202, you must check the JSON response body. 
  * If JSON response has `protection.protectionMode` equals to `PROTECTION_MODE_OFF` meaning the protection for application is OFF
  * If JSON response has `protection.protectionMode` equals to `PROTECTION_MODE_ON` meaning the protection for application is ON



The Enable Protection in @app/applications/[id]/overview/page.tsx is not clickable when protection id is -1 - this needs to be fixed.                                                                                                                                     
Protection ID -1 indicated that user can create or enable protection by making API call. 
To create a protection make an API call to API 
Use this endpoint: `/wafie.v1.ProtectionService/CreateProtection`
Use POST method with JSON Body, an example: `{"application_id": 1}` 
Pass the application id that you fetched when opened the UI page: `/applications/4/overview`

## IMPORTANT `/wafie.v1.ProtectionService/CreateProtection` get called once when protection id is -1. in all other cases, you should continue using `/wafie.v1.ProtectionService/PutProtection` api call with existing logic 

