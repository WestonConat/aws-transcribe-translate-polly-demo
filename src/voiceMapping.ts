// voiceMapping.ts
import { VoiceId } from '@aws-sdk/client-polly';

// Use only neural-capable voices for best results
export const voiceForLang: Record<string, VoiceId> = {
  en: 'Joanna', // US English neural
  es: 'Mia',    // Spanish (Mexico) neural
  fr: 'Lea',    // French (France) neural
  // Add more as needed, e.g. 'de': 'Vicki', etc.
};