FROM node:18-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
    openssl \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Install Prisma globally for CLI access
RUN npm install -g prisma

# Copy source code
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build TypeScript files
WORKDIR /app/src
RUN pnpm run build
WORKDIR /app

# Use ARG for build-time port and ENV for runtime
ARG PORT=5000
ENV PORT=$PORT

EXPOSE ${PORT}

# Use a shell script to wait for the database and start the application
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
