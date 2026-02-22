## Antibot protection UI

* First section: User can disable or enable antibot protection 
* Second Section: Anti bot parameters 
  * For each parameter add question mark, when user hover on the question mark, example what each parameter does  
    * The response status considered for blocking, user can select one or more statuses from pre-defined list: 30X, 40X, 50X
      * IMPORTANT: once user choose from a list the status codes, the real value that sent to the API must be a regex.
      * HTTP status codes in the 3xx (Redirection), 4xx (Client Error) and 5xx (Server Error) ranges
      * For example, if user selected 30x, 40x and 50x, the regex should be sent to the API: ^(3[0-9]{2}|4[0-9]{2}|5[0-9]{2})$, if only 30x and 50x then ^(3[0-9]{2}|5[0-9]{2})$
    * Block period: for how long time the blocking will take place, the user inputs seconds 
    * Fail threshold: the number of request after which the block will become active 
    * Fail window: the time period in which we count fail attempts and the fail count can't be reset. user input seconds here  
* Third section - the Action: in this section user should define what should happen once the block is triggered
* For now, we support only one blocking action: the Google Captcha V2 verification 
  * Captcha V2 verification parameters  
    * Enabled or disabled 
    * Redirect URL: the url to redirect to once captcha successfully verified
    * Site Key: Google Captcha V2 Site Key
    * Secret Key: Google Captcha V2 Secret Key

## Antibot protection UI - Connect to API 
* Connect the UI to API 
* To load the data use `/wafie.v1.ProtectionService/GetProtection` method
* In the JSON response use this data path: `protection.desiredState.antiBot`
* If the `protection.desiredState.antiBot` assume antiBot disabled, all the parameters are null
* To update the Antibot, use POST method to `/wafie.v1.ProtectionService/PutProtection` endpoint 
* Example JSON BODY:
  ```json
  {
    "anti_bot": {
      "block_period": 3646542503,
      "captcha_v2": {
        "enabled": false,
        "redirect_url": "velit dolor",
        "secret_key": "consequat esse Ut",
        "site_key": "pariatur est dolor do ipsum"
      },
      "enabled": false,
      "fail_threshold": 497229015,
      "fail_window": 1238802853,
      "response_statuses": "nostrud"
    }
  }
  ```