import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { requestLoggingMiddleware, type RequestWithLogger } from '../logger/index.js';

function runMiddleware(suppliedId?: string) {
  const req = {
    get: vi.fn(() => suppliedId),
    method: 'GET',
    path: '/health',
  };
  const response = Object.assign(new EventEmitter(), {
    headers: new Map<string, string>(),
    statusCode: 200,
    setHeader(name: string, value: string) {
      this.headers.set(name, value);
    },
  });
  const next = vi.fn();

  requestLoggingMiddleware('test-service')(req, response, next);

  return { req: req as unknown as RequestWithLogger, response, next };
}

describe('requestLoggingMiddleware', () => {
  it('accepts and returns a safe caller request ID', () => {
    const { req, response, next } = runMiddleware('client-request:abc-123');

    expect(req.requestId).toBe('client-request:abc-123');
    expect(response.headers.get('x-request-id')).toBe('client-request:abc-123');
    expect(req.log).toBeDefined();
    expect(next).toHaveBeenCalledOnce();
  });

  it('replaces an invalid caller request ID with a UUID', () => {
    const { req, response } = runMiddleware('bad request\nforged-log-entry');

    expect(req.requestId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(response.headers.get('x-request-id')).toBe(req.requestId);
  });
});
