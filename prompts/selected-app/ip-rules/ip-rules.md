## IP Rule configuration page

### IP rule configuration page allows user to block or allow requests based on the single IP or CIDR.

* The page have two rows 
  * First row has an Add New Rule card which allows user to add a new IP rule
    * Add New Rule Card must include the following inputs 
      * IP Address or CIDR input box for entering IP or CIDR
      * Action: Drop down menu with Allow or Block 
      * Add button: when clicking on add the rule should appear in the rules tables. 
  * Second row is a card with IP Rules table 
    * IP Rules table columns: 
      * IP/CIDR - string 
      * Type - Badge wrapped string. Green for Allow string, red for Block string
      * Actions - Delete button  
* At the bottom of the page add a button: Save configuration 
* The UI should be connected to API
* Path: `/wafie.v1.ProtectionService/PutProtection`
* Method: `PUT`
* IMPORTANT: keep current logic of `/wafie.v1.ProtectionService/PutProtection`, i.e. continue to mirror the request as it currently designed
* IMPORTANT: read carefully the example of the JSON body, it will give you enough context for the next steps
* Example of the JSON body:
```json
{
  "id": 1775129825,
  "ip_rules_to_add": {
    "allow": [
      {
        "cidr": "in cillum"
      },
      {
        "cidr": "deserunt fugiat"
      }
    ],
    "block": [
      {
        "cidr": "nulla est"
      }
    ]
  },
  "ip_rules_to_remove": {
    "allow": [
      {
        "cidr": "eu proident voluptate sint"
      },
      {
        "cidr": "reprehenderit veniam"
      }
    ],
    "block": [
      {
        "cidr": "reprehenderit veniam"
      }
    ]
  }
}
```
* When user clicking on Add New Rule button:
  * Append new ip or cidr into `ip_rules_to_add` using following logic 
    * if action of the ip/cidr is `allow` then add the ip/cidr into `ip_rules_to_add.allow` list
    * if action of the ip/cidr is `block` then add ip/cidr into `ip_rules_to_add.block` list
  * Append new ip/cidr into a UI table to represent the changes in UI
* When user removing ip/cidr from the UI table by clicking on Delete button append new ip/cidr into `ip_rules_to_remove` using following logic 
  * if action of the ip/cidr is `allow` then add the ip/cidr into `ip_rules_to_remove.allow` list
  * if action of the ip/cidr is `block` then add ip/cidr into `ip_rules_to_remove.block` list
* When user clicking on Save Configuration button compose the final JSON body as provided in the above example and send it to the backend API. 