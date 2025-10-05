// Runtime polyfills for Expo CLI/undici expectations in some Node environments
(function () {
  try {
    // Web Streams API polyfills via Node's stream/web when not globally available
    var web;
    try { web = require('node:stream/web'); } catch (_) { web = null; }
    if (typeof globalThis.ReadableStream === 'undefined' && web && web.ReadableStream) {
      globalThis.ReadableStream = web.ReadableStream;
    }
    if (typeof globalThis.TransformStream === 'undefined' && web && web.TransformStream) {
      globalThis.TransformStream = web.TransformStream;
    }
    if (typeof globalThis.WritableStream === 'undefined' && web && web.WritableStream) {
      globalThis.WritableStream = web.WritableStream;
    }
  } catch (_) {}

  try {
    // Polyfill for undici expecting performance.markResourceTiming
    if (typeof globalThis !== 'undefined') {
      var g = globalThis;
      if (g.performance && typeof g.performance.markResourceTiming !== 'function') {
        g.performance.markResourceTiming = function () { /* no-op */ };
      }
    }
  } catch (_) {}
})();
