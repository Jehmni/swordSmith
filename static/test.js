const container = document.getElementById("data-container");
const micImage = document.getElementById('micImage');
const searchIcon = document.querySelector('.search-icon');
const searchInput = document.querySelector('.search-input'); // Add this line
let recording = false;
let micMuted = false;
let mediaRecorder;
let chunks = [];
let transcribedText = ""; // Store the transcribed text

micImage.addEventListener('click', toggleRecording);

function toggleRecording() {
  if (!recording) {
    recording = true;
    micImage.style.opacity = 0.5;
    startRecording();
  } else {
    recording = false;
    micImage.style.opacity = 1;
    stopRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    }
    
    mediaRecorder.onstop = () => {
      console.log('Inside mediaRecorder.onstop');
      console.log('Chunks:', chunks);
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        chunks = [];
        console.log(blob);
        sendAudioRecording(blob);
      }
    };
    
    mediaRecorder.start();
  } catch (error) {
    console.error('Error accessing microphone:', error);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
}

function sendAudioRecording(blob) {
  const formData = new FormData();
  formData.append('audio', blob, 'audio.wav');

  const payload = formData;

  fetch('http://127.0.0.1:5000/api/recordings', {
    method: 'POST',
    body: payload,
  })
  .then(response => response.json())
  .then(data => {
    transcribedText = data.verse; // Store the transcribed text

    // Insert the transcribed text into the search input
    searchInput.value = transcribedText;

    // Clear existing verses
    container.innerHTML = '';

    chunks = []; // Clear chunks array for the next recording
  })
  .catch(error => {
    console.error('Error sending recording:', error);
    chunks = []; // Clear chunks array in case of error
  });
}

// Add a click event listener to the search icon
searchIcon.addEventListener('click', () => {
  // Get the transcribed text from the search input
  const searchText = searchInput.value.trim();
  if (searchText) {
    // Send the searchText to the backend, and let the backend make the Bible API request
    fetch('http://127.0.0.1:5000/api/query_bible', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query_text: searchText }),
    })
    .then(response => response.json())
    .then(data => {
      // Handle the response from the backend and display the results
      console.log('Bible API Response:', data);
      displayBibleVerses(data); // Call a function to display the verses
    })
    .catch(error => {
      console.error('Error fetching Bible verses:', error);
    });
  } else {
    console.log('Search text is empty.');
  }
});

// Function to display Bible verses
function displayBibleVerses(data) {
  const versesContainer = document.getElementById("data-container");

  // Clear existing verses
  versesContainer.innerHTML = '';

  // Check if there is data and that it contains verses
  if (data && data.data && data.data.verses) {
    const verses = data.data.verses;

    // Loop through the verses and display them
    verses.forEach(verse => {
      const verseElement = document.createElement("div");
      verseElement.classList.add("verse");
      verseElement.textContent = verse.text;
      versesContainer.appendChild(verseElement);
    });
  } else {
    // Handle the case where there are no verses in the response
    const noVersesElement = document.createElement("div");
    noVersesElement.textContent = "No verses found.";
    versesContainer.appendChild(noVersesElement);
  }
}
