# 1) Install dependencies and build
FROM node:18-alpine AS builder
WORKDIR /app

# copy package manifest & lockfile
COPY package.json package-lock.json ./

# install deps
RUN npm ci

# copy rest of source
COPY . .

# build the Next.js app
RUN npm run build

# 2) Production image
FROM node:18-alpine AS runner
WORKDIR /app

# only copy what's needed for runtime
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# expose port and run
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
