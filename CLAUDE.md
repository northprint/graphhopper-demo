# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
# Install dependencies (requires pnpm 9+)
pnpm install

# Start all services with Docker
docker-compose up -d

# Start development servers (Turborepo)
pnpm dev

# Run specific app in development
pnpm --filter @graphhopper-demo/web dev
```

### Build & Test
```bash
# Build all packages
pnpm build

# Run tests
pnpm test
pnpm test:unit  # Unit tests only
pnpm test:e2e   # E2E tests only

# Lint and format
pnpm lint
pnpm format

# Type checking
pnpm check
```

### GraphHopper Setup
```bash
# Download demo map data (lightweight)
./scripts/download-demo-data.sh

# Or download specific region
wget -O data/map.osm.pbf https://download.geofabrik.de/europe/monaco-latest.osm.pbf

# Run GraphHopper without Docker
java -jar graphhopper.jar server services/graphhopper/config.yml
```

## Architecture Overview

### Monorepo Structure (Turborepo + pnpm workspaces)
- **apps/web**: SvelteKit frontend application
  - Uses Vite for development and building
  - TypeScript with strict mode
  - Leaflet for map visualization
  - GraphHopper client at `src/lib/graphhopper.ts`

- **services/graphhopper**: GraphHopper routing service
  - Java-based routing engine
  - Configured for car, bike, and foot profiles
  - Uses Contraction Hierarchies for performance
  - Processes OpenStreetMap .pbf files

- **packages/**: Shared packages (reserved for future use)

### Key Integrations

1. **GraphHopper API Client** (`apps/web/src/lib/graphhopper.ts`)
   - Singleton instance exported as `graphhopper`
   - Main methods: `route()`, `info()`, `health()`
   - Uses environment variable `PUBLIC_GRAPHHOPPER_URL`

2. **Docker Services**
   - GraphHopper runs on port 8989 with health checks
   - Web app runs on port 5173 in development
   - Services communicate via `graphhopper-network`
   - GraphHopper waits for healthy status before web starts

3. **Environment Variables**
   - `PUBLIC_GRAPHHOPPER_URL`: Client-side GraphHopper URL
   - `VITE_GRAPHHOPPER_URL`: Server-side GraphHopper URL (Docker internal)
   - Map center and zoom levels configurable

### GraphHopper Configuration
Located in `services/graphhopper/config.yml`:
- Profiles: car (fastest), bike (fastest), foot (shortest)
- Elevation data: SRTM provider
- Ignored highways: footway, cycleway, path, pedestrian, steps
- Max visited nodes: 1,000,000

### Build Pipeline
Turborepo orchestrates builds with:
- Dependency graph awareness (`dependsOn: ["^build"]`)
- Output caching for `.svelte-kit/**`, `dist/**`
- Persistent dev servers
- Environment-aware builds

## Important Notes

- Map data must be placed in `data/` directory as `map.osm.pbf`
- Initial GraphHopper processing can take 5-30 minutes
- Java heap size configurable via `JAVA_OPTS` in docker-compose.yml
- Frontend uses SvelteKit's file-based routing
- All packages use ESM modules