let _ai: any = null;

async function initGenkit() {
  try {
    // Dynamic import to avoid build/type errors when package isn't installed
    const { genkit } = await import('genkit');
    const { googleAI } = await import('@genkit-ai/google-genai');
    _ai = genkit({
      plugins: [googleAI()],
      logLevel: 'debug',
      enableTracingAndMetrics: true,
    });
  } catch (err) {
    // Fallback stub when genkit package is not available
    _ai = {
      isAvailable: false,
      async request() {
        throw new Error('Genkit is not installed in this environment.');
      },
    };
  }
}

// Initialize lazily
initGenkit();

export const ai = {
  get instance() {
    return _ai;
  },
};
