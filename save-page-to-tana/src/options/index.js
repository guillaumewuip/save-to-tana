document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["API_KEY", "API_ENDPOINT", "GEMINI_API_KEY"], (result) => {
    const apiKey = result.API_KEY;
    const apiEndpoint = result.API_ENDPOINT;
    const geminiApiKey = result.GEMINI_API_KEY;

    const form = document.querySelector("form");
    const apiKeyInput = document.getElementById("api-key");
    const apiEndpointInput = document.getElementById("api-endpoint");
    const geminiApiKeyInput = document.getElementById("gemini-api-key");

    apiKeyInput.value = apiKey;
    apiEndpointInput.value = apiEndpoint;
    geminiApiKeyInput.value = geminiApiKey;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      
      const apiKeyValue = apiKeyInput.value.trim();
      const apiEndpointValue = apiEndpointInput.value.trim();
      const geminiApiKeyValue = geminiApiKeyInput.value.trim();

      chrome.storage.sync.set(
        {
          API_KEY: apiKeyValue,
          API_ENDPOINT: apiEndpointValue,
          GEMINI_API_KEY: geminiApiKeyValue,
        },
        () => {
          window.close();
        }
      );
    });
  });

  chrome.storage.local.get(["deadQueue"], (result) => {
    const deadItems = result.deadQueue || [];
    const deadItemsContainer = document.querySelector("#dead_items");

    deadItemsContainer.innerHTML = JSON.stringify(deadItems, null, 2);
  });
});
