import assert from 'assert';
import { request, parse } from './request';
import http from 'http';
import { AddressInfo } from 'net';
import zlib from 'zlib';

describe('request', function() {
  let server: http.Server, url: string;
  before(function() {
    server = http.createServer((req, res) => {
      if (/gzip/i.test(<string>req.headers['accept-encoding'])) {
        res.writeHead(200, { 'content-encoding': 'gzip' });
        req.pipe(zlib.createGzip()).pipe(res);
      } else {
        req.pipe(res);
      }
    });
    server.listen(() => {
      url = `http://127.0.0.1:${(<AddressInfo>server.address()).port}/`;
    });
  });

  after(function() {
    server.close();
  });

  it('should return object from json response', async function() {
    const object: any = await request(url, { method: 'POST', body: '{ "test": "ok" }' }).then(parse('json'));
    assert(object !== null && typeof object === 'object' && object.test === 'ok');
  });

  it('should return buffer from response', async function() {
    const buffer = await request(url).then(parse('buffer'));
    assert(buffer instanceof Buffer);
  });

  it('should return utf-8 string if no type assigned', async function() {
    const text = await request(new URL(url)).then(parse());
    assert(typeof text === 'string');
  });

  it('should process gzip and http', async function() {
    const text = await request(url, {
      headers: { 'accept-encoding': 'gzip, deflate' },
    }).then(parse());
    assert(typeof text === 'string');
  });
});
