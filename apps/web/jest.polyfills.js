/**
 * Polyfills for MSW v2 + jsdom environment.
 * Must assign TextEncoder/TextDecoder BEFORE requiring undici (it uses them at load time).
 * See: https://mswjs.io/docs/migrations/1.x-to-2.x#requestresponseheaders-are-not-defined-jest
 */
const { TextDecoder, TextEncoder } = require('node:util');
const { ReadableStream, TransformStream } = require('node:stream/web');

Object.defineProperty(globalThis, 'TextDecoder', { value: TextDecoder, writable: true });
Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, writable: true });
Object.defineProperty(globalThis, 'ReadableStream', { value: ReadableStream, writable: true });
Object.defineProperty(globalThis, 'TransformStream', { value: TransformStream, writable: true });

const { Request, Response, Headers, fetch, FormData } = require('undici');

Object.defineProperty(globalThis, 'fetch', { value: fetch, writable: true });
Object.defineProperty(globalThis, 'Request', { value: Request, writable: true });
Object.defineProperty(globalThis, 'Response', { value: Response, writable: true });
Object.defineProperty(globalThis, 'Headers', { value: Headers, writable: true });
Object.defineProperty(globalThis, 'FormData', { value: FormData, writable: true });
