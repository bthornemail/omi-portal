#!/bin/bash
# ============================================================================
# OMI DEBIAN 13 BOOTSTRAP: Firewall, Nginx, Node.js, SSH hardening
# Target: 69.48.202.32 / 2607:f1c0:f062:e900::1
# ============================================================================
set -e

echo "=== OMI DEBIAN 13 BOOTSTRAP ==="

# 1. Update system
apt update && apt upgrade -y

# 2. Install dependencies
apt install -y nginx nodejs npm ufw curl wget

# 3. Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 8080/tcp comment 'OMI SSE proxy'
ufw --force enable

# 4. Configure nginx as reverse proxy for the SSE server
cat > /etc/nginx/sites-available/omi-proxy << 'NGINX'
server {
    listen 80;
    server_name 69.48.202.32;

    # COOP/COEP headers for SharedArrayBuffer
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    location /omi-stream {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/omi-proxy /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 5. Create OMI project directory
mkdir -p /root/omi-portal/scripts

# 6. Setup systemd service for the SSE server
cat > /etc/systemd/system/omi-sse.service << 'SERVICE'
[Unit]
Description=OMI SSE Proxy Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/node /root/omi-portal/scripts/omi-sse-server.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload

echo "=== BOOTSTRAP COMPLETE ==="
echo " -> Firewall: active (22,80,443,8080)"
echo " -> Nginx: configured for omi-proxy"
echo " -> SSE service: systemctl start omi-sse"
echo " -> Public: http://69.48.202.32/omi-stream"
