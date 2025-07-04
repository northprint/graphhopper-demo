# GraphHopper Demo

This is a Turborepo monorepo demonstrating GraphHopper routing with a SvelteKit frontend.

## Prerequisites

- Node.js 18+
- pnpm 9+
- Docker and Docker Compose
- OpenStreetMap data file (.osm.pbf format)

## Project Structure

```
graphhopper-demo/
├── apps/
│   └── web/               # SvelteKit frontend application
├── packages/              # Shared packages (future)
├── services/
│   └── graphhopper/       # GraphHopper routing service
├── data/                  # Map data directory
├── docker-compose.yml     # Docker services configuration
└── turbo.json            # Turborepo configuration
```

## Setup

1. **Clone and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Prepare map data:**
   
   For demo purposes, use the provided script to download lightweight map data:
   ```bash
   ./scripts/download-demo-data.sh
   ```
   
   Available lightweight options:
   - **Liechtenstein** (1.7MB) - Small European country
   - **Monaco** (458KB) - Tiny city-state
   - **Andorra** (3.6MB) - Pyrenees country
   - **Maldives** (3.1MB) - Island nation
   - **Tokyo area** (50MB) - Extracted region from BBBike
   
   For production use, download full regions from [Geofabrik](https://download.geofabrik.de/)

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   cp apps/web/.env.example apps/web/.env
   ```

4. **Start services with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

   This will:
   - Build and start the GraphHopper service
   - Process the map data (first run may take several minutes)
   - Start the SvelteKit development server

5. **Access the application:**
   - Frontend: http://localhost:5173
   - GraphHopper API: http://localhost:8989

## Development

### Running locally (without Docker)

1. **Start GraphHopper manually:**
   ```bash
   # Download GraphHopper JAR and run with your map data
   java -jar graphhopper.jar server services/graphhopper/config.yml
   ```

2. **Start the development server:**
   ```bash
   pnpm dev
   ```

### Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all applications
- `pnpm lint` - Run linting
- `pnpm test` - Run tests
- `pnpm format` - Format code with Prettier

## GraphHopper Configuration

GraphHopperは以下の方法で実行できます：

### オプション1: Docker Compose（推奨）
```bash
docker-compose up -d
```

### オプション2: ローカル実行
```bash
./run-graphhopper.sh
```

注意: ARM64 (Apple Silicon) 環境では、GraphHopperの公式Dockerイメージがx86_64用のため、パフォーマンスが低下する可能性があります。

## API Usage

The frontend includes a GraphHopper client at `apps/web/src/lib/graphhopper.ts`:

```typescript
import { graphhopper } from '$lib/graphhopper';

// Calculate route
const route = await graphhopper.route({
  points: [
    [35.6762, 139.6503], // Tokyo Station
    [35.6585, 139.7454]  // Tokyo Tower
  ],
  profile: 'car',
  instructions: true
});
```

## Troubleshooting

- **GraphHopper takes long to start:** Initial map processing can take 5-30 minutes depending on map size
- **Out of memory errors:** Increase Java heap size in `docker-compose.yml` (JAVA_OPTS)
- **Port conflicts:** Change ports in `docker-compose.yml` if needed

## License

MIT