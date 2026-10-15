// --- Stage 2: Extract source IP from the Splunk alert payload ---
const inp = $input.first().json;
const payload = inp.body || inp;            // n8n puts POST body under .body
const result = payload.result || {};        // Splunk sends the first result here

// Try common Splunk field names, then fall back to a regex on _raw
let ip = result.src_ip || result.src || result.clientip || result.source_ip || payload.src_ip;
if (!ip && result._raw) {
  const m = String(result._raw).match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  if (m) ip = m[0];
}
if (!ip) { throw new Error('No source IP found in Splunk alert payload'); }

return [{ json: { src_ip: ip, search_name: payload.search_name || 'unknown' } }];
