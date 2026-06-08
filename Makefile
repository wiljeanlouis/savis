.PHONY: help run-local run-prod stop logs clean \
	supabase-start supabase-stop supabase-status supabase-reset \
	configure-local-supabase

SAVOURETPLUS_DIR ?= ../savouretplus
SUPABASE_CLI := npx --yes supabase

# config
help:
	@echo "Command available for SAVIS :"
	@echo "  make run-local            - Launch SAVIS and Supabase locally"
	@echo "  make run-prod             - Launch prod environment (.env)"
	@echo "  make stop                 - Stop SAVIS and Supabase containers"
	@echo "  make logs                 - Show SAVIS logs live"
	@echo "  make clean                - Stop containers and remove local data"
	@echo "  make supabase-status      - Show Supabase local URLs and keys"
	@echo "  make supabase-reset       - Rebuild the Supabase database"

# DEV mode (Local)
run-local: supabase-start configure-local-supabase
	@echo "Launch SAVIS in DEV mode..."
	docker compose \
		--env-file .env.supabase.local \
		up -d --build

# PROD mode
run-prod:
	@echo "Launch SAVIS in PROD mode..."
	docker compose --env-file .env up -d --build

stop:
	docker compose down
	$(MAKE) supabase-stop

logs:
	docker compose logs -f

clean:
	docker compose down -v
	$(SUPABASE_CLI) stop --no-backup

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
