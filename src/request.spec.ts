import assert from 'assert';
import { request, parse } from './request';

describe('request', function() {
  it('should return object from json response', async function() {
    const object = await request('https://jsonplaceholder.typicode.com/todos/1').then(parse('json'));
    assert(object !== null && typeof object === 'object');
  });

  it('should return buffer from response', async function() {
    const buffer = await request('https://jsonplaceholder.typicode.com/todos/1').then(parse('buffer'));
    assert(buffer instanceof Buffer);
  });

  it('should return utf-8 string if no type assigned', async function() {
    const text = await request(new URL('https://jsonplaceholder.typicode.com/todos/1')).then(parse());
    assert(typeof text === 'string');
  });

  it('should process gzip and http', async function() {
    const text = await request(new URL('http://jsonplaceholder.typicode.com/todos/1'), {
      headers: { 'accept-encoding': 'gzip, deflate' },
    }).then(parse());
    assert(typeof text === 'string');
  });
});
