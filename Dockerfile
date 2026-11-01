# Base dependencies
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Development image
FROM base AS dev
COPY . .
EXPOSE 3002
CMD ["npm", "run", "dev"]

# Production build
FROM base AS builder
COPY . .
RUN npm run build

# Standalone production runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3002

COPY --from=builder /app/.output ./.output

EXPOSE 3002
CMD ["node", ".output/server/index.mjs"]
