.PHONY: up down reset infra

up:
	docker compose down -v 2>/dev/null || true
	docker compose up --build

down:
	docker compose down

reset:
	docker compose down -v

infra:
	cd backend && docker compose down -v 2>/dev/null || true
	cd backend && docker compose up -d
