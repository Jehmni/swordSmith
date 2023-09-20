import logging  # Correct the import

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import whisper
import requests
import librosa
import numpy as np
import os
import tempfile
from werkzeug.utils import secure_filename
from pydub import AudioSegment
import io
import openai

log = logging.getLogger('new')  # Correct the Logger usage

app = Flask(__name__)
app.static_folder = 'static'  # Set the static folder
CORS(app)  # This will enable CORS for all routes

# Initialize your OpenAI API key
openai.api_key = "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"

# Define the OpenAI model and other parameters
openai_model = "gpt-3.5-turbo-16k"
max_tokens = 100
temperature = 0.1

# Add the new route for serving the HTML file
@app.route('/')
def index():
    return render_template('index.html')

# Store the transcribed text temporarily
transcribed_text = ""

@app.route('/api/recordings', methods=['POST'])
def process_audio():
    global transcribed_text  # Make the variable global

    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    # Load audio data from the FileStorage object
    audio_file = request.files['audio']
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    audio_file.save(temp_file.name)
    temp_file.close()

    print(temp_file)

    try:
        # Process the audio file and generate processed_data
        model = whisper.load_model("base")
        result = model.transcribe(temp_file.name)
        transcribed_text = result["text"]  # Store the transcribed text

        # Send the transcribed text to the frontend
        return jsonify({'verse': transcribed_text})

    except Exception as e:
        return jsonify({'error': 'Error processing audio: ' + str(e)}), 500
    finally:
        os.unlink(temp_file.name)

# Add a new route to query the Bible API via proxy
@app.route('/api/query_bible', methods=['POST'])
def query_bible():
    global transcribed_text

    # Get the transcribed text from the request
    query_text = request.json.get('query_text', '')

    # You can replace this with your actual API key
    api_key = "92d36072a47ab8815232393b233a3da3"

    # URL of the Bible API endpoint
    api_url = "https://api.scripture.api.bible/v1/bibles/de4e12af7f28f599-02/search"

    # Query parameters
    query_params = {
        "query": query_text,
        "sort": "relevance"
    }

    # Set the headers
    headers = {
        "accept": "application/json",
        "api-key": api_key
    }

    try:
        # Make the GET request to the Bible API via proxy
        response = requests.get(api_url, params=query_params, headers=headers)

        # Check if the request was successful
        if response.status_code == 200:
            scripture_response = response.json()  # Parse the response JSON data
            return jsonify(scripture_response)  # Return JSON response to the frontend
        else:
            return jsonify({'error': 'Error while querying Bible API'}), 500

    except Exception as e:
        return jsonify({'error': 'Error querying Bible API: ' + str(e)}), 500

# Define the search_by_reference function
def search_by_reference(transcribedText):
    try:
        response = openai.ChatCompletion.create(model="gpt-3.5-turbo-16k",
                                                max_tokens=100,
                                                temperature=0.1,
                                                messages= [
                                                    {"role": "system", "content": "You are a bible assistant that  help users to find scriptures or bible passages specifically from the King James Version(KJV)"},
                                                    {"role": "user", "content": transcribedText}
                                                ])

        result = response["choices"][0]["message"]["content"]
        return result
    except Exception as e:
        return "Failed to get text response from GPT3.5 API"

# Modify your /api/by_reference route to use the function
@app.route('/api/by_reference', methods=['POST'])
def by_reference():
    try:
        # Get the user's query from the request
        query_text = request.json.get('transcribed_text', '')

        # Use the search_by_reference function
        response = search_by_reference(query_text)

        return jsonify({"response": response})

    except Exception as e:
        return jsonify({'error': 'Error processing request: ' + str(e)}), 500

#run app
if __name__ == '__main__':
    app.run()
