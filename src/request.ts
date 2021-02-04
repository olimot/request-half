/* eslint-disable @typescript-eslint/no-explicit-any */
import http, { IncomingMessage } from 'http';
import https from 'https';
import stream from 'stream';
import zlib from 'zlib';

export type RequestOptions = http.RequestOptions & { body?: string | Buffer | stream.Readable };

export function request(url: string | URL, options?: RequestOptions): Promise<IncomingMessage>;
export function request(options: RequestOptions): Promise<IncomingMessage>;
export function request(url: RequestOptions | string | URL, options?: RequestOptions): Promise<IncomingMessage> {
  return new Promise<IncomingMessage>((resolve, reject) => {
    const isHttps =
      typeof url === 'string'
        ? url.startsWith('https')
        : url && (url.port === 443 || url.port === '443' || url.protocol === 'https:');
    const requestfn = isHttps ? https.request : http.request;
    const request = options ? requestfn(<string | URL>url, options, resolve) : requestfn(url, resolve);
    request.on('error', reject);
    const body = options ? options.body : (url as RequestOptions).body;
    if (typeof body === 'string' || body instanceof Buffer) {
      request.write(body, () => request.end());
      request.end();
    } else if (body?.pipe) {
      body.pipe(request);
    } else {
      request.end();
    }
  });
}

export type ResolveType = Parameters<Buffer['toString']>[0] | 'buffer' | 'json';

type ParseMessageCurried<T> = (message: IncomingMessage) => Promise<string> | Promise<Buffer> | Promise<T | undefined>;

export function parse(message: IncomingMessage): Promise<string>;
export function parse(): (message: IncomingMessage) => Promise<string>;
export function parse<T = any>(type: 'json'): (message: IncomingMessage) => Promise<T | undefined>;
export function parse(type: 'buffer'): (message: IncomingMessage) => Promise<Buffer>;
export function parse(type: ResolveType): (message: IncomingMessage) => Promise<string>;
export function parse<T = any>(type: 'json', message: IncomingMessage): Promise<T | undefined>;
export function parse(type: 'buffer', message: IncomingMessage): Promise<Buffer>;
export function parse(type: ResolveType, message: IncomingMessage): Promise<string>;
export function parse<T = any>(
  type?: IncomingMessage | ResolveType,
  message?: IncomingMessage,
): ParseMessageCurried<T> | Promise<string> | Promise<Buffer> | Promise<T | undefined> {
  const resolveType = typeof type !== 'string' ? 'utf8' : type;
  const incomingMessage = typeof type !== 'string' ? type : message;
  if (!incomingMessage) return (message: IncomingMessage) => parse(resolveType, message);
  const buffer = new Promise<Buffer>((resolve, reject) => {
    incomingMessage.on('error', reject);

    let response: stream.Readable = incomingMessage;
    if (
      incomingMessage.headers['content-encoding'] === 'gzip' ||
      incomingMessage.headers['content-encoding'] === 'deflate'
    ) {
      const gzipStream = zlib.createGunzip();
      gzipStream.on('error', reject);
      response.pipe(gzipStream);
      response = gzipStream;
    }
    const list: Uint8Array[] = [];
    response.on('data', (chunk: Uint8Array) => list.push(chunk));
    response.on('end', () => resolve(Buffer.concat(list)));
  });

  if (resolveType === 'buffer') return buffer;
  else if (resolveType === 'json') return <Promise<T | undefined>>buffer.then((buffer) => {
      try {
        const jsonContent = buffer.toString('utf8');
        if (!jsonContent) return undefined;
        return <T>JSON.parse(jsonContent);
      } catch (e) {
        return Promise.reject(e);
      }
    });
  else return <Promise<string>>buffer.then((buffer) => buffer.toString(resolveType));
}

export default request;
