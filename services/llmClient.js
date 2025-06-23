import axios from 'axios';

const LMSTUDIO_URL = 'http://127.0.0.1:1234/v1/chat/completions';
const MODEL        = 'phi-3-mini-4k-instruct';
const TEMPERATURE  = 0.7;

export async function askLLM(systemPrompt, history, userMessage) {
  // history veio do banco; converter p/ formato da API
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage }
  ];

  const { data } = await axios.post(LMSTUDIO_URL, {
    model: MODEL,
    messages,
    temperature: TEMPERATURE,
    max_tokens: 200
  }, { timeout: 60000 });

  return data.choices[0].message.content.trim();
}