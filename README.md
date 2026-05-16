# Andrew Lindeberg — Personal Site

The source for [ai-lab1.com](https://ai-lab1.com) — a personal POV site for Andrew Lindeberg, with practical notes for leaders, operators, and teams on AI agents, enterprise adoption, infrastructure, security, and the translation layer between technical capability and real-world value.

The site is hand-written HTML, CSS, and a small amount of vanilla JavaScript. There is no build system, package manager, framework, analytics, or tracking. It is meant to be easy to read, edit, and deploy on a single Ubuntu / Nginx host.

## What's included

- Editorial dark theme with Instrument Serif + Inter typography (loaded from Google Fonts).
- Subtle scroll-reveal animation, animated aurora glow in the hero, and a reading-progress bar on article pages — all respect `prefers-reduced-motion: reduce`.
- Tag-based filtering on the writing index, computed at runtime from `data-tags` on each article card.
- Per-page JSON-LD structured data (`Person`, `WebSite`, `Blog`, `BlogPosting`, `BreadcrumbList`).
- Atom feed at `/feed.xml` with a `<link rel="alternate">` on every page.
- Sitemap (`/sitemap.xml`) and `robots.txt`.
- Custom 404 page wired into Nginx.
- Favicons (SVG primary, ICO fallback) + apple-touch-icon + web manifest.
- Real social-share image (`og-image.png`, 1200×630) with SVG source.
- Nginx config with security headers, gzip, long-cache for static assets, and a clean error page.

## Project structure

```
.
├── 404.html                                   # Custom 404, matches design system
├── apple-touch-icon.png                       # 180×180, generated from favicon.svg
├── articles/
│   ├── ai-adoption-partner-ecosystem/
│   │   └── index.html                         # Essay: Why AI Adoption Needs an Ecosystem
│   ├── ai-agents-are-not-the-deployment/
│   │   └── index.html                         # Essay: AI Agents Are Not the Deployment
│   └── index.html                             # Writing archive + tag filter
├── deploy-ubuntu-nginx.sh                     # One-shot deploy: install Nginx, copy files, enable site
├── favicon.ico                                # 16/32/48 multi-size, generated from favicon.svg
├── favicon.svg                                # Primary favicon (AL mark)
├── feed.xml                                   # Atom 1.0 feed
├── index.html                                 # Home page
├── nginx-site.conf                            # Server block
├── og-image.png                               # 1200×630 social-share image
├── og-image.svg                               # Source for og-image.png
├── README.md
├── robots.txt
├── site.js                                    # Scroll-reveal + reading progress + tag filter
├── site.webmanifest                           # PWA-style manifest
├── sitemap.xml
├── styles.css
└── templates/
    └── article-template.html                  # Copy this for new essays (not deployed)
```

## Preview locally

From the project folder:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>. (You can also open the HTML files directly, but the local server is closer to production behavior — for example `/feed.xml` and clean `/articles/` paths work via the server.)

## Configuration

The domain (`https://ai-lab1.com`) and LinkedIn URL (`https://www.linkedin.com/in/andrew-lindeberg`) are baked into the source. If you ever need to change them, do a project-wide find/replace.

## Add a new article

1. Copy `templates/article-template.html` to `articles/<slug>/index.html` and fill in every `UPDATE:` marker (title, description, canonical, dates, tags, JSON-LD). The `templates/` directory is intentionally outside `articles/` so its placeholder copy never ships to the live site.
2. Add a card to `articles/index.html` inside `.article-list`:
   - Set `data-tags="tag-one tag-two"` (lowercase, kebab-case) so it shows up in the tag filter.
   - Include the date, reading-time estimate, tag pills, title link, and dek.
3. Add the post to the `blogPost` array in the JSON-LD on `articles/index.html`.
4. Add an `<entry>` to `feed.xml` with the published date and slug URL.
5. Add a `<url>` block to `sitemap.xml` with the new path and `lastmod`.
6. Optionally update the "Latest Writing" block on `index.html` to feature the new piece.

Reading-time estimate: divide the word count by ~225 and round to the nearest minute.

## Regenerate raster assets

`favicon.ico`, `apple-touch-icon.png`, and `og-image.png` are generated from their SVG sources. If you change `favicon.svg` or `og-image.svg`, regenerate them with:

```bash
pip install Pillow cairosvg
python3 - <<'PY'
import cairosvg, io
from PIL import Image
cairosvg.svg2png(url="og-image.svg", write_to="og-image.png", output_width=1200, output_height=630)
cairosvg.svg2png(url="favicon.svg", write_to="apple-touch-icon.png", output_width=180, output_height=180)
imgs = []
for s in (16, 32, 48):
    buf = io.BytesIO()
    cairosvg.svg2png(url="favicon.svg", write_to=buf, output_width=s, output_height=s)
    buf.seek(0)
    imgs.append(Image.open(buf).convert("RGBA"))
imgs[0].save("favicon.ico", format="ICO", sizes=[(s, s) for s in (16, 32, 48)], append_images=imgs[1:])
PY
```

## Deploy to Ubuntu + Nginx

Copy the project to the server:

```bash
scp -r ./aslrepo ubuntu@ai-lab1.com:/home/ubuntu/andrew-ai-site
ssh ubuntu@ai-lab1.com
cd /home/ubuntu/andrew-ai-site
sudo ./deploy-ubuntu-nginx.sh ai-lab1.com
```

The script installs Nginx if needed, copies the static site to `/var/www/andrew-ai-site`, writes the Nginx site config, tests it, and reloads.

## DNS

Point `ai-lab1.com` and `www.ai-lab1.com` at the server's public IP:

```text
A     ai-lab1.com        <SERVER_PUBLIC_IP>
A     www.ai-lab1.com    <SERVER_PUBLIC_IP>
```

## HTTPS with Certbot

Once DNS resolves and the HTTP site loads:

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ai-lab1.com -d www.ai-lab1.com
```

Certbot will update the Nginx config for HTTPS automatically.

## Safety reminder

No secrets, private keys, API keys, credentials, or confidential customer information belong in this repository.
