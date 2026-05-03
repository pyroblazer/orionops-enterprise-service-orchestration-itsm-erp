@echo off
REM ---------------------------------------------------------------------------
REM OrionOps - Start infrastructure only (fresh start)
REM Runs backend docker compose down then up for backing services only
REM ---------------------------------------------------------------------------
cd backend
docker compose down -v 2>nul
docker compose up -d %*
