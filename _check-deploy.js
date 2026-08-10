const BASE = 'https://mobile-restaurant-api.onrender.com';

(async () => {
  const r1 = await fetch(BASE + '/api-docs/swagger-ui-init.js', { signal: AbortSignal.timeout(15000) });
  const text = await r1.text();
  const idx = text.indexOf('"swaggerDoc":');
  const slice = text.slice(idx);
  let depth = 0, j = 0, inStr = false, esc = false;
  while (j < slice.length) {
    const c = slice[j];
    if (inStr) {
      if (esc) { esc = false; }
      else if (c === '\\') { esc = true; }
      else if (c === '"') { inStr = false; }
    } else {
      if (c === '"') { inStr = true; }
      else if (c === '{') { depth++; }
      else if (c === '}') { depth--; if (depth === 0) { j++; break; } }
    }
    j++;
  }
  const data = JSON.parse(slice.slice(0, j));
  const paths = Object.keys(data.paths || {});
  console.log('=== SWAGGER DOC ===');
  console.log('OpenAPI:', data.openapi, '| Total paths:', paths.length);
  console.log('  /ai/suggest:', paths.includes('/api/ai/suggest'));
  console.log('  /chat/...:', paths.some(function(p){return p.indexOf('/chat/')>=0;}));
  console.log('  /menu/upload:', paths.includes('/api/menu/upload'));
  console.log('  /orders/{id}/tracking:', paths.includes('/api/orders/{id}/tracking'));
  console.log('  /ai/chat:', paths.includes('/api/ai/chat'));
  const tags = (data.tags || []).map(function(t){return t.name;});
  console.log('  Tags:', tags.join(', '));

  const h = await fetch(BASE + '/api/health');
  const hb = await h.json();
  console.log('\n=== SERVER ===');
  console.log('Health timestamp:', hb.timestamp);
  console.log('Upload says Cloudinary required => env vars NOT set on Render yet');
})().catch(function(e){ console.error('FATAL:', e.message); });
