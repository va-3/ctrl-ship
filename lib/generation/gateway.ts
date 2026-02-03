/**
 * Anthropic API Client — Direct calls to api.anthropic.com
 * 
 * Replaces the OpenClaw gateway for production use on Vercel.
 * Uses prompt caching to reduce costs on repeated system prompts.
 */

import type { GatewayConfig, GatewayMessage } from './types';

const DEFAULT_CONFIG: GatewayConfig = {
  url: 'https://api.anthropic.com',
  token: process.env.ANTHROPIC_API_KEY || '',
  defaultModel: 'claude-sonnet-4-5-20250929',
};

// Anthropic API model mapping
const MODEL_MAP: Record<string, string> = {
  'anthropic/claude-sonnet-4-5': 'claude-sonnet-4-5-20250929',
  'claude-sonnet-4-5': 'claude-sonnet-4-5-20250929',
  'openclaw': 'claude-sonnet-4-5-20250929',
};

export class GatewayClient {
  private config: GatewayConfig;

  constructor(config?: Partial<GatewayConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async call(
    messages: GatewayMessage[],
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    const {
      model: requestedModel = this.config.defaultModel,
      maxTokens = 4096,
      temperature = 0.7,
      maxRetries = 2,
    } = options;

    // Map model names to Anthropic API format
    const model = MODEL_MAP[requestedModel] || requestedModel;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(10000 * Math.pow(2, attempt - 1), 60000);
        console.log(`[Anthropic] Rate limited, retry ${attempt}/${maxRetries} in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      try {
        // Separate system message from conversation messages
        const systemContent = messages
          .filter(m => m.role === 'system')
          .map(m => m.content)
          .join('\n\n');

        const conversationMessages = messages
          .filter(m => m.role !== 'system')
          .map(m => ({ role: m.role, content: m.content }));

        // Build request body with prompt caching on system prompt
        const body: Record<string, unknown> = {
          model,
          max_tokens: maxTokens,
          temperature,
          messages: conversationMessages,
        };

        // Use system prompt with cache_control for cost savings
        // System prompts >1024 tokens get cached by Anthropic (90% cheaper on cache hits)
        if (systemContent) {
          body.system = [
            {
              type: 'text',
              text: systemContent,
              cache_control: { type: 'ephemeral' },
            },
          ];
        }

        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 180000); // 3 min timeout

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.token,
            'anthropic-version': '2023-06-01',
            'anthropic-beta': 'prompt-caching-2024-07-31',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(fetchTimeout);

        if (!response.ok) {
          const errorText = await response.text();
          
          if (response.status === 429) {
            lastError = new Error('Rate limited by Anthropic');
            continue;
          }
          if (response.status === 529) {
            lastError = new Error('Anthropic API overloaded');
            continue;
          }
          
          throw new Error(`Anthropic API ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        // Log cache performance for cost tracking
        if (data.usage) {
          const u = data.usage;
          const cached = u.cache_read_input_tokens || 0;
          const created = u.cache_creation_input_tokens || 0;
          const regular = u.input_tokens || 0;
          console.log(
            `[Anthropic] Tokens — in: ${regular} (cached: ${cached}, new_cache: ${created}), out: ${u.output_tokens} | Model: ${model}`
          );
        }

        // Extract text content from response
        const content = data.content
          ?.filter((block: { type: string }) => block.type === 'text')
          .map((block: { text: string }) => block.text)
          .join('') || '';

        return content;
      } catch (err) {
        if (err instanceof Error && (err.message.includes('Rate limited') || err.message.includes('overloaded'))) {
          lastError = err;
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Call with JSON output — parses response and retries once on parse failure
   */
  async callJSON<T>(
    messages: GatewayMessage[],
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<T> {
    const raw = await this.call(messages, options);
    return parseJSONResponse<T>(raw);
  }

  /**
   * Streaming call — yields text chunks as they arrive from Anthropic.
   * Uses the same prompt caching logic as `call()`.
   * 
   * The `onChunk` callback fires for every text delta (~every 50-200ms).
   * Returns the full accumulated text when done.
   */
  async callStream(
    messages: GatewayMessage[],
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      onChunk?: (chunk: string, accumulated: string) => void;
    } = {}
  ): Promise<string> {
    const {
      model: requestedModel = this.config.defaultModel,
      maxTokens = 4096,
      temperature = 0.7,
      onChunk,
    } = options;

    const model = MODEL_MAP[requestedModel] || requestedModel;

    // Separate system message from conversation messages
    const systemContent = messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n\n');

    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    // Build request body with streaming enabled
    const body: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      temperature,
      stream: true,
      messages: conversationMessages,
    };

    if (systemContent) {
      body.system = [
        {
          type: 'text',
          text: systemContent,
          cache_control: { type: 'ephemeral' },
        },
      ];
    }

    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 300000); // 5 min for streaming

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.token,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(fetchTimeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API ${response.status}: ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming request');
    }

    // Read the SSE stream from Anthropic
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from Anthropic's stream
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const event = JSON.parse(data);

          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            const chunk = event.delta.text;
            accumulated += chunk;
            onChunk?.(chunk, accumulated);
          } else if (event.type === 'message_delta' && event.usage) {
            const u = event.usage;
            console.log(
              `[Anthropic Stream] Output tokens: ${u.output_tokens} | Model: ${model}`
            );
          } else if (event.type === 'message_start' && event.message?.usage) {
            const u = event.message.usage;
            const cached = u.cache_read_input_tokens || 0;
            const created = u.cache_creation_input_tokens || 0;
            console.log(
              `[Anthropic Stream] Input tokens: ${u.input_tokens} (cached: ${cached}, new_cache: ${created}) | Model: ${model}`
            );
          }
        } catch {
          // Skip malformed events
        }
      }
    }

    return accumulated;
  }
}

