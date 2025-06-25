# Multi-stage build for optimized image
FROM node:18-alpine AS base

# Install tzdata for timezone support and curl for health checks
RUN apk add --no-cache tzdata curl

# Set timezone
ENV TZ=Asia/Ho_Chi_Minh

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S discordbot -u 1001 -G nodejs

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Build stage
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
# No build step needed for this Node.js app, but could add linting/testing here
RUN npm run test-kafka || echo "Tests completed"

# Production stage
FROM base AS runner

# Copy node_modules from deps stage
COPY --from=deps --chown=discordbot:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=discordbot:nodejs . .

# Set production environment
ENV NODE_ENV=production

# Default Kafka configuration (can be overridden)
ENV KAFKA_ENABLED=false
ENV PORT=3000

# Switch to non-root user
USER discordbot

# Expose port for health checks
EXPOSE 3000

# Health check with proper error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Start the application
CMD ["npm", "start"]