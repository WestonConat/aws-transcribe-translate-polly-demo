// app.ts
import { PCMRecorder } from './audio-pcm.js';
import { Transcriber } from './transcribe.js';
import { voiceForLang } from './voiceMapping';
import { TTSQueue } from './tts-queue.js';
import { synthesizeTTSChunk } from './polly-tts.js';
import { VoiceId } from '@aws-sdk/client-polly';
import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';
// import { PollyClient, SynthesizeSpeechCommand, VoiceId, Engine } from '@aws-sdk/client-polly';



const translateClient = new TranslateClient({
    region: 'us-west-2',
    credentials: {
      accessKeyId: `${import.meta.env.VITE_AWS_ACCESS_KEY_ID}`,
      secretAccessKey: `${import.meta.env.VITE_AWS_SECRET_ACCESS_KEY}`,
      sessionToken: `${import.meta.env.VITE_AWS_SESSION_TOKEN}`,
    },
    });


const recorder = new PCMRecorder();
const transcriber = new Transcriber();
// Separate TTS Queues for English and Translated audio
const englishTTSQueue = new TTSQueue();
const translatedTTSQueue = new TTSQueue();

// DOM elements
const partialTranscriptDiv = document.getElementById('partial-transcript');
const finalTranscriptDiv = document.getElementById('final-transcript');
const partialTranslationDiv = document.getElementById('partial-translation');
const finalTranslationDiv = document.getElementById('final-translation');

// Throttle parameters
const PARTIAL_TRANSLATE_THROTTLE_MS = 750;
let lastPartialTranslationTime = 0;

const audioSourceSelect = document.getElementById('audioSourceSelect') as HTMLSelectElement;
const refreshDevicesButton = document.getElementById('refreshDevicesButton') as HTMLButtonElement;
const toggleRecordingButton = document.getElementById('toggleRecordingButton') as HTMLButtonElement;
const clearTranscriptButton = document.getElementById('clearTranscriptButton') as HTMLButtonElement;
const startEnglishTTSButton = document.getElementById('startEnglishTTSButton') as HTMLButtonElement;
const stopEnglishTTSButton = document.getElementById('stopEnglishTTSButton') as HTMLButtonElement;

const startTranslatedTTSButton = document.getElementById('startTranslatedTTSButton') as HTMLButtonElement;
const stopTranslatedTTSButton = document.getElementById('stopTranslatedTTSButton') as HTMLButtonElement;

let isRecording = false; // track whether we're currently recording/transcribing

