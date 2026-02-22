## Basic Auth page @app/applications/[id]/basic-auth/page.tsx

### UI Design
* In this page user can configure basic authentication for his web app.
* On the first row create two cards:
  * Card with toggle for disabling or enabling basic auth
  * Card which allow to create a new user and password. 
    * The add new user card should include a form with 
      * Username
      * Password 
      * Confirm password 
      * Save button
* Second Row create two cards 
* First card with a table for existing basic auth users  
  * Users table have the following columns:
    * Username
    * Status
    * Actions buttons: Edit and Delete 
      * When clicking on Edit popup window should allow to change user's password
      * When clicking on Delete confirmation window should appear
* Second card with a table for whitelist paths to skip - this table shows all the public paths which does not require authentication 
  * Whitelist path have the following columns: 
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
  "basic_auth": {
    "enabled": false,
    "path_whitelist_to_add": [
      "ipsum laborum",
      "ea dolore ipsum elit officia",
      "elit nostrud officia labore dolor"
    ],
    "path_whitelist_to_remove": [
      "Ut velit",
      "mollit voluptate aliquip",
      "Duis cupidatat esse"
    ],
    "users_to_add": [
      {
        "user": "deserunt anim dolore",
        "pass": "aliquip esse dolore in enim"
      },
      {
        "user": "aute dolor Excepteur deserunt",
        "pass": "fugiat officia ex et nisi"
      },
      {
        "user": "qui officia aliqua ex fugiat",
        "pass": "elit reprehenderit et"
      }
    ],
    "users_to_remove": []
  }
}
```
* When user works with this UI, you should construct the JSOB body following users selections
* when admin unable or disable basic auth you should set `basic_auth.enabled` to `true` or `false` depends on the user selection 
* When admin creates a new user you should append into `basic_auth.users_to_add` list a new user object, example: `{"user":"foo","passwrod":"pass"}`
* When admin creates a new whitelist path, you should append into `basic_auth.path_whitelist_to_add` list a new string, example:`"/v1/public"`
* When admin remove a user from the users table, i.e. clicking on the Delete button, you should append into `basic_auth.users_to_remove` list user's username, for example: `"john"`
* When admin remove a whitelist path, i.e. clicking on the Delete button, you should append into `basic_auth.path_whitelist_to_remove` list the selected path whitelist, for example: `"/v1/public"`
