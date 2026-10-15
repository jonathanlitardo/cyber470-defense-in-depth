# Palo Alto PA-440 — SOAR API plumbing (PAN-OS 11.2)

Provenance: object names and API calls are VERBATIM from the build; GUI paths are as executed.

## 1. Least-privilege API identity
- Admin Role `n8n-soar-role`: XML API only. **User-ID Agent permission must be enabled.**
  Without it, the register call returns `403 not authorized for user role`.
- Administrator `n8n-api` bound to that role (no superuser key in automation)

## 2. Dynamic block list (no commit per block)
- Objects → Address Groups → `n8n-blocklist`, Type **Dynamic**, match `'n8n-block'`
- Static group was rejected: it only accepts pre-existing address objects

## 3. Enforcement rule
- Policies → Security → `SOAR-Auto-Block`
  - Source zone Outside/DMZ, source address `n8n-blocklist`, dest any, app any, service any
  - Action **Deny**, placed **above interzone-default and any broad allow**

## 4. API reachability (after the management lockout — see docs/lessons-learned.md)
- Cloned Interface Management profile `n8n-API-Access` (HTTPS) on `ethernet1/6.20` (192.168.20.1)
- The n8n host reaches the API at `https://192.168.20.1/api/`, never at the out-of-band mgmt IP

## 5. API calls
```text
# Key generation (run once; never commit the password or key)
https://<PA>/api/?type=keygen&user=n8n-api&password=<REDACTED>

# Register (block): tags an IP; it joins n8n-blocklist instantly, no commit
type=user-id
cmd=<uid-message><version>2.0</version><type>update</type><payload><register><entry ip="X.X.X.X"><tag><member>n8n-block</member></tag></entry></register></payload></uid-message>
Header: X-PAN-KEY: <REDACTED>
```

Unregister: GUI → address group → **Unregister Tags** (instant, no commit).

## Proposed, NOT validated: auto-expiring blocks
`<member timeout="3600">n8n-block</member>` would make automated blocks expire after 1 hour.
Test it by hand on your PAN-OS version before claiming it.
