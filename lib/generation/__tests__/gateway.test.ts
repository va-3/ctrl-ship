/**
 * Tests for Gateway utilities
 * Tests JSON parsing and HTML extraction without LLM calls.
 */

import { parseJSONResponse, extractHTML } from '../gateway';

describe('Gateway Utilities', () => {
  describe('parseJSONResponse', () => {
    test('parses clean JSON', () => {
      const result = parseJSONResponse<{ name: string }>('{"name": "test"}');
      expect(result.name).toBe('test');
    });

    test('parses JSON wrapped in markdown fences', () => {
      const raw = '```json\n{"name": "test"}\n```';
      const result = parseJSONResponse<{ name: string }>(raw);
      expect(result.name).toBe('test');
    });

    test('parses JSON with preamble text', () => {
      const raw = 'Here is the result:\n\n{"name": "test", "value": 42}';
      const result = parseJSONResponse<{ name: string; value: number }>(raw);
      expect(result.name).toBe('test');
      expect(result.value).toBe(42);
    });

    test('parses JSON array', () => {
      const raw = '[{"id": 1}, {"id": 2}]';
      const result = parseJSONResponse<{ id: number }[]>(raw);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
    });

    test('parses JSON array with preamble', () => {
      const raw = 'Sure, here:\n\n[{"id": 1}]\n\nHope that helps!';
      const result = parseJSONResponse<{ id: number }[]>(raw);
      expect(result).toHaveLength(1);
    });

    test('throws on invalid JSON', () => {
      expect(() => parseJSONResponse('not json at all')).toThrow('Failed to parse JSON');
    });

    test('handles nested objects', () => {
      const raw = '{"colors": {"primary": "#06b6d4", "secondary": "#8b5cf6"}, "fonts": {"display": "Space Grotesk"}}';
      const result = parseJSONResponse<{ colors: { primary: string }; fonts: { display: string } }>(raw);
      expect(result.colors.primary).toBe('#06b6d4');
      expect(result.fonts.display).toBe('Space Grotesk');
    });
  });

  describe('extractHTML', () => {
    test('returns clean HTML as-is', () => {
      const html = '<!DOCTYPE html><html><head></head><body>hello</body></html>';
      expect(extractHTML(html)).toBe(html);
    });

    test('strips markdown fences', () => {
      const raw = '```html\n<!DOCTYPE html><html><body>test</body></html>\n```';
      const result = extractHTML(raw);
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).not.toContain('```');
    });

    test('handles preamble text before HTML', () => {
      const raw = 'Here is your website:\n\n<!DOCTYPE html><html><body>test</body></html>';
      const result = extractHTML(raw);
      expect(result).toStartWith('<!DOCTYPE html>');
    });

    test('trims after </html>', () => {
      const raw = '<!DOCTYPE html><html><body>test</body></html>\n\nI hope you like it!';
      const result = extractHTML(raw);
      expect(result).toEndWith('</html>');
    });

    test('handles <html without DOCTYPE', () => {
      const raw = '<html><body>test</body></html>';
      const result = extractHTML(raw);
      expect(result).toContain('<html>');
    });

    test('returns original if no HTML found', () => {
      const raw = 'No HTML here at all';
      const result = extractHTML(raw);
      expect(result).toBe(raw);
    });
  });
});

// Custom matchers
expect.extend({
  toStartWith(received: string, expected: string) {
    const pass = received.startsWith(expected);
    return {
      pass,
      message: () => `expected "${received.substring(0, 50)}..." to start with "${expected}"`,
    };
  },
  toEndWith(received: string, expected: string) {
    const pass = received.endsWith(expected);
    return {
      pass,
      message: () => `expected "...${received.substring(received.length - 50)}" to end with "${expected}"`,
    };
  },
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toStartWith(expected: string): R;
      toEndWith(expected: string): R;
    }
  }
}
