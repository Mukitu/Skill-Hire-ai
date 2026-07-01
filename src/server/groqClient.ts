import dotenv from 'dotenv';
dotenv.config();

// Helper to delay execution
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqRequestOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
  retries?: number;
}

/**
 * Call the Groq API with retries, timeout, error handling, and rate-limiting resilience.
 */
export async function callGroqAPI(
  messages: GroqMessage[],
  options: GroqRequestOptions = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama3-8b-8192';

  // Fallback check if API key is not configured or placeholder
  if (!apiKey || apiKey === 'MY_GROQ_API_KEY' || apiKey.trim() === '') {
    console.warn('[GroqClient] GROQ_API_KEY is not configured. Falling back to local simulated response.');
    throw new Error('GROQ_API_KEY is missing or unconfigured.');
  }

  const {
    temperature = 0.2,
    maxTokens = 2048,
    jsonMode = true,
    timeoutMs = 15000, // 15 seconds timeout
    retries = 3
  } = options;

  let attempt = 0;
  let delay = 1000; // start with 1s backoff

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[GroqClient] Sending request to model ${model} (Attempt ${attempt + 1}/${retries + 1})...`);
      
      const requestBody: any = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      };

      if (jsonMode) {
        requestBody.response_format = { type: 'json_object' };
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle Rate Limiting (429) or Server Error (5xx) with backoff
      if (response.status === 429 || response.status >= 500) {
        const errorText = await response.text();
        console.warn(`[GroqClient] Server returned status ${response.status}: ${errorText}`);
        
        attempt++;
        if (attempt <= retries) {
          const backoff = response.status === 429 ? delay * 2 : delay; // more aggressive for 429
          console.log(`[GroqClient] Retrying in ${backoff}ms after status ${response.status}...`);
          await sleep(backoff);
          delay = backoff;
          continue;
        }
        throw new Error(`Groq API returned error status ${response.status}: ${errorText}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Groq API returned empty or malformed choice payload.');
      }

      return content;

    } catch (err: any) {
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        console.warn(`[GroqClient] Request timed out after ${timeoutMs}ms.`);
      } else {
        console.error(`[GroqClient] Error on attempt ${attempt + 1}:`, err.message || err);
      }

      attempt++;
      if (attempt <= retries) {
        console.log(`[GroqClient] Retrying in ${delay}ms after fetch error...`);
        await sleep(delay);
        delay *= 1.5;
        continue;
      }
      throw err;
    }
  }

  throw new Error('Groq API calls failed after maximum retries.');
}

/**
 * Utility to parse and clean JSON output returned by Groq.
 * Handles both direct JSON and backtick-wrapped JSON blocks.
 */
export function cleanAndParseJSON<T = any>(rawText: string, fallbackValue: T): T {
  const trimmed = rawText.trim();
  if (!trimmed) return fallbackValue;

  try {
    // 1. Direct try
    return JSON.parse(trimmed) as T;
  } catch {
    // 2. Try to extract JSON from markdown codeblock if present
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        return JSON.parse(codeBlockMatch[1].trim()) as T;
      } catch (err) {
        console.error('[GroqClient] Failed to parse JSON inside markdown block:', err);
      }
    }

    // 3. Try to locate first '{' and last '}'
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const jsonSubstring = trimmed.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonSubstring) as T;
      } catch (err) {
        console.error('[GroqClient] Failed to parse JSON substring between braces:', err);
      }
    }

    // 4. Try to locate first '[' and last ']' for arrays
    const firstBracket = trimmed.indexOf('[');
    const lastBracket = trimmed.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        const jsonSubstring = trimmed.substring(firstBracket, lastBracket + 1);
        return JSON.parse(jsonSubstring) as T;
      } catch (err) {
        console.error('[GroqClient] Failed to parse array substring between brackets:', err);
      }
    }

    console.error('[GroqClient] JSON parsing completely failed for text snippet:', trimmed.substring(0, 200));
    return fallbackValue;
  }
}
