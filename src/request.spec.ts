import assert from 'assert';
import { request, parse } from './request';
import http from 'http';
import { AddressInfo } from 'net';
import zlib from 'zlib';
import { Readable } from 'stream';
import { RequestOptions } from 'https';
import querystring from 'querystring';

type TestType = { test: string };

describe('request', function () {
  let server: http.Server, url: string, port: number;
  before(function () {
    server = http.createServer((req, res) => {
      if (/gzip/i.test(<string>req.headers['accept-encoding'])) {
        res.writeHead(200, { 'content-encoding': 'gzip' });
        req.pipe(zlib.createGzip()).pipe(res);
      } else {
        req.pipe(res);
      }
    });
    server.listen(() => {
      port = (<AddressInfo>server.address()).port;
      url = `http://127.0.0.1:${port}/`;
    });
  });

  after(function () {
    server.close();
  });

  it('should return object from json response', async function () {
    const object = await request(url, { method: 'POST', body: '{ "test": "ok" }' }).then(parse<TestType>('json'));
    assert(object !== null && typeof object === 'object' && object.test === 'ok');
  });

  it('should handle first argument as `options`, then return object from json response', async function () {
    const createJsonApiBro = (base: RequestOptions) => (
      method: 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT',
      endpoint: string,
      body?: unknown,
    ): RequestOptions => ({
      ...base,
      path: `${base.path}${endpoint}${
        typeof body !== 'undefined' && ['HEAD', 'OPTIONS', 'DELETE', 'GET'].indexOf(method) >= 0
          ? `?${querystring.stringify(body as querystring.ParsedUrlQueryInput)}`
          : ''
      }`,
      method,
      ...(typeof body !== 'undefined' &&
        ['POST', 'PUT', 'PATCH'].indexOf(method) >= 0 && {
          headers: { 'Content-type': 'application/json' },
          body: JSON.stringify(body),
        }),
    });

    const myApiV2 = createJsonApiBro({ protocol: 'http:', hostname: '127.0.0.1', path: '/api/v2/' });
    console.log(myApiV2('GET', 'post', { id: 1 }));
    // request(myApiV2('GET', 'post', { id: 1 }));

    const options = { hostname: '127.0.0.1', port, path: '/', method: 'POST', body: '{ "test": "ok" }' };
    const object = await request(options).then(parse<TestType>('json'));
    assert(object !== null && typeof object === 'object' && object.test === 'ok');
  });

  it('should return buffer from response', async function () {
    const buffer = await request(url).then(parse('buffer'));
    assert(buffer instanceof Buffer);
  });

  it('should return utf-8 string if no type assigned', async function () {
    const text = await request(new URL(url)).then(parse());
    assert(typeof text === 'string');
  });

  it('should process gzip and http', async function () {
    const text = await request(url, {
      headers: { 'accept-encoding': 'gzip, deflate' },
    }).then(parse());
    assert(typeof text === 'string');
  });

  it('should take a readable stream body', async function () {
    const object = await request(url, { method: 'POST', body: Readable.from(['{ "test": "ok" }']) }).then(
      parse<TestType>('json'),
    );
    assert(object !== null && typeof object === 'object' && object.test === 'ok');
  });

  it('should take a buffer body', async function () {
    const object = await request(url, { method: 'POST', body: Buffer.from('{ "test": "ok" }', 'utf-8') }).then(
      parse<TestType>('json'),
    );
    assert(object !== null && typeof object === 'object' && object.test === 'ok');
  });
});
