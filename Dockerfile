# alphalearn.ai als statische Website im k3s-Cluster (Hetzner).
# Gebaut von .github/workflows/deploy-k3s.yml bei jedem Push auf main.
# Ins Image kommt nur, was öffentlich sein soll (Positivliste) - keine
# Notizen (claude.md), keine Skripte, keine Entwürfe.
FROM nginxinc/nginx-unprivileged:1.28-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

COPY *.html analytics.js favicon.svg llms.txt robots.txt sitemap.xml social-image.png /usr/share/nginx/html/
COPY assets   /usr/share/nginx/html/assets
COPY partials /usr/share/nginx/html/partials
COPY de       /usr/share/nginx/html/de
COPY en       /usr/share/nginx/html/en

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
