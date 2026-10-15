// --- Stage 4: Decide whether to block ---
const ip    = $('Extract IP').item.json.src_ip;
const geo   = $('GeoIP Lookup').item.json || {};
const abuse = ($('AbuseIPDB Check').item.json.data) || {};
const score = (abuse.abuseConfidenceScore !== undefined) ? abuse.abuseConfidenceScore : -1;

// Allowlist = OUR OWN infrastructure. These must NEVER be blocked.
// NOTE: this is an EXPLICIT infra list, not a blanket RFC1918 block,
// because your P12 attacker box may itself be RFC1918 and must stay blockable.
// >>> EDIT this list to match your environment before the demo <<<
const allowlist = [
  '10.1.47.5',      // PA mgmt
  '192.168.30.1',   // PA interconnect
  '192.168.30.2',   // FortiGate
  '192.168.50.2',   // AD
  '192.168.50.3',   // Security Onion
  '192.168.50.4',   // Splunk
  '192.168.40.10',  // Duo Proxy
  '192.168.20.4',   // Web1
  '192.168.20.5',   // Web2
  '192.168.20.6',   // Guacamole / n8n host
  '192.168.20.7'    // HAProxy
  // add your admin jump host / school public range here if desired
];
const isAllowlisted = allowlist.includes(ip);

// The Splunk/IDS detection already fired (that is WHY this workflow ran),
// so we block any source that is not our own infrastructure.
// AbuseIPDB score is recorded as enrichment/context for the report.
const shouldBlock = !isAllowlisted;

return [{ json: {
  src_ip: ip,
  shouldBlock: shouldBlock,
  isAllowlisted: isAllowlisted,
  abuseScore: score,
  country: geo.country || 'unknown',
  isp: geo.isp || 'unknown',
  search_name: $('Extract IP').item.json.search_name,
  reason: isAllowlisted
    ? 'Allowlisted infrastructure - no action'
    : ('Detection fired; source not allowlisted (AbuseIPDB ' + score + ') - blocking')
}}];
