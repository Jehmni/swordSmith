const container = document.getElementById("data-container");
const micImage = document.getElementById('micImage');
let recording = false;
let micMuted = false;
let mediaRecorder;
let chunks = [];

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
    const verses = data.data.verses; // Access 'verses' field from the response

    const verseContainer = document.getElementById("data-container");

    // Clear existing verses
    verseContainer.innerHTML = '';

    // Iterate over 'verses' and append each verse to the container
    verses.forEach(verse => {
      const divElement = document.createElement("div");
      divElement.classList.add("verse"); // Add the 'verse' class

      const nameElement = document.createElement("p");
      const descriptionElement = document.createElement("p");

      nameElement.textContent = ` ${verse.reference}`;
      descriptionElement.textContent = ` ${verse.text}`;

      divElement.appendChild(nameElement);
      divElement.appendChild(descriptionElement);

      verseContainer.appendChild(divElement);
    });

    chunks = []; // Clear chunks array for the next recording
  })
  .catch(error => {
    console.error('Error sending recording:', error);
    chunks = []; // Clear chunks array in case of error
  });
}
