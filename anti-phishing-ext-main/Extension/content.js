// Track user clicks
document.addEventListener('click', function(event) {
  chrome.runtime.sendMessage({
    type: 'userClick',
    element: event.target.tagName,
    url: window.location.href
  });
});

// Track form submissions
document.addEventListener('submit', function(event) {
  chrome.runtime.sendMessage({
    type: 'formSubmit',
    formAction: event.target.action,
    url: window.location.href
  });
});

// Track other user interactions (e.g., navigation)
document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    chrome.runtime.sendMessage({
      type: 'userNavigation',
      key: 'Enter',
      url: window.location.href
    });
  }
});

// Listen for messages from the background script to display alerts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.prediction === 'malicious') {
    alert("Warning: Malicious website detected!!");
  } else if (message.prediction === 'benign') {
    alert("Website is SAFE");
  }
});
