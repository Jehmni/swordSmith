import whisper
import requests

model = whisper.load_model("base")
result = model.transcribe("psalm23.mp3")
verse = result["text"]
verse

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
    data = response.json()  # Parse the response JSON data
    print(data)
else:
    print("Error:", response.status_code)

verses = data["data"]["verses"]

for verse in verses:
    reference = verse["reference"]
    text = verse["text"]
    print(f"{reference} - {text}")