// --- Device Enumeration ---
// --- Device Enumeration ---
async function populateAudioSources() {
  const audioSourceSelect = document.getElementById('audioSourceSelect') as HTMLSelectElement;
  audioSourceSelect.innerHTML = '';  // Clear previous options

  try {
    // Ensure the page has permission to access media devices
    await navigator.mediaDevices.getUserMedia({ audio: true });

    // Get the list of media devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter((device) => device.kind === 'audioinput');

    if (audioInputs.length === 0) {
      const noOption = document.createElement('option');
      noOption.text = 'No audio inputs found';
      noOption.disabled = true;
      audioSourceSelect.appendChild(noOption);
      console.warn('[app] No audio input devices found.');
      return;
    }

    // Populate dropdown with audio input devices
    audioInputs.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Microphone ${index + 1}`;
      audioSourceSelect.appendChild(option);
    });

    console.log('[app] Audio devices detected:', audioInputs);
  } catch (error) {
    console.error('[app] Error accessing audio devices:', error);
    const errorOption = document.createElement('option');
    errorOption.text = 'Error accessing devices';
    errorOption.disabled = true;
    audioSourceSelect.appendChild(errorOption);
  }
}


// Initial device population
(async () => {
  await populateAudioSources();
})();

// Refresh devices button
refreshDevicesButton.addEventListener('click', async () => {
  await populateAudioSources();
});



// --- English TTS Playback ---
startEnglishTTSButton.addEventListener('click', async () => {
  console.log('[app] Starting English TTS playback...');

  const finalTranscript = finalTranscriptDiv?.textContent?.trim() ?? '';

  if (!finalTranscript) {
    console.warn('[app] No English transcript available for TTS.');
    return;
  }

  // Queue and start English TTS
  await speakText(finalTranscript, 'en', englishTTSQueue);
  englishTTSQueue.startPlayback();
});

stopEnglishTTSButton.addEventListener('click', () => {
  console.log('[app] Stopping English TTS playback...');
  englishTTSQueue.stopPlayback();
});

// --- Translated TTS Playback ---
startTranslatedTTSButton.addEventListener('click', async () => {
  console.log('[app] Starting Translated TTS playback...');

  const finalTranslation = finalTranslationDiv?.textContent?.trim() ?? '';

  if (!finalTranslation) {
    console.warn('[app] No translated text available for TTS.');
    return;
  }

  // Queue and start Translated TTS
  await speakText(finalTranslation, 'es', translatedTTSQueue);
  translatedTTSQueue.startPlayback();
});

stopTranslatedTTSButton.addEventListener('click', () => {
  console.log('[app] Stopping Translated TTS playback...');
  translatedTTSQueue.stopPlayback();
});

// --- Updated speakText to accept a specific TTS Queue ---
export async function speakText(text: string, langCode: string, queue: TTSQueue) {
  if (!text.trim()) return;

  try {
    const voiceId = voiceForLang[langCode] || VoiceId.Joanna;

    const audioBlob = await synthesizeTTSChunk(text, voiceId);

    queue.pushChunk(audioBlob);

    console.log(`[Polly] Queued ${langCode.toUpperCase()} text with voice: ${voiceId}`);
  } catch (err) {
    console.error('[Polly] speakText error:', err);
  }
}


// Helper: Translate text from en->es (modify as needed)
async function translateText(text: string, source: string, target: string): Promise<string> {
    try {
      const cmd = new TranslateTextCommand({
        Text: text,
        SourceLanguageCode: source,
        TargetLanguageCode: target,
      });
      const response = await translateClient.send(cmd);
      return response.TranslatedText ?? '';
    } catch (err) {
      console.error('[app] Translate error:', err);
      return '';
    }
  } 

// --- FINAL UPDATE CALLBACK ---
// Play both the original English transcript and the translated version.
async function onFinalUpdate(finalText: string) {
  // 1) Display final transcript
  if (finalTranscriptDiv) {
    finalTranscriptDiv.textContent = finalText;
    finalTranscriptDiv.scrollTop = finalTranscriptDiv.scrollHeight;
  }

  // 2) Queue English TTS (original text)
  await speakText(finalText, 'en', englishTTSQueue);  // English voice

  // 3) Translate final text (e.g., English → Spanish)
  if (finalTranslationDiv) {
    const finalTranslated = await translateText(finalText, 'en', 'es');
    finalTranslationDiv.textContent = finalTranslated;
    finalTranslationDiv.scrollTop = finalTranslationDiv.scrollHeight;

    // 4) Queue Translated TTS (e.g., Spanish)
    await speakText(finalTranslated, 'es', translatedTTSQueue);  // Translated voice
  }
}

// --- PARTIAL UPDATE CALLBACK ---
// Optional: Play partial English and translated TTS for near real-time feedback.
async function onPartialUpdate(partialText: string) {
  // 1) Display partial transcript
  if (partialTranscriptDiv) {
    partialTranscriptDiv.textContent = partialText;
    partialTranscriptDiv.scrollTop = partialTranscriptDiv.scrollHeight;
  }

  // 2) Throttle partial translation to avoid spamming Translate API
  const now = Date.now();
  if (now - lastPartialTranslationTime < PARTIAL_TRANSLATE_THROTTLE_MS) return;
  lastPartialTranslationTime = now;

  // 3) Translate partial text
  if (partialTranslationDiv) {
    const partialTranslation = await translateText(partialText, 'en', 'es');
    partialTranslationDiv.textContent = partialTranslation;
    partialTranslationDiv.scrollTop = partialTranslationDiv.scrollHeight;

    // 4) Queue Partial English TTS (optional)
    await speakText(partialText, 'en', englishTTSQueue);

    // 5) Queue Partial Translated TTS
    await speakText(partialTranslation, 'es', translatedTTSQueue);
  }
}




// ---- Clear Transcript Handler ----
clearTranscriptButton.addEventListener('click', () => {
    console.log('[app] Clear Transcript button clicked.');
  
    // Clear the UI
    if (partialTranscriptDiv) partialTranscriptDiv.textContent = '';
    if (finalTranscriptDiv) finalTranscriptDiv.textContent = '';
    if (partialTranslationDiv) partialTranslationDiv.textContent = '';
    if (finalTranslationDiv) finalTranslationDiv.textContent = '';
  
    // Clear the transcriber’s in-memory result if you like
    transcriber.reset();
  });

// --- Toggle Recording ---
toggleRecordingButton.addEventListener('click', async () => {
  if (!isRecording) {
    // Start recording
    console.log('[app] Start clicked.');
    isRecording = true;
    toggleRecordingButton.textContent = 'Stop Recording';

    // Retrieve deviceId from dropdown
    const selectedDeviceId = audioSourceSelect.value;
    console.log('[app] Using deviceId:', selectedDeviceId);

    // Start capturing raw PCM
    await recorder.start(selectedDeviceId);

    // Send each PCM chunk to Transcriber
    recorder.onPcmData = (chunk) => {
      transcriber.pushAudioChunk(chunk);
    };

    // Begin streaming to AWS Transcribe
    // (Adjust parameters if your signature is reversed)
    transcriber.startTranscription(onFinalUpdate, onPartialUpdate);
  } else {
    // Stop recording
    console.log('[app] Stop clicked.');
    isRecording = false;
    toggleRecordingButton.textContent = 'Start Recording';

    recorder.stop();
    transcriber.stopTranscription();
  }
});


function updateTranscript(element: HTMLElement, newText: string) {
    // Set or append the text in your own style
    element.textContent = newText; 
    // Scroll to the bottom
    element.scrollTop = element.scrollHeight;
  }
  