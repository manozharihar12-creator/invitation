# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS base
WORKDIR /app

COPY package.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev --no-audit --no-fund; fi || true

COPY . .

# Create non-root user and set ownership + make sure logs dir exists for PM2 compat
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/logs && \
    chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV CDN_BASE=https://cdn.riwaaz.in/wedding-websites/themes/rameswaram
ENV LOG_LEVEL=silent

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "const http=require('http');const p=+(process.env.PORT||3000);http.get('http://127.0.0.1:'+p+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]