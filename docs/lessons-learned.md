# Incidents & Lessons Learned

## 1. Self-inflicted management lockout (SOAR phase)
**What happened:** I added the n8n host to the PA mgmt interface permitted-IP list so it could reach
the API. Once a permitted-IP list is populated, it acts as an exclusive allowlist, so every other
admin source lost management access.
**Recovery:** out-of-band USB console (9600-8-N-1, `screen`):
```
configure
delete deviceconfig system permitted-ip 192.168.20.6
commit
```
**Fix that shipped:** expose the XML API on the DMZ dataplane interface (eth1/6.20) through a cloned
Interface Management profile (`n8n-API-Access`). Mgmt-plane access controls stayed untouched.
**Lesson:** plan an out-of-band recovery path before changing management-plane access.

## 2. Silent interzone drops
Missing PA rules for DMZ→Secure TCP 9997 (Universal Forwarder) and DMZ→Mgmt HTTPS (n8n→API) showed up
as timeouts with **no deny log**, because interzone-default drops without logging by default.
**Lesson:** run a path test first (`Test-NetConnection -Port`, `curl -m 10`, `nc -vz`). A timeout
points to the network path; a 403 or TLS error points to the application.

## 3. Syslog service route defaulted to mgmt
PA syslog left from 10.1.47.5, which has no route to the Secure zone. Re-sourcing the Syslog
service route to eth1/6.30 (192.168.30.1) fixed it.

## 4. RADIUS direction confusion (Duo)
`radius_ip_1` in authproxy.cfg is an inbound allowlist. The PA RADIUS profile IP is the outbound
destination. The profile pointed at the PA's own interface, so no Duo push was ever sent.

## 5. Security Onion is Elastic-native
Suricata writes to Elasticsearch, not to eve.json on disk. The Splunk UF therefore only has sparse
Zeek logs to forward. I chose not to reconfigure the salt-managed sensor that teammates depended on,
and documented the limitation instead of building an Elastic→Splunk bridge under deadline.

## 6. Guacamole MFA bypass
A local Guacamole account with a password authenticates locally and never reaches RADIUS/Duo.
Removing the local password forced every login through MFA.

## 7. Plaintext passwords in the provisioning input
The AD provisioning CSV held one shared initial password for every account, in plaintext.
It worked, but anyone who could read the file could log in as every new user until each one changed
their password. See [ad/README.md](../ad/README.md) for the production fix.

## 8. Screenshots leak more than configs
When I prepared this repo, the archived screenshots contained an API key in a browser URL bar, a live
diagram-sharing invite link, personal email addresses, public IPs and a device serial. Text configs
can be grepped for secrets; screenshots can't. Every image here was OCR-scanned, visually reviewed and
redacted before publishing, and several were left out entirely.
**Lesson:** pass API keys in headers rather than URLs (the n8n block node does this), and treat
screenshots as artifacts that need a secret review.
