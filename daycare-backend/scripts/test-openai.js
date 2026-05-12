#!/usr/bin/env node
require('dotenv').config();
(async () => {
  const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) {
    console.error('AI_API_KEY not set. Set AI_API_KEY environment variable or add it to .env.');
    process.exit(2);
  }

  let fetchFn = globalThis.fetch;
  if (!fetchFn) {
    try {
      const nodeFetch = await import('node-fetch');
      fetchFn = nodeFetch.default;
    } catch (e) {
      console.error('fetch not available and node-fetch not installed. Run `npm install node-fetch` or use Node 18+.');
      process.exit(3);
    }
  }

  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

  const body = {
    model,
    messages: [{ role: 'user', content: 'Please respond: Hello from the Daycare test script.' }],
    max_tokens: 60,
  };

  try {
    const res = await fetchFn('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const status = res.status;
    const text = await res.text();

    console.log('HTTP status:', status);
    console.log('Response body:');
    console.log(text);
  } catch (err) {
    console.error('Request failed:', err);
    process.exit(1);
  }
})();
