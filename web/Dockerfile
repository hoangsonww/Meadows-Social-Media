# 1) Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# accept the two Supabase vars at build time
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# inject them so next build & SSR code sees them
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# 2) Production runtime
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Add descriptive labels:
LABEL \
  org.opencontainers.image.title="Meadows Social App" \
  org.opencontainers.image.description="A social media app built with Next.js, Supabase, and Radix UI." \
  org.opencontainers.image.url="https://github.com/hoangsonww/Meadows-Social-Media" \
  org.opencontainers.image.source="https://github.com/hoangsonww/meadows-social-Media" \
  org.opencontainers.image.licenses="MIT" \
  org.opencontainers.image.version="0.1.0" \
  org.opencontainers.image.authors="Son Nguyen <hoangson091104@gmail.com.com>"

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
