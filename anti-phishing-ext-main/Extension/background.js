chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      checkUrl(tabs[0].url);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkUrl(tab.url);
  }
});

function checkUrl(url) {
  // Skip checking if the URL is for educational content (data:text/html)
  if (url.startsWith('data:text/html')) {
    return;
  }
  fetch('http://localhost:6500/api/predict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url: url })
  })
  .then(response => response.json())
  .then(data => {
    if (data.result === 'malicious') {
      saveMaliciousUrl(url);
      showEducationalPopup(url, 'malicious');
      sendAnalytics(url, 'malicious'); // Track the event
    } else if (data.result === 'benign') {
      showEducationalPopup(url, 'benign');
      sendAnalytics(url, 'benign'); // Track the event
    }
  })
  .catch(error => console.error('Error:', error));
}

function showEducationalPopup(url, status) {
  let notificationOptions;

  if (status === 'malicious') {
    notificationOptions = {
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Malicious URL Detected',
      message: `The URL ${url} has been flagged as potentially phishing. Learn more about phishing attacks and how to protect yourself:`,
      buttons: [{ title: 'Learn More' }],
      priority: 0
    };
  } else {
    notificationOptions = {
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Safe URL Detected',
      message: `The URL ${url} is detected as safe. However, always stay cautious and informed about safe browsing practices.`,
      buttons: [{ title: 'Learn More' }],
      priority: 0
    };
  }

  chrome.notifications.create(notificationOptions, (notificationId) => {
    chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
      if (notifId === notificationId && btnIdx === 0) {
        if (status === 'malicious') {
          showMaliciousEducationContent(url);
        } else {
          showSafeBrowsingTips(url);
        }
      }
    });
  });
}

function saveMaliciousUrl(url) {
  chrome.storage.local.get({ maliciousUrls: [] }, (result) => {
    const maliciousUrls = result.maliciousUrls;
    maliciousUrls.push(url);
    chrome.storage.local.set({ maliciousUrls: maliciousUrls }, () => {
      console.log('Malicious URL saved.');
    });
  });
}

function showMaliciousEducationContent(url) {
  let customContent = '';
  let maliciousIntent = '';

  // Analyze the URL to determine the type of threat
  if (url.includes('login')) {
    customContent = `
      <li>This site appears to mimic a login page. Be cautious when entering your credentials.</li>
    `;
    maliciousIntent = `
      <ul>
        <li><strong>Credential Phishing:</strong> The attacker is attempting to steal your username and password by creating a fake login page that looks like a legitimate site.</li>
        <li><strong>Account Compromise:</strong> If successful, the attacker could gain unauthorized access to your accounts, leading to potential financial loss or identity theft.</li>
      </ul>
    `;
  } else if (url.includes('bank')) {
    customContent = `
      <li>This site may be pretending to be a financial institution. Never enter sensitive financial information without verifying the website's legitimacy.</li>
    `;
    maliciousIntent = `
      <ul>
        <li><strong>Banking Fraud:</strong> The attacker is trying to obtain your banking credentials or other financial information by impersonating a bank.</li>
        <li><strong>Money Theft:</strong> If you enter your information, the attacker could transfer money from your account or use your details for fraudulent transactions.</li>
      </ul>
    `;
  } else if (url.includes('offer') || url.includes('prize')) {
    customContent = `
      <li>This site may be using fake offers or prizes to trick you into providing personal information.</li>
    `;
    maliciousIntent = `
      <ul>
        <li><strong>Scam Offers:</strong> The attacker lures you with too-good-to-be-true deals or prizes to collect your personal and financial information.</li>
        <li><strong>Data Theft:</strong> The stolen data could be used for identity theft, spam, or even sold on the dark web.</li>
      </ul>
    `;
  } else {
    customContent = `
      <li>This site has been flagged as malicious. Avoid interacting with it and do not enter any personal information.</li>
    `;
    maliciousIntent = `
      <ul>
        <li><strong>Malware Distribution:</strong> The attacker might use this site to install malware on your device, which could steal your data, encrypt your files for ransom, or hijack your system.</li>
        <li><strong>Phishing or Fraud:</strong> The site could be a part of a broader phishing or scam network aimed at stealing your personal information.</li>
      </ul>
    `;
  }

  const popupHtml = `
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #faf2f2;
          margin: 0;
          padding: 0;
          color: #333;
        }
        h2 {
          color: #a60505;
          font-size: 24px;
          margin-bottom: 15px;
        }
        p {
          font-size: 16px;
          color: #555;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        ul {
          list-style: disc;
          padding-left: 20px;
          margin-bottom: 20px;
        }
        ul li {
          font-size: 16px;
          margin-bottom: 10px;
          color: #555;
        }
        strong {
          color: #a60505;
          font-weight: bold;
        }
        a {
          color: #007bff;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        button {
          padding: 10px 20px;
          font-size: 16px;
          background-color: #007bff;
          color: #fff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 20px;
        }
        button:hover {
          background-color: #0056b3;
        }
      </style>
    </head>
    <body>
      <h2>Phishing Alert</h2>
      <p>The URL <strong>${url}</strong> has been flagged as potentially phishing. Learn more about phishing attacks and how to protect yourself:</p>
      <ul>
        ${customContent}
        <li>Always verify the source of emails and websites before entering personal information.</li>
        <li>Use two-factor authentication whenever possible to add an extra layer of security.</li>
        <li>Keep your software and antivirus updated to protect against known vulnerabilities.</li>
      </ul>
      <h3>What is the goal of this malicious URL?</h3>
      ${maliciousIntent}
    </body>
    </html>
  `;

  chrome.windows.create({
    url: "data:text/html," + encodeURIComponent(popupHtml),
    type: "popup",
    width: 400,
    height: 400
  });
}


