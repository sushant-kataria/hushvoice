# HushVoice web UI (Next.js)
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Standalone output is for Docker only (not used on Vercel).
RUN node -e "const fs=require('fs');const p='next.config.ts';let s=fs.readFileSync(p,'utf8');s=s.replace('const nextConfig: NextConfig = {};','const nextConfig: NextConfig = { output: \"standalone\" };');fs.writeFileSync(p,s);" \
  && npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd -r nextjs && useradd -r -g nextjs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]