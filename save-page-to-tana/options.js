document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["API_KEY", "API_ENDPOINT"], (result) => {
    const apiKey = result.API_KEY;
    const apiEndpoint = result.API_ENDPOINT;

    const form = document.querySelector("form");
    const apiKeyInput = document.getElementById("api-key");
    const apiEndpointInput = document.getElementById("api-endpoint");

    apiKeyInput.value = apiKey;
    apiEndpointInput.value = apiEndpoint;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      
      const apiKeyValue = apiKeyInput.value.trim();
      const apiEndpointValue = apiEndpointInput.value.trim();

      chrome.storage.sync.set(
        {
          API_KEY: apiKeyValue,
          API_ENDPOINT: apiEndpointValue,
        },
        () => {
          window.close();
        }
      );
    });
  });
});
