# Evidence: original lab (July 2026)

Screenshots captured from the live environment before the university Proxmox lab was decommissioned.
Black boxes are redactions: API keys, public IPs and hostnames, the FortiGate serial, email addresses,
and other people's names and usernames. Nothing else was edited.

## SIEM: Splunk ingestion and dashboard

| # | Screenshot | What it proves |
|---|---|---|
| 1 | [Splunk SIEM Overview dashboard](siem/01-splunk-siem-overview-dashboard.png) | 8-panel dashboard, 24 h window (Jul 8–9 2026): **118,071** firewall events, **4,681** Windows events, **22** Security Onion events. Both firewalls and both web servers are visible as separate series. |
| 2 | [FortiGate syslog packet capture](siem/02-fortigate-syslog-tcpdump.png) | `tcpdump` on the indexer shows FortiGate syslog arriving on UDP 5515 |
| 3 | [Security Onion forwarder active](siem/03-securityonion-uf-active.png) | Linux Universal Forwarder on the sensor reports `192.168.50.4:9997` under Active forwards |
| 4 | [Palo Alto raw events](siem/04-pan-firewall-raw-events.png) | 71,601 `pan:firewall` events in 24 h, including a GlobalProtect RADIUS auth failure routed to the Duo proxy |
| 5 | [FortiGate raw events](siem/05-fortinet-raw-events.png) | 48,524 `fortinet` events in 24 h, including the `Logs_to_Splunk` policy carrying forwarder traffic |
| 6 | [Zeek logs in Splunk](siem/06-securityonion-zeek-in-splunk.png) | Only `broker`, `capture_loss` and `notice` logs reach Splunk, because Security Onion is Elastic-native (see lessons learned) |

## SOAR: Splunk alert to Palo Alto auto-block

| # | Screenshot | What it proves |
|---|---|---|
| 1 | [Scoped admin role](soar/01-pa-n8n-soar-role.png) | Custom role `n8n-soar-role` |
| 2 | [API-only admin](soar/02-pa-n8n-api-admin.png) | `n8n-api` bound to the custom role instead of Superuser |
| 3 | [Empty dynamic block list](soar/03-pa-blocklist-empty.png) | `n8n-blocklist` is a dynamic group with 0 members before testing |
| 4 | [Manual register proof](soar/04-pa-manual-register-proof.png) | `type=user-id` register returns `status="success"` before any automation existed |
| 5 | [Docker host before n8n](soar/05-n8n-host-docker-ps.png) | The DMZ host at 192.168.20.6 runs the Guacamole stack (`guac-radius:1.5.4`, nginx, postgres, guacd) |
| 6 | [n8n container up](soar/06-n8n-container-up.png) | n8n 2.29.10 deployed as a separate compose project on port 5678 |
| 7 | [n8n editor live](soar/07-n8n-editor-live.png) | Editor reachable at `http://192.168.20.6:5678` |
| 8 | [Decide node allowlist](soar/08-n8n-decide-allowlist.png) | Explicit 11-IP infrastructure allowlist; `shouldBlock = !isAllowlisted` |
| 9 | [Full run, all nodes green](soar/09-n8n-run-all-green.png) | Webhook → Extract IP → GeoIP → AbuseIPDB → Decide → Malicious? → Block on Palo Alto (`https://192.168.20.1/api/`) |
| 10 | [Block node response](soar/10-pa-register-success.png) | PAN-OS returns `<response status="success">` with a `uid-response/register` payload |
| 11 | [Block list populated](soar/11-pa-blocklist-populated.png) | Test IPs `5.6.7.8` and `45.83.64.1` now members of `n8n-blocklist` as `registered-ip` |

## Remote access: VPN, MFA, zero-trust gateway

| # | Screenshot | What it proves |
|---|---|---|
| 1 | [GlobalProtect connected](access/01-globalprotect-connected.png) | Client connected to gateway `T5-ra-portal-gw` |
| 2 | [Duo push for RADIUS login](access/02-duo-push-radius.png) | Login as `j_litardo` triggers a Duo push through the RADIUS proxy |
| 3 | [Guacamole destination NAT](access/03-pa-guacamole-dnat.png) | Public IP (masked) on `service-https` translated to 192.168.20.6 |
| 4 | [Guacamole security rules](access/04-pa-guacamole-security-rules.png) | Inbound HTTPS to the gateway, plus DMZ → Duo proxy rules for RADIUS (UDP) and RDP (TCP) |
| 5 | [Guacamole login page](access/05-guacamole-login.png) | Gateway reachable over HTTPS on the public hostname (masked), version 1.5.4 |
| 6 | [Published sessions](access/06-guacamole-published-sessions.png) | After MFA, `j_litardo` sees exactly four sessions: Web Server 1, Web Server 2, HA Proxy, DUO. AD and the firewalls are not published. |

## Segmentation

| # | Screenshot | What it proves |
|---|---|---|
| 1 | [FortiGate DMZ → AD rule](segmentation/01-fortigate-dmz-to-ad-ldap.png) | DMZ subnet may reach the AD server on LDAP only |
| 2 | [Palo Alto DMZ → AD rule](segmentation/02-pa-allow-dmz-to-ad-tcp389.png) | Same restriction enforced on the second firewall (TCP 389 to 192.168.50.2), with interzone-default deny below |
| 3 | [VPN reachability tests](segmentation/03-vpn-segmentation-tests.png) | A VPN client reaches the DMZ load balancer but times out against AD, the FortiGate and the Palo Alto management interface |

## Identity: AD provisioning automation

| # | Screenshot | What it proves |
|---|---|---|
| 1 | [Duo enrolled users](identity/01-duo-enrolled-users.png) | Lab accounts synced and enrolled in Duo with one phone each |
| 2 | [Scheduled task](identity/ad-automation/01-scheduled-task.png) | `AD Lab User Provisioning` runs daily at 2:00 AM |
| 3 | [Task history](identity/ad-automation/02-task-history.png) | Task Scheduler event 102: run completed as `T5\Administrator` |
| 4 | [Provisioning log](identity/ad-automation/03-provisioning-log.png) | Existing users skipped, one new CSV row created and added to `VPN-Users`; 8 records processed |
| 5 | [LabUsers OU](identity/ad-automation/04-labusers-ou.png) | Resulting accounts in `OU=LabUsers,DC=T5,DC=org` |
| 6 | [Task result summary](identity/ad-automation/05-task-result-summary.png) | `LastTaskResult: 0`, next run scheduled |
