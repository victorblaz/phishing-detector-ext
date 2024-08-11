import pandas as pd
from flask import Flask, request, jsonify
import json
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from extract import main
import pickle

app = Flask(__name__)

# Load new data
urls = []
with open('url_data.json', 'r') as f:
    for line in f:
        urls.append(json.loads(line))

df = pd.DataFrame(urls)

# Feature extraction
def extract_features(url):
    features = main(url)  # Adjust this function based on your actual feature extraction logic
    return features

df['features'] = df['url'].apply(extract_features)

# Prepare data for training
X = df['features'].tolist()  # Convert features to a list
y = df['label']

# Ensure features are in the correct format (e.g., list of lists)
X = pd.DataFrame(X).values.tolist()

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the model
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Save the model as retrained model
with open('rf_modelNew.joblib', 'wb') as f:
    pickle.dump(model, f)

print("Model retrained and saved successfully.")