function showSafeBrowsingTips(url) {
  const popupHtml = `
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #faf2f2;
          margin: 0;
          padding: 0;
          color: #333;
        }
        h2 {
          color: #4fba43;
          font-size: 24px;
          margin-bottom: 15px;
        }
        p {
          font-size: 16px;
          color: #555;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        ul {
          list-style: disc;
          padding-left: 20px;
          margin-bottom: 20px;
        }
        ul li {
          font-size: 16px;
          margin-bottom: 10px;
          color: #555;
        }
        strong {
          color: #4fba43;
          font-weight: bold;
        }
        a {
          color: #007bff;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        button {
          padding: 10px 20px;
          font-size: 16px;
          background-color: #007bff;
          color: #fff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 20px;
        }
        button:hover {
          background-color: #0056b3;
        }
      </style>
    </head>
    <body>
      <h2>Safe Browsing Tips</h2>
      <p>The URL <strong>${url}</strong> is detected as safe. However, it's important to stay informed about safe browsing practices:</p>
      <ul>
        <li>Always verify the URL and make sure it matches the website you intend to visit.</li>
        <li>Be cautious of unsolicited emails or messages asking for personal information.</li>
        <li>Look for HTTPS in the URL to ensure a secure connection.</li>
        <li>Be wary of pop-ups or ads that seem too good to be true.</li>
        <li>Use a reputable antivirus program and keep it updated.</li>
        <li>Regularly update your browser and other software to protect against vulnerabilities.</li>
        <li>Learn more about safe browsing practices.</li>
      </ul>
    </body>
    </html>
  `;

  chrome.windows.create({
    url: "data:text/html," + encodeURIComponent(popupHtml),
    type: "popup",
    width: 400,
    height: 400
  });
}

function sendAnalytics(url, prediction) {
  const event = {
      event: 'url_prediction',
      url: url,
      prediction: prediction,
      timestamp: new Date().toISOString()
  };
  fetch('http://localhost:6500/api/track', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
  })
  .catch(error => console.error('Error sending analytics:', error));
}

// Adding a listener for the retrainModel message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'retrainModel') {
      retrainModel();
      sendResponse({status: 'retraining started'});
  }
});

function retrainModel() {
  fetch('http://localhost:6500/api/retrain', {
      method: 'POST',
  })
  .then(response => response.json())
  .then(data => {
      if (data.message) {
          alert(data.message);
          sendAnalytics('retrain_model', 'success'); // Track the retrain success event
      } else {
          alert('Retraining failed: ' + data.error);
          sendAnalytics('retrain_model', 'failure'); // Track the retrain failure event
      }
  })
  .catch(error => {
      console.error('Error:', error);
      sendAnalytics('retrain_model', 'error'); // Track the retrain error event
  });
}
