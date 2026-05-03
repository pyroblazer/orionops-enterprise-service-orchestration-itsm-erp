@echo off
REM ---------------------------------------------------------------------------
REM OrionOps - Start full stack (fresh start)
REM Runs docker compose down then up --build for a clean environment
REM ---------------------------------------------------------------------------
docker compose down -v 2>nul
docker compose up --build %*
