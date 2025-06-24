document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ type: 'popupOpened' });
})

setTimeout(() => {
  document.getElementById("success").classList.remove('hidden');
  document.getElementById("loader").classList.add('hidden');

  setTimeout(() => {
    window.close();
  }, 200);
}, 300);