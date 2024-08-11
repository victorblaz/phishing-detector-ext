from flask import Flask, request, jsonify
import logging
from extract import main, get_prediction_from_url
from datetime import datetime
from collections import Counter
import plotly.graph_objects as go
import plotly.express as px
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import json
import pickle
import pandas as pd
import os
import subprocess

app = Flask(__name__)

logging.basicConfig(level=logging.DEBUG)

@app.route('/extract_features', methods=['POST'])
def extract_features_endpoint():
    try:
        if not request.is_json:
            logging.error("Request data is not in JSON format.")
            return jsonify({'error': 'Request data must be JSON'}), 400

        data = request.json
        url = data.get('url')
        if not url:
            logging.error("No URL provided in request data.")
            return jsonify({'error': 'No URL provided'}), 400

        logging.info(f"Received URL for feature extraction: {url}")
        
        # Extract features using the main function
        features = main(url)
        
        logging.info(f"Extracted features: {features}")
        return jsonify({'features': features})

    except Exception as e:
        logging.exception("Error occurred during feature extraction.")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        if not request.is_json:
            logging.error("Request data is not in JSON format.")
            return jsonify({'error': 'Request data must be JSON'}), 400

        data = request.json
        url = data.get('url')
        if not url:
            logging.error("No URL provided in request data.")
            return jsonify({'error': 'No URL provided'}), 400

        logging.info(f"Received URL for prediction: {url}")

        result = get_prediction_from_url(url)
        logging.info(f"Prediction result: {result}")
        
        if result == 'malicious':
            save_malicious_url(url)

        return jsonify({'result': result})
    except Exception as e:
        logging.exception("Error occurred during prediction.")
        return jsonify({'error': str(e)}), 500

def save_malicious_url(url):
    try:
        with open('malicious_urls.json', 'a') as f:
            json.dump({'url': url}, f)
            f.write('\n')
        logging.info(f"Saved malicious URL: {url}")
    except Exception as e:
        logging.exception("Error occurred while saving malicious URL.")

@app.route('/api/collect_url', methods=['POST'])
def collect_url():
    try:
        data = request.get_json()
        with open('url_data.json', 'a') as f:
            json.dump(data, f)
            f.write('\n')
        return '', 204
    except Exception as e:
        logging.exception("Error occurred while collecting URL.")
        return jsonify({'error': str(e)}), 500

@app.route('/api/track', methods=['POST'])
def track_event():
    try:
        event_data = request.get_json()

        # Create the file if it doesn't exist
        if not os.path.exists('event_log.json'):
            with open('event_log.json', 'w') as f:
                pass  # Just create the empty file

        # Save the event data
        with open('event_log.json', 'a') as f:
            json.dump(event_data, f)
            f.write('\n')
        
        return '', 204
    except Exception as e:
        logging.exception("Error occurred while tracking event.")
        return jsonify({'error': str(e)}), 500


# Function to retrain the model
def retrain_model():
    try:
        # Load new data
        urls = []
        with open('url_data.json', 'r') as f:
            for line in f:
                urls.append(json.loads(line))

        df = pd.DataFrame(urls)

        # Feature extraction
        df['features'] = df['url'].apply(lambda url: main(url))

        # Prepare data for training
        X = list(df['features'])
        y = df['label']

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Train the model
        model = RandomForestClassifier()
        model.fit(X_train, y_train)

        # Save the retrained model
        with open('rf_modelNew.joblib', 'wb') as f:
            pickle.dump(model, f)

        logging.info("Model retrained and saved successfully.")
    except Exception as e:
        logging.exception("Error occurred during model retraining.")

# Endpoint to manually trigger retraining (for testing purposes)
@app.route('/api/retrain', methods=['POST'])
def retrain_endpoint():
    try:
        retrain_model()
        return jsonify({'message': 'Model retrained successfully'}), 200
    except Exception as e:
        logging.exception("Error occurred during model retraining.")
        return jsonify({'error': str(e)}), 500



@app.route('/api/analyze', methods=['GET'])
def analyze():
    try:
        # Check if the event log file exists
        if not os.path.exists('event_log.json'):
            return jsonify({'success': False, 'message': 'No events found. The event log file does not exist.'})
        
        # Load event data from event_log.json
        events = []
        with open('event_log.json', 'r') as f:
            for line in f:
                events.append(json.loads(line))
        
        # Create DataFrame from events
        df = pd.DataFrame(events)
        
        # Check if the DataFrame is empty
        if df.empty:
            return jsonify({'success': False, 'message': 'No events found.'})
        
        # Filter link click events
        link_clicks = df[df['event'] == 'link_click']
        
        # Check if there are link click events
        if link_clicks.empty:
            return jsonify({'success': False, 'message': 'No link click events found.'})
        
        # Count the occurrences of each link
        link_click_counts = link_clicks['element'].value_counts().reset_index()
        link_click_counts.columns = ['Link', 'Click Count']
        
        # Create bar plot using Plotly
        fig = px.bar(link_click_counts, x='Link', y='Click Count', title='Link Click Analysis', labels={'Link': 'Link', 'Click Count': 'Click Count'})
        
        # Save the plot as an HTML file
        plot_path = os.path.join('static', 'link_click_analysis.html')  # Save to the 'static' folder
        fig.write_html(plot_path)
        
        return jsonify({'success': True, 'message': 'Analysis completed successfully.', 'plot_path': plot_path})
    except Exception as e:
        logging.exception("Error occurred during analysis.")
        return jsonify({'success': False, 'message': str(e)})


if __name__ == '__main__':
    app.run(port=6500)
