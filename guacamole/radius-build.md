# Guacamole ZTNA gateway (192.168.20.6, DMZ) — RADIUS/Duo integration

Provenance: commands VERBATIM. The full docker-compose.yml (guacd, postgres, guacamole, nginx)
was not preserved in project notes; recreate it and verify env names against the 1.5.4 docs.

The stock `guacamole/guacamole` image excludes the LGPL RADIUS extension, so build it once:

```bash
cd ~ && git clone https://github.com/apache/guacamole-client.git
cd guacamole-client && git checkout 1.5.4
docker build --build-arg MAVEN_ARGUMENTS="-Plgpl-extensions -DskipTests=true" -t guac-radius:1.5.4 .
```

guacamole service in docker-compose.yml:
```yaml
    image: guac-radius:1.5.4
    environment:
      RADIUS_HOSTNAME: 192.168.40.10
      RADIUS_AUTH_PORT: 1812
      RADIUS_SHARED_SECRET: <REDACTED>
      RADIUS_AUTH_PROTOCOL: pap
```

nginx redirect so the bare domain lands on the app:
```nginx
    location = / {
        return 302 /guacamole/;
    }
```

Required PA rules:
1. Outside → DMZ, dst 192.168.20.6, service-https, allow (paired with destination NAT from the public IP)
2. DMZ → Interconnect, dst 192.168.40.10, UDP/1812, allow  ← without this, login fails and no push is sent
3. DMZ → Interconnect, dst 192.168.40.10, TCP/3389 (Duo proxy RDP tile)

Published connections: Web1 RDP .20.4, Web2 RDP .20.5, HAProxy SSH .20.7, Duo Proxy RDP .40.10.
AD and firewalls are deliberately NOT exposed.

MFA bypass fix: a local Guacamole user with a password skips RADIUS. `j_litardo` is created
with **no local password**, so authentication must go through RADIUS → Duo.
Proof line in authproxy.log: request from 192.168.20.6 for username 'j_litardo'.
