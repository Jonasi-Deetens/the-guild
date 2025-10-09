# Docker Setup for The Guild

This directory contains Docker configuration for running PostgreSQL and Redis locally.

## Services

- **PostgreSQL**: Database server on port 5432
- **Redis**: Cache and session store on port 6379
- **Redis Commander**: Web UI for Redis management on port 8081

## Quick Start

1. **Start the services:**

   ```bash
   docker-compose up -d
   ```

2. **Check service status:**

   ```bash
   docker-compose ps
   ```

3. **View logs:**

   ```bash
   docker-compose logs -f postgres
   docker-compose logs -f redis
   ```

4. **Stop the services:**
   ```bash
   docker-compose down
   ```

## Database Setup

After starting the services, run Prisma migrations:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## Accessing Services

- **PostgreSQL**: `localhost:5432`

  - Database: `the_guild`
  - Username: `postgres`
  - Password: `password`

- **Redis**: `localhost:6379`

  - Password: `password`

- **Redis Commander**: http://localhost:8081
  - No authentication required (local development only)

## Data Persistence

Data is persisted in Docker volumes:

- `postgres_data`: PostgreSQL data
- `redis_data`: Redis data

To reset all data:

```bash
docker-compose down -v
docker-compose up -d
```

## Health Checks

Both services include health checks. You can verify they're running:

```bash
docker-compose ps
```

All services should show "healthy" status.
