// Node/Metro compatibility polyfills
(function () {
  try {
    // Ensure Web Streams are available for undici
    let web;
    try { web = require('node:stream/web'); } catch (_) { web = null; }
    if (typeof globalThis.ReadableStream === 'undefined' && web && web.ReadableStream) globalThis.ReadableStream = web.ReadableStream;
    if (typeof globalThis.TransformStream === 'undefined' && web && web.TransformStream) globalThis.TransformStream = web.TransformStream;
    if (typeof globalThis.WritableStream === 'undefined' && web && web.WritableStream) globalThis.WritableStream = web.WritableStream;
  } catch (_) {}

  try {
    // Provide os.availableParallelism when missing (used by Metro)
    const os = require('os');
    if (typeof os.availableParallelism !== 'function') {
      os.availableParallelism = function () {
        try { return (os.cpus() && os.cpus().length) || 1; } catch (_) { return 1; }
      };
    }
  } catch (_) {}

  try {
    // Polyfill for undici expecting performance.markResourceTiming
    if (typeof globalThis !== 'undefined') {
      const g = globalThis;
      if (g.performance && typeof g.performance.markResourceTiming !== 'function') {
        g.performance.markResourceTiming = function () { /* no-op */ };
      }
    }
  } catch (_) {}
})();
