# Contact List Backend

A modern RESTful API backend for managing contacts, built with Node.js, Express, TypeScript, and PostgreSQL with Prisma ORM.

## Features

- 📝 CRUD operations for contacts
- 🔍 Full-text search capabilities
- 📱 Support for contact avatars
- 🔒 Environment-based configuration
- 🐳 Docker and Docker Compose setup
- 🧪 Jest-based testing suite
- 📚 Swagger/OpenAPI documentation

## Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose
- pnpm (Package Manager)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Testing**: Jest & Supertest
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose

## Getting Started

### Using Docker Compose (Recommended)

The easiest way to get started is using Docker Compose, which will set up both the API and database services:

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd contact-list-backend
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start the services:
   ```bash
   docker compose up
   ```

The API will be available at `http://localhost:5000`.

### Local Development

If you prefer to develop without Docker:

1. Clone and install dependencies:
   ```bash
   git clone <repository-url>
   cd contact-list-backend
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start a PostgreSQL database (you can use Docker for just the database):
   ```bash
   docker compose up -d db
   ```

4. Generate Prisma client and run migrations:
   ```bash
   pnpm prisma generate
   pnpm prisma migrate deploy
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

## API Documentation

Once the server is running, you can access the Swagger documentation at:
```
http://localhost:5000/api-docs
```

## Available Scripts

- `pnpm dev` - Start development server with hot-reload
- `pnpm build` - Build the project
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm lint` - Run ESLint
- `pnpm clean` - Clean build artifacts
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:migrate` - Run database migrations
- `pnpm prisma:studio` - Open Prisma Studio

## Database Schema

The main entity is the `Contact` model with the following structure:

```prisma
model Contact {
  id         String   @id @default(uuid())
  name       String
  phone      String   @unique
  bio        String?
  avatar     String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000                 # API server port
NODE_ENV=development     # development, test, or production

# Database Configuration
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_database
DB_PORT=5432            # PostgreSQL port

# Database URL (used by Prisma)
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${DB_PORT}/${POSTGRES_DB}?schema=public

# For Docker Compose, use:
# DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:${DB_PORT}/${POSTGRES_DB}?schema=public
```

## Container Services

The `docker-compose.yml` file defines two services:

1. **api**: The Node.js application
   - Builds from the Dockerfile
   - Exposes port 5000
   - Depends on the database
   - Hot-reload enabled for development

2. **db**: PostgreSQL database
   - Uses official PostgreSQL image
   - Persists data using a named volume
   - Exposes port 5432

To customize the configuration, you can modify the environment variables in your `.env` file.
