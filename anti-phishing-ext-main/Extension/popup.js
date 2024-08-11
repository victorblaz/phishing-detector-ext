document.addEventListener('DOMContentLoaded', () => {
    const checkUrlButton = document.getElementById('checkUrl');
    const analyzeDataButton = document.getElementById('analyzeData');
    const retrainModelButton = document.getElementById('retrainModel'); // Assuming this button exists in your HTML
    const popup = document.getElementById('popup');
    const overlay = document.getElementById('overlay');
    const popupClose = document.getElementById('popupClose');
    const predictionText = document.getElementById('predictionText');

    checkUrlButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab && currentTab.url) {
                checkUrl(currentTab.url);
            }
        });
    });

    analyzeDataButton.addEventListener('click', () => {
        analyzeData();
    });

    retrainModelButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'retrainModel' }, (response) => {
            console.log(response.status);
        });
    });

    popupClose.addEventListener('click', () => {
        closePopup();
    });

    overlay.addEventListener('click', () => {
        closePopup();
    });

    async function checkUrl(url) {
        try {
            const response = await fetch('http://localhost:6500/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url })
            });

            const data = await response.json();

            if (data.result === 'malicious') {
                chrome.runtime.sendMessage({ type: 'educationalContent', result: 'malicious', url: url });
                predictionText.textContent = `The URL ${url} is malicious!`;
                sendAnalytics(url, 'malicious');  // Send analytics for malicious result
            } else {
                chrome.runtime.sendMessage({ type: 'educationalContent', result: 'benign', url: url });
                predictionText.textContent = `The URL ${url} is safe.`;
                sendAnalytics(url, 'benign');  // Send analytics for benign result
            }

            openPopup();  // Open the popup after checking the URL
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function analyzeData() {
        try {
            const response = await fetch('http://localhost:6500/api/analyze', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            // Show the analysis result
            if (data.success) {
                window.open('link_click_analysis.html', '_blank');
            } else {
                console.error('Error:', data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
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

    function openPopup() {
        popup.style.display = 'block';
        overlay.style.display = 'block';
    }

    function closePopup() {
        popup.style.display = 'none';
        overlay.style.display = 'none';
    }
});
