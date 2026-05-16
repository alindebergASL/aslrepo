#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: sudo ./deploy-ubuntu-nginx.sh example.com"
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run this script with sudo."
  exit 1
fi

DOMAIN="$1"
if [[ "${DOMAIN}" == *"/"* || "${DOMAIN}" == *" "* ]]; then
  echo "Use a bare domain such as example.com."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="/var/www/andrew-ai-site"
SITE_AVAILABLE="/etc/nginx/sites-available/andrew-ai-site"
SITE_ENABLED="/etc/nginx/sites-enabled/andrew-ai-site"

if ! command -v nginx >/dev/null 2>&1; then
  apt-get update
  apt-get install -y nginx
fi

install -d -m 0755 "${TARGET_DIR}"

for item in \
    index.html \
    404.html \
    articles \
    styles.css \
    site.js \
    robots.txt \
    sitemap.xml \
    feed.xml \
    og-image.svg \
    og-image.png \
    favicon.svg \
    favicon.ico \
    apple-touch-icon.png \
    site.webmanifest; do
  if [[ -e "${SCRIPT_DIR}/${item}" ]]; then
    cp -R "${SCRIPT_DIR}/${item}" "${TARGET_DIR}/"
  fi
done

# Domain is already baked into the source files (ai-lab1.com). Keep this
# sed in place as a no-op safety net in case anyone reintroduces a placeholder.
find "${TARGET_DIR}" -type f \( -name "*.html" -o -name "*.xml" -o -name "*.txt" -o -name "*.svg" -o -name "*.webmanifest" \) -exec sed -i "s#DOMAIN_PLACEHOLDER#${DOMAIN}#g" {} +

chown -R www-data:www-data "${TARGET_DIR}"
find "${TARGET_DIR}" -type d -exec chmod 755 {} \;
find "${TARGET_DIR}" -type f -exec chmod 644 {} \;

cp "${SCRIPT_DIR}/nginx-site.conf" "${SITE_AVAILABLE}"
ln -sfn "${SITE_AVAILABLE}" "${SITE_ENABLED}"

nginx -t
systemctl reload nginx || systemctl restart nginx

echo "Deployed to ${TARGET_DIR}"
echo "Nginx site enabled for ${DOMAIN}"
