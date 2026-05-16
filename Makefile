.PHONY: run-local run-prod stop logs clean help

# config
help:
	@echo "Command available for SAVIS :"
	@echo "  make run-local    - Launch dev environment (.env.local)"
	@echo "  make run-prod     - Launch prod environment (.env)"
	@echo "  make stop         - Stop all containers"
	@echo "  make logs         - Show logs live"
	@echo "  make clean        - Stop all containers and clean volume data (DB data,...)"

# 🛠️ DEV mode (Local)
run-local:
	@echo "🚀 Launch SAVIS in DEV mode (Hot-Reload)..."
	docker compose --env-file .env.local up -d --build

# 🎯 PROD mode
run-prod:
	@echo "📦 Launch SAVIS in PROD mode (Nginx & JRE)..."
	docker compose --env-file .env up -d --build

stop:
	docker compose down

logs:
	docker compose logs -f

clean:
	docker compose down -v
