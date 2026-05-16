# Andrew Lindeberg Static Website

This is a simple, production-ready personal POV website for Andrew Lindeberg. It is a static HTML/CSS/JavaScript site focused on enterprise AI adoption, partner ecosystems, AI agents, infrastructure, security, and business value.

There is no build system, package manager, analytics, or tracking code. The site is meant to be easy to read, edit, and deploy on an Ubuntu EC2 instance with Nginx.

## Preview Locally

From the project folder:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

You can also open the HTML files directly in a browser, but the local server is closer to how the site will behave in production.

## Replace Placeholders

Search the project for these placeholders before launch:

```text
DOMAIN_PLACEHOLDER
LINKEDIN_PLACEHOLDER
```

Replace `DOMAIN_PLACEHOLDER` with your final domain, such as:

```text
https://example.com
```

Replace `LINKEDIN_PLACEHOLDER` with your LinkedIn profile URL.

## Add a New Article

1. Copy `/articles/article-template.html` into `/articles/new-article-slug/index.html`.
2. Update metadata and article content.
3. Add the article card to `/articles/index.html`.
4. Optionally update the homepage latest writing section.
5. Update `sitemap.xml`.

## Copy Files to EC2

From your local machine, copy the project folder to the server:

```bash
scp -r ./aslrepo ubuntu@example.com:/home/ubuntu/andrew-ai-site
```

Then SSH into the server:

```bash
ssh ubuntu@example.com
cd /home/ubuntu/andrew-ai-site
```

## Deploy on Ubuntu with Nginx

Run the deployment script with your domain:

```bash
sudo ./deploy-ubuntu-nginx.sh example.com
```

The script installs Nginx if needed, copies the static site to `/var/www/andrew-ai-site`, writes an Nginx site config, tests the config, and reloads Nginx.

## DNS Notes

Create DNS records that point your domain to the EC2 public IP address:

```text
A     example.com        <EC2_PUBLIC_IP>
A     www.example.com    <EC2_PUBLIC_IP>
```

DNS changes may take time to propagate.

## Enable HTTPS with Certbot

After DNS points to the server and the HTTP site loads, install Certbot and request a certificate:

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

Certbot will update the Nginx configuration for HTTPS.

## Safety Reminder

Do not put secrets, private keys, API keys, credentials, or confidential customer information in this repository.
