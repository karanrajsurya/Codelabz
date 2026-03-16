# Docker Setup — CodeLabz

## Prerequisites
- Docker Desktop installed
- `.env` file in project root with Firebase credentials

## Run with Docker Compose
```bash
docker-compose up --build
```

## Access the app
- App → http://localhost:5173
- Firebase Emulator UI → http://localhost:4000

## Stop
```bash
docker-compose down
```

## Changes from original
- Upgraded `node:14` → `node:18`
- Added `--legacy-peer-deps` for peer dependency conflicts
- Fixed project name `demo-sampark` → `demo-codelabz`
- Fixed Vite host binding to `0.0.0.0` for container access