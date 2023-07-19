App Structure Plan:

Files to be generated:
1. options.html
2. options.js
3. popup.html
4. popup.js
5. background.js
6. manifest.json

1. options.html:
   - Structure:
     - HTML head with a link to the Pico CSS stylesheet.
     - HTML body with a main element.
     - Inside the main element, an HTML form with two inputs and a submit button.

2. options.js:
   - Exported variables: None.
   - Functionality:
     - Listen for the DOMContentLoaded event.
     - Retrieve the values of API_KEY and API_ENDPOINT from chrome.storage.sync.
     - Populate the form inputs with the retrieved values.
     - Add an event listener to the form submit event.
     - When the form is submitted, retrieve the values from the form inputs.
     - Store the values in chrome.storage.sync.

3. popup.html:
   - Structure:
     - HTML head with a link to the Pico CSS stylesheet.
     - HTML body with a main element.
     - Inside the main element, a loading indicator, success message, and error message.

4. popup.js:
   - Exported variables: None.
   - Functionality:
     - Listen for the chrome.runtime.onMessage event.
     - If the event is PAGE_SAVED, hide the loader and show the success message.
     - If the event is SAVE_ERROR, hide the loader and show the error message.
     - Add a timeout function to close the popup 2 seconds after the PAGE_SAVED event is received.
     - Control the display of the HTML elements using the CSS display property.

5. background.js:
   - Exported variables: None.
   - Functionality:
     - Listen for the chrome.runtime.onMessage event.
     - If the event is sendPageInfos, retrieve the API_KEY and API_ENDPOINT from chrome.storage.sync.
     - Retrieve the page URL from the data payload of the sendPageInfos event.
     - Make a fetch request to the API_ENDPOINT with the page URL and API_KEY as headers and the payload.
     - Handle the success and error states of the fetch request.
     - Dispatch a PAGE_SAVED or SAVE_ERROR message using chrome.runtime.onMessage.

6. manifest.json:
   - Structure:
     - manifest_version set to 3.
     - Name set to "Tana Chrome Extension".
     - Version set to "1.0".
     - Permissions set to "activeTab", "storage", and "scripting".
     - Action default_popup set to "popup.html".
     - options_ui page set to "options.html" and open_in_tab set to false.
     - Background service_worker set to "background.js".