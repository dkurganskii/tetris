// Polyfill for undici expecting performance.markResourceTiming
if (typeof globalThis !== 'undefined') {
  const g = globalThis as any;
  if (g.performance && typeof g.performance.markResourceTiming !== 'function') {
    g.performance.markResourceTiming = () => {};
  }
}
