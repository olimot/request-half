# request-half

request-half provides functional-friendly, fetch-like `request()` and `parse()` which use native `https.request()` and
`http.request()` and `http.IncomingMessage`.

```js
const { request, parse } = require('request-half');

async function inSomeAsyncFunction() {
  const url = 'some url here';

  // parse as json from utf-8 text
  const response = await request(url);
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
