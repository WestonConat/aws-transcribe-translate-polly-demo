// polly-tts.ts

import { PollyClient, SynthesizeSpeechCommand, VoiceId, Engine } from '@aws-sdk/client-polly';


const pollyClient = new PollyClient({
  region: 'us-west-2',
  credentials: {
    accessKeyId: `${import.meta.env.VITE_AWS_ACCESS_KEY_ID}`,
    secretAccessKey: `${import.meta.env.VITE_AWS_SECRET_ACCESS_KEY}`,
    sessionToken: `${import.meta.env.VITE_AWS_SESSION_TOKEN}`,
  },
});

// Synthesize text with neural TTS, returning a Blob
export async function synthesizeTTSChunk(text: string, voiceId: VoiceId = 'Joanna' as VoiceId): Promise<Blob> {
  const command = new SynthesizeSpeechCommand({
    Text: text,
    VoiceId: voiceId,
    Engine: 'neural' as Engine,
    OutputFormat: 'mp3',
  });
  const response = await pollyClient.send(command);

  if (!response.AudioStream) {
    throw new Error('[polly-tts] No AudioStream returned from Polly.');
  }

  const audioBlob = await new Response(response.AudioStream as any).blob();
  return audioBlob;
}
