# request-half

request-half provides functional-friendly, fetch-like `request()` and `parse()` which use nodejs native
`https.request()`, `http.request()` and `http.IncomingMessage`.

```js
const { request, parse } = require('request-half');

async function inSomeAsyncFunction() {
  const url = 'some url here';

  // parse as json from utf-8 text
  const response = await request(url);

  // return value of request() would be http.IncomingMessage
  console.log(response.statusCode, response.headers);

  // pass to parse() function
  const object2 = await parse('json', response);

  // curry parse function
  const object = await request(url).then(parse('json'));

  // take response as buffer
  const buffer = await request(url).then(parse('buffer'));

  // parse as utf-8 text
  const text2 = await request(new URL(url)).then(parse('utf8'));

  // default type is 'utf8'
  const text = await request(new URL(url)).then(parse());

  // even without currying, default type is 'utf8'
  const response = await request(new URL(url));
  const text2 = await parse('utf8', response);
  const text3 = await parse(response);
}
```

# Request examples

```js
// POST Message
const result1 = await request('http://example.com/article', {
  method: 'POST',
  headers: { 'Content-type': 'application/json' },
  body: JSON.stringify({ title: 'Hello, world', body: 'Use half to request, then else half to parse.' }),
}).then(parse('json'));

// GET Message
const querystring = require('querystring');
const url = `http://example.com/article?${querystring.stringify({ title: 'Hello', orderBy: 'date' })}`;
const result2 = await request(url).then(parse('json'));

// HTTPS is also OK.
const result3 = await request('https://example.com/article/1').then(parse('json'));
```
