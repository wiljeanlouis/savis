.PHONY: help chrome-cdp-start install-chrome-cdp-ubuntu run-local run-prod stop logs clean smoke-executor-worker smoke-database smoke-admin \
	supabase-start supabase-stop supabase-status supabase-reset \
	configure-local-supabase

SAVOURETPLUS_DIR ?= ../savouretplus
SUPABASE_CLI := npx --yes supabase
LOCAL_COMPOSE := docker compose -f docker-compose.yml
PROD_COMPOSE := docker compose -f docker-compose.prod.yml

# config
help:
	@echo "Command available for SAVIS :"
	@echo "  make run-local            - Launch SAVIS and Supabase locally"
	@echo "  make run-prod             - Launch prod environment (.env)"
	@echo "  make chrome-cdp-start     - Start Chrome CDP on macOS"
	@echo "  make install-chrome-cdp-ubuntu - Install Chrome CDP services on Ubuntu"
	@echo "  make stop                 - Stop SAVIS and Supabase containers"
	@echo "  make logs                 - Show SAVIS logs live"
	@echo "  make clean                - Stop containers and remove local data"
	@echo "  make smoke-executor-worker - Smoke test RabbitMQ and the Celery worker"
	@echo "  make smoke-database       - Smoke test PostgreSQL, Flyway, and Alembic"
	@echo "  make smoke-admin          - Smoke test the Admin Nginx image"
	@echo "  make supabase-status      - Show Supabase local URLs and keys"
	@echo "  make supabase-reset       - Rebuild the Supabase database"

# DEV mode (Local)
chrome-cdp-start:
	./scripts/start-chrome-cdp-macos.sh

install-chrome-cdp-ubuntu:
	./scripts/install-chrome-cdp-ubuntu.sh

run-local: chrome-cdp-start supabase-start configure-local-supabase
	@echo "Launch SAVIS in DEV mode..."
	$(LOCAL_COMPOSE) \
		--env-file .env.supabase.local \
		up -d --build

# PROD mode
run-prod:
	@echo "Launch SAVIS in PROD mode..."
	$(PROD_COMPOSE) --env-file .env up -d --build

stop:
	$(LOCAL_COMPOSE) down
	$(MAKE) supabase-stop

logs:
	$(LOCAL_COMPOSE) logs -f

clean:
	$(LOCAL_COMPOSE) down -v
	$(SUPABASE_CLI) stop --no-backup

smoke-executor-worker:
	./scripts/smoke-executor-worker.sh

smoke-database:
	./scripts/smoke-database.sh

smoke-admin:
	./scripts/smoke-admin.sh

supabase-start:
	@echo "Start Supabase local..."
	$(SUPABASE_CLI) start

supabase-stop:
	$(SUPABASE_CLI) stop

supabase-status:
	$(SUPABASE_CLI) status

supabase-reset:
	$(SUPABASE_CLI) db reset

configure-local-supabase:
	@$(NODE_RUNNER) node scripts/configure-savouretplus-supabase.mjs "$(SAVOURETPLUS_DIR)"
