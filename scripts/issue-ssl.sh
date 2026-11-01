#!/bin/bash
set -euo pipefail
env -u HTTPS_PROXY -u HTTP_PROXY -u ALL_PROXY -u https_proxy -u http_proxy -u all_proxy \
  certbot certonly --webroot -w /var/www/acme -d enterhub.com -d www.enterhub.com \
  --non-interactive --agree-tos --register-unsafely-without-email
mkdir -p /etc/nginx/tenant-certs/enterhub.com
cp /etc/letsencrypt/live/enterhub.com/fullchain.pem /etc/nginx/tenant-certs/enterhub.com/fullchain.crt
cp /etc/letsencrypt/live/enterhub.com/privkey.pem /etc/nginx/tenant-certs/enterhub.com/private.key
chmod 600 /etc/nginx/tenant-certs/enterhub.com/private.key
nginx -t && systemctl reload nginx
echo "SSL installed for enterhub.com"
