* Add to Application Overview page new section: Security Events
* Locate the security event section under the network topology card 
* The event section shows application security events
* The security event should be presented as a table expendable table
* The security events columns:
  * Time
    * Located at JSON response under events[].data.time
  * Client IP
    * Located at JSON response under events[].data.transaction.client_ip
  * Message
    * Located at JSON response under events[].data.transaction.messages[].message
  * RuleID
  * Located at JSON response under events[].data.transaction.messages[].details.ruleId
  * Expend button, once clicked user should get access to JSON data, see the example of the response below 
* IMPORTANT: Make API call to fetch the security events only for applications with enabled protection  
* Make the following API call to fetch security events
* In the JSON body pass protection ID 
```bash
curl --location 'wafie.v1.EventService/ListEvents' \
--header 'Content-Type: application/json' \
--data '{
    "protection_id": 4
}'
```
* Example API JSON response   

```json
{
    "events": [
        {
            "tag": "modsec.logs",
            "time": "2026-01-28T16:51:39.303362Z",
            "data": {
                "time": 1769619099.303362,
                "transaction": {
                    "client_ip": "192.168.64.1",
                    "client_port": 0,
                    "host_ip": "0.0.0.0",
                    "host_port": 0,
                    "messages": [
                        {
                            "details": {
                                "accuracy": "0",
                                "data": "",
                                "file": "/rules/1/8949faff9a421b30fbefed8688586082/rules/REQUEST-800-CUSTOM-RULES.conf",
                                "lineNumber": "77",
                                "match": "",
                                "maturity": "0",
                                "reference": "",
                                "rev": "",
                                "ruleId": "1000013",
                                "severity": "0",
                                "tags": [],
                                "ver": ""
                            },
                            "message": "Captcha Verification Result: 0"
                        }
                    ],
                    "producer": {
                        "components": [],
                        "connector": "wafie v0.0.2-alpha",
                        "modsecurity": "ModSecurity v3.0.14 (Linux)",
                        "secrules_engine": "Enabled"
                    },
                    "request": {
                        "headers": {
                            ":authority": "httpbin.192.168.64.8.nip.io",
                            ":method": "GET",
                            ":path": "/get",
                            ":scheme": "http",
                            "accept": "*/*",
                            "host": "httpbin.192.168.64.8.nip.io",
                            "user-agent": "curl/8.7.1",
                            "x-forwarded-for": "192.168.64.1",
                            "x-forwarded-host": "httpbin.192.168.64.8.nip.io",
                            "x-forwarded-port": "80",
                            "x-forwarded-proto": "http",
                            "x-forwarded-scheme": "http",
                            "x-real-ip": "192.168.64.1",
                            "x-request-id": "9a5cdddd5e4baf5601486bdebe77e5d3",
                            "x-scheme": "http",
                            "x-wafie-protection-id": "1"
                        },
                        "hostname": "0.0.0.0",
                        "http_version": "1.1",
                        "method": "GET",
                        "uri": "/get"
                    },
                    "response": {
                        "body": "",
                        "headers": {
                            ":status": "200",
                            "access-control-allow-credentials": "true",
                            "access-control-allow-origin": "*",
                            "content-length": "736",
                            "content-type": "application/json; charset=utf-8",
                            "date": "Wed, 28 Jan 2026 16:51:39 GMT",
                            "x-envoy-upstream-service-time": "0"
                        },
                        "http_code": 200
                    },
                    "server_id": "2bdf452f3b29e1f1f7d445401ce2bdd96586ac04",
                    "time_stamp": "Wed Jan 28 16:51:39 2026",
                    "unique_id": "176961909974.940222"
                }
            }
        }
```

change the icon of the security event section, it should represent an event 
in the table change the Expand to Details 
add pagination to the table, each page has 10 events
wrap the column titles into blue badges  