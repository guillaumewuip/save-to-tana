chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "PAGE_SAVING") {
    document.getElementById("loader").classList.remove('hidden');
    document.getElementById("error").classList.add('hidden');
    document.getElementById("success").classList.add('hidden');
  }

  if (message.type === "PAGE_SAVED") {
    document.getElementById("success").classList.remove('hidden')
    document.getElementById("loader").classList.add('hidden');
    document.getElementById("error").classList.add('hidden');

    setTimeout(() => {
      window.close();
    }, 1000);
  }

  if (message.type === "SAVE_ERROR") {
    document.getElementById("error").classList.remove('hidden');
    document.getElementById("loader").classList.add('hidden');
    document.getElementById("success").classList.add('hidden');
  }
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ type: 'popupOpened' });
})
