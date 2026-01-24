import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This is a placeholder that will be used by the Studio to add Genkit plugins.
export const ai = genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
