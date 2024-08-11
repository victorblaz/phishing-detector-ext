import re
import socket
import ssl
from urllib.parse import urlparse
from googlesearch import search
from tld import get_tld
import psutil
import numpy as np
from joblib import load
import requests


# Function to check if the URL contains an IP address
def having_ip_address(url):
    match = re.search(
        r'(([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.'
        r'([01]?\d\d?|2[0-4]\d|25[0-5])\/)|'  # IPv4
        r'((0x[0-9a-fA-F]{1,2})\.(0x[0-9a-fA-F]{1,2})\.(0x[0-9a-fA-F]{1,2})\.(0x[0-9a-fA-F]{1,2})\/)|' # IPv4 in hexadecimal
        r'(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}', url)  # IPv6
    return 1 if match else 0

# Function to check if the URL is abnormal
def abnormal_url(url):
    hostname = urlparse(url).hostname
    return 0 if hostname and hostname in url else 1

# Function to check if the URL is indexed by Google
def google_index(url):
    try:
        site = search(url)
        return 1 if site else 0
    except Exception as e:
        print(f"Error checking Google index for {url}: {e}")
        return 0

# Function to count occurrences of a character in URL
def count_occurrences(url, char):
    return url.count(char)

# Function to count the number of directories in URL path
def no_of_dir(url):
    return urlparse(url).path.count('/')

# Function to check if URL uses a URL shortening service
def shortening_service(url):
    match = re.search(
        r'bit\.ly|goo\.gl|shorte\.st|go2l\.ink|x\.co|ow\.ly|t\.co|tinyurl|tr\.im|is\.gd|cli\.gs|'
        r'yfrog\.com|migre\.me|ff\.im|tiny\.cc|url4\.eu|twit\.ac|su\.pr|twurl\.nl|snipurl\.com|'
        r'short\.to|BudURL\.com|ping\.fm|post\.ly|Just\.as|bkite\.com|snipr\.com|fic\.kr|loopt\.us|'
        r'doiop\.com|short\.ie|kl\.am|wp\.me|rubyurl\.com|om\.ly|to\.ly|bit\.do|t\.co|lnkd\.in|'
        r'db\.tt|qr\.ae|adf\.ly|goo\.gl|bitly\.com|cur\.lv|tinyurl\.com|ow\.ly|bit\.ly|ity\.im|'
        r'q\.gs|is\.gd|po\.st|bc\.vc|twitthis\.com|u\.to|j\.mp|buzurl\.com|cutt\.us|u\.bb|yourls\.org|'
        r'x\.co|prettylinkpro\.com|scrnch\.me|filoops\.info|vzturl\.com|qr\.net|1url\.com|tweez\.me|v\.gd|'
        r'tr\.im|link\.zip\.net', url)
    return 1 if match else 0

# Function to return the length of a URL component
def length_of_component(component):
    return len(component) if component else 0

# Function to check for suspicious words in URL
def suspicious_words(url):
    match = re.search(r'PayPal|login|signin|bank|account|update|free|lucky|service|bonus|ebayisapi|webscr', url, re.IGNORECASE)
    return 1 if match else 0

# Function to count digits in URL
def digit_count(url):
    return sum(1 for c in url if c.isdigit())

# Function to count letters in URL
def letter_count(url):
    return sum(1 for c in url if c.isalpha())

# Function to return the length of the first directory in URL path
def fd_length(url):
    urlpath = urlparse(url).path
    try:
        return len(urlpath.split('/')[1])
    except IndexError:
        return 0

# Function to return memory usage
def memory_usage():
    return psutil.Process().memory_info().rss

# Function to return CPU usage
def cpu_usage():
    return psutil.cpu_percent()

# Function to return network usage
def network_usage():
    net_io = psutil.net_io_counters()
    return net_io.bytes_sent + net_io.bytes_recv

# Function to check for redirects in URL
def check_redirect(url):
    try:
        response = requests.get(url, allow_redirects=False)
        return 1 if response.is_redirect else 0
    except requests.exceptions.RequestException as e:
        print(f"Error checking redirect for {url}: {e}")
        return 0

# Function to check SSL certificate of URL
def check_ssl_certificate(url):
    parsed_url = urlparse(url)
    hostname = parsed_url.hostname
    port = parsed_url.port or 443
    try:
        ssl.get_server_certificate((hostname, port))
        return 1
    except Exception as e:
        print(f"Error checking SSL certificate for {url}: {e}")
        return 0

# Function to check for XSS injection in URL
def check_xss_injection(url):
    xss_injection_patterns = [
        '<script>', '</script>', '<img src=x onerror=', 'javascript:', 'vbscript:',
        'onerror=', 'onload=', 'onmouseover='
    ]
    return 1 if any(pattern in url.lower() for pattern in xss_injection_patterns) else 0

# Main function to extract features from URL and return a list of feature values
def main(url):
    features = [
        having_ip_address(url),
        abnormal_url(url),
        google_index(url),
        count_occurrences(url, '.'),
        count_occurrences(url, 'www'),
        count_occurrences(url, '@'),
        no_of_dir(url),
        count_occurrences(url, '//'),
        shortening_service(url),
        count_occurrences(url, 'https'),
        count_occurrences(url, 'http'),
        count_occurrences(url, '%'),
        count_occurrences(url, '?'),
        count_occurrences(url, '-'),
        count_occurrences(url, '='),
        length_of_component(url),
        length_of_component(urlparse(url).hostname),
        suspicious_words(url),
        digit_count(url),
        letter_count(url),
        fd_length(url),
        length_of_component(get_tld(url, fail_silently=True)),
        memory_usage(),
        cpu_usage(),
        network_usage(),
        check_redirect(url),
        check_ssl_certificate(url),
        check_xss_injection(url)
    ]
    return features

# Function to load model and predict if URL is malicious or benign
def get_prediction_from_url(url):
    try:
        features = main(url)
        features = np.array(features).reshape(1, -1)

        try:
            loaded_model = load('rf_model.joblib')  # Ensure path is correct
        except FileNotFoundError:
            raise RuntimeError("Model file not found. Ensure 'rf_model.joblib' is in the correct path.")

        prediction = loaded_model.predict(features)
        return "malicious" if int(prediction[0]) == 1 else "benign"
    except Exception as e:
        raise RuntimeError(f"Error predicting URL: {e}")
    