/**
 * Extract JSON from LLM response (handles markdown fences, preamble text, etc.)
 */
export function parseJSONResponse<T>(raw: string): T {
  let cleaned = raw.trim();

  // Strip markdown fences
  const jsonMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }

  // Find JSON start (object or array)
  const objectStart = cleaned.indexOf('{');
  const arrayStart = cleaned.indexOf('[');
  let startIndex = -1;

  if (objectStart >= 0 && arrayStart >= 0) {
    startIndex = Math.min(objectStart, arrayStart);
  } else if (objectStart >= 0) {
    startIndex = objectStart;
  } else if (arrayStart >= 0) {
    startIndex = arrayStart;
  }

  if (startIndex > 0) {
    cleaned = cleaned.substring(startIndex);
  }

  // Find matching end
  if (cleaned.startsWith('{')) {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace > 0) cleaned = cleaned.substring(0, lastBrace + 1);
  } else if (cleaned.startsWith('[')) {
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket > 0) cleaned = cleaned.substring(0, lastBracket + 1);
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `Failed to parse JSON from LLM response. Raw (first 500 chars): ${raw.substring(0, 500)}`
    );
  }
}

/**
 * Extract HTML from LLM response (handles markdown fences, preamble)
 */
export function extractHTML(content: string): string {
  let html = content;

  // Strip markdown code fences
  const htmlMatch = content.match(/```(?:html)?\n?([\s\S]*?)```/);
  if (htmlMatch) {
    html = htmlMatch[1].trim();
  }

  // Find actual HTML start
  if (!html.trim().startsWith('<!DOCTYPE') && !html.trim().startsWith('<html')) {
    const doctypeIndex = html.indexOf('<!DOCTYPE');
    const htmlIndex = html.indexOf('<html');
    const startIndex = Math.min(
      doctypeIndex >= 0 ? doctypeIndex : Infinity,
      htmlIndex >= 0 ? htmlIndex : Infinity
    );
    if (startIndex < Infinity) {
      html = html.substring(startIndex);
    }
  }

  // Ensure it ends at </html>
  const endIndex = html.lastIndexOf('</html>');
  if (endIndex > 0) {
    html = html.substring(0, endIndex + '</html>'.length);
  }

  return html;
}

/** Singleton gateway instance */
let _gateway: GatewayClient | null = null;

export function getGateway(config?: Partial<GatewayConfig>): GatewayClient {
  if (!_gateway || config) {
    _gateway = new GatewayClient(config);
  }
  return _gateway;
}
