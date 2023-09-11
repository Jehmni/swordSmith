from logging import Logger
from flask import Flask, request, jsonify
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

log = Logger('new')

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

@app.route('/api/recordings', methods=['POST'] )
def process_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    # Load audio data from the FileStorage object
    audio_file = request.files['audio']
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    audio_file.save(temp_file.name)
    temp_file.close()

    print(temp_file)
    # # Convert the audio to MP3 using ffmpeg
    # converted_audio = AudioSegment.from_wav(audio_file)
    # mp3_io = io.BytesIO()
    # converted_audio.export(mp3_io, format='mp3')

    try:
        # audio_filename = audio_file.filename
        # audio_content_type = audio_file.content_type
        # # Determine the file extension from the filename
        # file_extension = audio_filename.rsplit('.', 1)[1].lower() if '.' in audio_filename else ''
        # # Log the file extension to the server console
        # print('File extension:', file_extension)
        # Process the audio file and generate processed_data
        model = whisper.load_model("base")
        result = model.transcribe(temp_file.name)
        verse = result["text"]

        # URL of the API endpoint
        api_url = "https://api.scripture.api.bible/v1/bibles/de4e12af7f28f599-02/search"
        api_token = "92d36072a47ab8815232393b233a3da3"
        query = verse
        # Query parameters
        query_params = {
            "query": query,
            "sort": "relevance"
        }

        # Set the headers
        headers = {
            "accept": "application/json",
            "api-key": api_token
        }

        # Make the GET request
        response = requests.get(api_url, params=query_params, headers=headers)

        # Check if the request was successful
        if response.status_code == 200:
            scripture_response = response.json()  # Parse the response JSON data
            # return jsonify(scripture_response)  # Return JSON response to the frontend
            verses = scripture_response["data"]["verses"]
        else:
            return jsonify({'error': 'Error while processing audio'}), 500
        
        result_set= []
        for verse in verses:
            verse_dict = {}
            reference = verse["reference"]
            text = verse["text"]
            verse_dict['reference'] = reference
            verse_dict['text'] = text
            result_set.append(verse_dict)

        return jsonify({'data': [verse_dict]}), 200

    except Exception as e:
        return jsonify({'error': 'Error processing audio: ' + str(e)}), 500
    finally:
        os.unlink(temp_file.name)

if __name__ == '__main__':
        app.run()
 

 