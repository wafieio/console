## Token Authentication page 

#### Token authentication page allow user to configure auth by custom token 

* On the first row create 2 cards:
  * On the left side: Card with toggle for disabling or enabling token auth
  * On the right side: Card where user can input the header name in which to token expected to be found  
* On the second row create 2 cards:
  * On the left create a card with table and button to create a new token.
    * When user click on Add new token, show popup window with following inputs:
      * Token - user input a string 
      * Valid before - user input date and time 
      * Valid after - user input date and time
      * Description  - user input token description 
    * The table columns: 
      * Token - secure string 
      * Valid before - date 
      * Valid after - date 
      * Description - string 
      * Action buttons: Edit | Delete
        * When clicking on Edit user can change the token, valid before or after and change the description
        * When clicking on Delete the token is deleted 
  * On the right create a card with a table which allows user to add whitelist paths to skip to token - this table shows all the public paths which does not require token authentication
  * The whitelist path table have the following columns:
    * The whitelist path
    * Action button: Delete

### Integration with backend API
* This page uses single API call
* Path: `/wafie.v1.ProtectionService/PutProtection`
* Method: `PUT`
* IMPORTANT: keep current logic of `/wafie.v1.ProtectionService/PutProtection`, i.e. continue to mirror the request as it currently designed
* IMPORTANT: read carefully the example of the JSON body, it will give you enough context for the next steps
* Example of the JSON body:

```json
{
  "id": 1,
  "token_auth": {
    "enabled": false,
    "header": "dolor culpa sed Lorem",
    "path_whitelist_to_add": [
      "id irure ex ut",
      "ullamco eu in Duis"
    ],
    "path_whitelist_to_remove": [
      "magna occaecat quis",
      "magna dolor",
      "incididunt aliquip proident"
    ],
    "tokens_to_add": [
      {
        "token": "do eiusmod Excepteur voluptate aute",
        "valid_after": "57182",
        "valid_before": "99019",
        "description": "laboris"
      },
      {"token": "ex amet", "valid_after": "25464", "valid_before": "73", "description": "laboris"}
    ],
    "tokens_to_remove": [
      {
        "token": "non exercitation cupidatat minim voluptate",
        "valid_after": "36",
        "valid_before": "300391332",
        "description": "ea id"
      }
    ]
  }
}
```
* When user works with this UI, you should construct the JSOB body following users selections
* When admin unable or disable token auth you should set `token_auth.enabled` to `true` or `false` depends on the user selection
* When admin configuring header name you should set `token_auth.header` to the user's value 
* When admin creates a new token you should append into `token_auth.tokens_to_add` list a new user object, example: `{"token": "ex amet", "valid_after": "25464", "valid_before": "73", "description": "laboris"}`
* When admin creates a new whitelist path, you should append into `token_auth.path_whitelist_to_add` list a new string, example:`"/v1/public"`
* When admin remove a token from the token table, i.e. clicking on the Delete button, you should append into `token_auth.tokens_to_remove` the token for removal, for example: `{"token": "ex amet", "valid_after": "25464", "valid_before": "73", "description": "laboris"}`
* When admin remove a whitelist path, i.e. clicking on the Delete button, you should append into `token_auth.path_whitelist_to_remove` list the selected path whitelist, for example: `"/v1/public"`