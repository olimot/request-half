import http, { IncomingMessage } from 'http';
import https from 'https';
import stream from 'stream';
import zlib from 'zlib';

export function request(url: string | URL, options?: http.RequestOptions): Promise<IncomingMessage>;
export function request(options: http.RequestOptions): Promise<IncomingMessage>;
export function request(
  url: http.RequestOptions | string | URL,
  options?: http.RequestOptions,
): Promise<IncomingMessage> {
  return new Promise<IncomingMessage>((resolve, reject) => {
    const requestfn =
      (options && (options.port === 443 || options.protocol === 'https')) ||
      (typeof url === 'string' ? url.startsWith('https') : url.port === 443 || url.protocol === 'https:')
        ? https.request
        : http.request;
    const request = options ? requestfn(<string | URL>url, options, resolve) : requestfn(url, resolve);
    request.on('error', reject);
    request.end();
  });
}

export type ResolveType =
  | 'utf8'
  | 'ucs2'
  | 'utf-8'
  | 'ascii'
  | 'ucs-2'
  | 'utf16le'
  | 'utf-16le'
  | 'latin1'
  | 'binary'
  | 'base64'
  | 'hex'
  | 'buffer'
  | 'json';

type ParseMessageCurried = (message: IncomingMessage) => Promise<string> | Promise<Buffer> | Promise<any>;
export function parse(message: IncomingMessage): Promise<string>;
export function parse(): (message: IncomingMessage) => Promise<string>;
export function parse<T>(type: 'json'): (message: IncomingMessage) => Promise<T>;
export function parse(type: 'buffer'): (message: IncomingMessage) => Promise<Buffer>;
export function parse(type: ResolveType): (message: IncomingMessage) => Promise<string>;
export function parse<T>(type: 'json', message: IncomingMessage): Promise<T>;
export function parse(type: 'buffer', message: IncomingMessage): Promise<Buffer>;
export function parse(type: ResolveType, message: IncomingMessage): Promise<string>;
export function parse<T>(
  type?: IncomingMessage | ResolveType,
  message?: IncomingMessage,
): ParseMessageCurried | Promise<string> | Promise<Buffer> | Promise<T> {
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
    const list: any[] = [];
    response.on('data', (chunk: any) => list.push(chunk));
    response.on('end', () => resolve(Buffer.concat(list)));
  });

  if (resolveType === 'buffer') return buffer;
  else if (resolveType === 'json') return <Promise<T>>buffer.then(buffer => <T>JSON.parse(buffer.toString('utf8')));
  else return <Promise<string>>buffer.then(buffer => buffer.toString(resolveType));
}

export default request;
