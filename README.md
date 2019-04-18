# handlebars-inc

Handlebars Inc is a library for rendering [Handlebars](https://github.com/wycats/handlebars.js/) templates using the
[incremental-dom](https://github.com/google/incremental-dom) library. This enables isomorphic templates that can
be rendered with good performance on both a Node server and a browser client. Incremental DOM was authored specifically for
use as a backend for templates, and offers an excellent API for in-place updates to a page UI.

Handlebars Inc exposes a compatible [Handlebars API](https://handlebarsjs.com/reference.html) by default, and can
therefore be used as a drop-in replacement for Handlebars on the server. On the client, Handlebars Inc loads an instance
of the [Incremental DOM API](http://google.github.io/incremental-dom/#api) as `HandlebarsInc.idom`, and also exposes
`HandlebarsInc.idom.patch()` as `HandlebarsInc.patch()` for convenience.

Finally, template functions are augmented to accept a `backend` property in the options object that can take the value `'idom'` for
Incremental DOM rendering. This enables usage on the client along the lines of:

```javascript
var searchPartial = HandlebarsInc.partials['search-main'];
HandlebarsInc.patch(
  document.getElementById('main'),
  searchPartial({ query: 'Node.js', results: [] }, { backend: 'idom' })
);
```

See https://github.com/jacobstern/handlebars-inc-demo for a full example application.

## Technical Details

Handlebars Inc differs from previous Incremental DOM backends for Handlebars in that it forks several components of the Handlebars
library to parse and interpret HTML fragments during code generation. As a result, many features of Handlebars are available "for
free" and the same compiled template may be used to generate either templated text or Incremental DOM calls.

When the default `'text'` backend is invoked, Handlebars Inc builds up a text buffer using a custom implementation of the
Incremental DOM API. This has more overhead than the native Handlebars implementation which will have fewer buffer appends
and fewer function calls, but I don't expect a serious performance difference in a Node environment. (This hasn't been measured
with actual profiling yet.) The advantage of this approach is that code generation and custom helpers only need to implement one
code path that targets Incremental DOM rather than always supporting both text and Incremental DOM backends separately.

## Status

The project is very new and untested, and not ready for production use. Basic Handlebars functionality is covered in the
test suite.
