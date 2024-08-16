# phishing-detector-ext

# Introduction

**Anti-phisher**  was designed with the average internet user in mind, especially those who visit different websites often and may come across rogue websites looking to steal personal data or infect their computers with malware. Our Chrome extension helps users by using a pre-trained machine learning model to evaluate a website's security and recommending it for safe browsing. In addition to identifying harmful URLs, it also performs analysis on system events, informs users about malicious URLs, stores malicious URLs, and continuously trains the machine learning model to incorporate new data.

- [Anti-phisher - A Chrome Extension to detect Malicious Websites]
(#Anti-phisher---a-chrome-extension-to-detect-malicious-websites)
- [Introduction](#introduction)
- [How it Works ?](#how-it-works-)
  - [What Problem it Solves ?](#what-problem-it-solves-)
- [Tech Stack](#tech-stack)
- [Usage](#usage)
  - [Directory Structure](#directory-structure)
  - [Backend - Ml Model](#backend---ml-model)
  - [Extension](#extension)

# How it Works ?



The ML model extracts the following features from a url :


  
| Feattures     Used                  |                                   |                            |                     |
| ----------------------------------- | --------------------------------- | -------------------------- | ------------------- |
| Having IP address                   | URL Length                        | URL Shortening service     | Having @ symbol     |
| Having double slash                 | Having dash symbol(Prefix Suffix) | Having multiple subdomains | SSL Final State     |  | Domain Registration Length | Favicon | HTTP or HTTPS token in domain name | Request URL |
| URL of Anchor                       | Links in tags                     | SFH - Server from Handler. | Submitting to email |
| Abnormal URL                        | IFrame                            | Age of Domain              | DNS Record          |
| Web Traffic -  using data.alexa.com | Google Index                      |                            Reports |
 
  

<br/>

## What Problem it Solves ?

In today's digital landscape, many websites aim to collect user data by deceiving visitors into revealing their credentials, often for fraudulent purposes or other malicious acts. Unsuspecting users browsing the internet are often unaware of the dangers lurking behind the scenes, potentially exposing themselves to identity theft or malware downloads.

To address this issue, we developed a Chrome extension designed to act as a safeguard between users and malicious websites. This extension helps users determine whether a particular website is safe for browsing, providing a layer of security against deceitful sites. 

Our project was specifically created with the typical internet user in mind, taking into account the necessity of often visiting different websites. With the help of this extension, users may browse the internet more securely and avoid being tricked by shady websites that aim to steal data or install dangerous software on their computers. Apart from detecting malicious URLs, it also analyses system events, notifies users of malicious URLs, keeps track of malicious URLs, and continuously trains the machine learning model to take into account fresh data.

# Tech Stack

- [HTML](https://www.w3schools.com/html/) - The front-end development language used for creating extension.

- [CSS](https://www.w3schools.com/css/) - The  front-end development language used for creating extension.

- [Python](https://www.python.org/) - The Programing Language used to parse features from a website and for training/testing of the ML model.
- [JavaScript](https://www.javascript.com/) - The scripting language used for creating the extension and sending  requests to the served Ml model.

- [whois](https://pypi.org/project/whois/) - The package for retrieving WHOIS information of domains during feature extraction.
- [scikit-learn](https://scikit-learn.org/stable/) -
  The library used for training ML models.
<br/>

# Usage

## Directory Structure

```
.
|-- LICENSE
|-- README.md
|-- extension
|   |-- manifest.json
|   |-- background.js
|   |-- content.js
|   |-- popup.html
|   |-- popup.js
|   `-- popup.css
|-- static
|   |-- 
|-- app.py
|-- datalabel.csv
|-- ecent_log.json
|-- extract.py
|-- label.csv
|-- malicious.json
|-- requirements.txt
|-- rf_model.joblib
`-- train.py
```

## Backend - Ml Model

   ```
   pip install -r requirements.txt 
   ./app.py
   ```

## Extension

1. Go to chrome Settings using three dots on the top right corner

2. select Extensions.
3. Enable developer mode
4. click on Load Unpacked and select the extensions folder.
</br>
