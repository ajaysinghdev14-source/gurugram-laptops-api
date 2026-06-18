# Use Node 22 as the base image
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# Install dependencies (frozen lockfile for reliable builds)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm run build

# --- Production Image ---
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Set node environment to production
ENV NODE_ENV=production

# Copy built artifacts and necessary files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/src/db ./src/db

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Expose the application port
EXPOSE 8000

# Start script that runs migrations and then starts the app
# Using a shell script to ensure drizzle-kit is available
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Running database migrations..."' >> /app/start.sh && \
    echo 'npx --yes drizzle-kit migrate' >> /app/start.sh && \
    echo 'echo "Starting application..."' >> /app/start.sh && \
    echo 'node dist/index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Run the start script
CMD ["/app/start.sh"]
