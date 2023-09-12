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
    // mediaRecorder.onstop = () => {
    //   const blob = new Blob(chunks, { type: 'audio/wav' }); // Create blob here
    //   resultTextArea.value = 'Recording complete!';
    //   chunks = [];
    //   console.log(blob);
    //   sendAudioRecording(blob); // Call the sendAudioRecording function with the blob
    // };
    mediaRecorder.onstop = () => {
      console.log('Inside mediaRecorder.onstop');// check
      console.log('Chunks:', chunks); // Debug log
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        //resultTextArea.value = "Recording complete!";
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
  // Create a FormData instance and append the audio blob
  const formData = new FormData();
  formData.append('audio', blob, 'audio.wav');
    
  // Set up the HTTP headers and payload for the POST request
  //const headers = {
  //  'Content-Type': 'multipart/form-data',
  //};
  const payload = formData;
    
  // Make the POST request to the API endpoint
  fetch('http://127.0.0.1:5000/api/recordings', {
    method: 'POST',
    body: payload,
  })
  .then(response => response.json())
  .then(data => {
      // Extract and format the meaningful text from the verses
      console.log('kk',data)
      const verses =data
      console.log('vv',verses)
      const items = verses.map(item => {
        console.log('aa',item)

        // Create a <div> element for each item
        const divElement = document.createElement("div");
      
        // Create <p> elements for the name and description
        const nameElement = document.createElement("p");
        const descriptionElement = document.createElement("p");
      
        // Set the content of the <p> elements to the item's properties
        nameElement.textContent = ` ${item.reference}`;
        descriptionElement.textContent = ` ${item.text}`;
      
        // Append the <p> elements to the <div>
        divElement.appendChild(nameElement);
        divElement.appendChild(descriptionElement);
      
        // You can also add more HTML or attributes to the <div> as needed
      
        return divElement; // Return the created <div> element
      });
      console.log('test',items)
      // Append the created elements to the container
      items.forEach(item => {
        console.log('foreach showing',item)
        container.appendChild(item);
      });

      chunks = []; // Clear chunks array for the next recording
    }).catch(error => {console.error('Error sending recording:', error);
    chunks = []; // Clear chunks array in case of error
  });
};
