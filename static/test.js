const container = document.getElementById("data-container");
const micImage = document.getElementById('micImage');
const searchIcon = document.querySelector('.search-icon');
const searchInput = document.querySelector('.search-input');
const micLoader = document.getElementById('micLoader');
let recording = false;
let micMuted = false;
let mediaRecorder;
let chunks = [];
let transcribedText = ""; // Store the transcribed text

// Hide the mic loader initially
micLoader.style.display = 'none';

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
    micLoader.style.display = 'block'; // Show the mic loader
    micLoader.textContent = 'Transcribing...'; // Set loader text
    transcribedText = ''; // Clear the transcribed text
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
      
      // Check if transcribedText has a value
      if (transcribedText) {
        micLoader.style.display = 'none';
      } else {
        // Display "No match found" when there is no transcribed text
        displayNoMatchFound();
      }
    })
    .catch(error => {
      console.error('Error sending recording:', error);
      chunks = []; // Clear chunks array in case of error
      // Hide the mic loader in case of an error
      micLoader.style.display = 'none';
      // Display "No match found" when there's an error
      displayNoMatchFound();
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
        // Display "No match found" when there's an error
        displayNoMatchFound();
      });
  } else {
    console.log('Search text is empty.');
  }
});

// Function to display Bible verses or "No match found"
function displayBibleVerses(data) {
  const versesContainer = document.getElementById("data-container");

  // Clear existing verses
  versesContainer.innerHTML = '';

  // Check if there is data and that it contains verses
  if (data && data.data && data.data.verses && data.data.verses.length > 0) {
    const verses = data.data.verses;

    // Loop through the verses and display them
    verses.forEach(verse => {
      const verseElement = document.createElement("div");
      verseElement.classList.add("verse");

      // Create a paragraph for the reference
      const referenceParagraph = document.createElement("p");
      referenceParagraph.classList.add("verse-reference");
      referenceParagraph.textContent = verse.reference;
      verseElement.appendChild(referenceParagraph);

      // Create a paragraph for the text
      const textParagraph = document.createElement("p");
      textParagraph.classList.add("verse-text");
      textParagraph.textContent = verse.text;
      verseElement.appendChild(textParagraph);

      versesContainer.appendChild(verseElement);
    });
  } else {
    // Display "No match found" when there are no verses in the response
    displayNoMatchFound();
  }
}

// Function to display "No match found"
function displayNoMatchFound() {
  const versesContainer = document.getElementById("data-container");
  versesContainer.innerHTML = ''; // Clear existing content

  const noMatchElement = document.createElement("div");
  noMatchElement.textContent = "No match found.";
  versesContainer.appendChild(noMatchElement);
}
