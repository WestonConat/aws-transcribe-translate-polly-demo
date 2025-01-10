// transcribe.ts
import {
    TranscribeStreamingClient,
    StartStreamTranscriptionCommand,
    StartStreamTranscriptionCommandInput,
    TranscriptResultStream,
    AudioStream as TranscribeAudioStream,
  } from '@aws-sdk/client-transcribe-streaming';

  const credentials = {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    sessionToken: import.meta.env.VITE_AWS_SESSION_TOKEN,
  };
  
  const client = new TranscribeStreamingClient({
    region: 'us-west-2',
    credentials,
  });

  
    export class Transcriber {
        private transcriptionResult = '';
        private audioQueue: Int16Array[] = [];
        private pushing = false;
      
        /**
         * Start streaming to AWS Transcribe.
         * @param onUpdate An optional callback for whenever we have new final transcripts.
         */
        async startTranscription(
            onFinalUpdate?: (text: string) => void,
            onPartialUpdate?: (text: string) => void,
          ) {
          console.log('[Transcriber] startTranscription called.');
      
          // Create the async generator
          const audioIterable = this.buildAudioStream();
      
          const params: StartStreamTranscriptionCommandInput = {
            LanguageCode: 'en-US',
            MediaEncoding: 'pcm',
            MediaSampleRateHertz: 16000,
            AudioStream: audioIterable,
          };
      
          const command = new StartStreamTranscriptionCommand(params);
      
          client.send(command).then(async (response) => {
            if (!response.TranscriptResultStream) return;
      
            for await (const event of response.TranscriptResultStream as AsyncIterable<TranscriptResultStream>) {
              if (!event.TranscriptEvent) continue;
      
              const results = event.TranscriptEvent.Transcript?.Results;
              if (!results) continue;
      
              for (const result of results) {
                const altTranscript = result.Alternatives?.[0]?.Transcript || '';
                if (result.IsPartial) {
                  // Show partial in real-time
                  if (onPartialUpdate) {
                    onPartialUpdate(this.transcriptionResult + altTranscript);
                  }
                } else {
                  // Final text: store and show
                  this.transcriptionResult += altTranscript + ' ';
                  if (onFinalUpdate) {
                    onFinalUpdate(this.transcriptionResult);
                  }
                }
              }
            }
          }).catch((error) => {
            console.error('[Transcriber] Transcribe stream error:', error);
          });
        }
      
        // Stop pushing audio chunks to Transcribe
        stopTranscription() {
          this.pushing = false;
          console.log('[Transcriber] Stopped streaming audio.');
        }

        /**
         * Resets the internal transcription text.
         * Call this if you'd like a fresh transcript.
         */
        reset() {
            console.log('[Transcriber] reset called: clearing transcriptionResult.');
            this.transcriptionResult = '';
        }
      
        // The method your PCM recorder calls with new 16-bit audio data
        pushAudioChunk(pcmChunk: Int16Array) {
          this.audioQueue.push(pcmChunk);
        }
      
        // The async generator that yields chunks from `audioQueue` to AWS
        private async *buildAudioStream(): AsyncGenerator<TranscribeAudioStream> {
          this.pushing = true;
          while (this.pushing) {
            if (this.audioQueue.length > 0) {
              const chunk = this.audioQueue.shift();
              if (chunk) {
                yield {
                  AudioEvent: {
                    AudioChunk: new Uint8Array(chunk.buffer),
                  },
                };
              }
            } else {
              // Sleep briefly if there's no data yet
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
          }
        }
      
        // If you need to get the final transcript after everything ends
        async getTranscriptionResult(): Promise<string> {
          return this.transcriptionResult.trim();
        }
      }