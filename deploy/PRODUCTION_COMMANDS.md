# SAVIS Production Commands

Useful commands for operating SAVIS on the Ubuntu production server.

The examples assume:

- deployment user: `savis`;
- environment file: `/etc/savis/savis.env`;
- deployment root: `/home/savis/.local/share/savis/deploy`;
- current release symlink: `/home/savis/.local/share/savis/deploy/current`.

## Navigation

- [Setup](#setup)
- [Stack](#stack)
- [Health](#health)
- [Chrome CDP](#chrome-cdp)
- [Backups](#backups)
- [PostgreSQL](#postgresql)
- [RabbitMQ](#rabbitmq)
- [Disk And Docker](#disk-and-docker)
- [Deployment](#deployment)

## Setup

Set this helper in your shell before running Compose commands:

```bash
COMPOSE='docker compose --project-name savis --env-file /etc/savis/savis.env --env-file /home/savis/.local/share/savis/deploy/current/release.env -f /home/savis/.local/share/savis/deploy/current/docker-compose.prod.yml'
```

Run user-service commands, especially Chrome CDP commands, as the `savis`
graphical user:

```bash
sudo -iu savis
```

## Stack

Show running services:

```bash
$COMPOSE ps
```

Show recent logs for all application services:

```bash
$COMPOSE logs --tail=150 --no-color backend_api executor_api executor_worker executor_beat frontend_admin
```

Follow logs:

```bash
$COMPOSE logs -f backend_api executor_api executor_worker executor_beat frontend_admin
```

Restart one service:

```bash
$COMPOSE restart executor_worker
```

Start the full production stack from the current release:

```bash
$COMPOSE up -d postgres rabbitmq
$COMPOSE run --rm executor_migrate
$COMPOSE up -d backend_api executor_api executor_worker executor_beat frontend_admin --remove-orphans
```

## Health

Check the public Admin entrypoint:

```bash
curl --fail http://127.0.0.1:8088/health
```

Check backend services from inside the Compose network:

```bash
$COMPOSE exec -T backend_api wget -qO- http://127.0.0.1:8080/actuator/health/readiness
$COMPOSE exec -T executor_api python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).read().decode())"
```

Show Docker healthcheck output for a service:

```bash
container_id="$($COMPOSE ps -q executor_api)"
docker inspect --format '{{range .State.Health.Log}}{{println .End .ExitCode .Output}}{{end}}' "$container_id"
```

## Chrome CDP

These are `systemd --user` services. Run them as the `savis` graphical user,
not through root's user manager.

Check the user services:

```bash
systemctl --user status savis-chrome-cdp.service
systemctl --user status savis-chrome-cdp-proxy.service
```

Check only active/inactive state:

```bash
systemctl --user is-active savis-chrome-cdp.service
systemctl --user is-active savis-chrome-cdp-proxy.service
```

Follow logs:

```bash
journalctl --user -u savis-chrome-cdp.service -f
journalctl --user -u savis-chrome-cdp-proxy.service -f
```

Verify CDP endpoints:

```bash
curl --fail http://127.0.0.1:9222/json/version
curl --fail http://127.0.0.1:9223/json/version
```

Restart CDP services:

```bash
systemctl --user restart savis-chrome-cdp.service savis-chrome-cdp-proxy.service
```

## Backups

Install or update the backup systemd unit and timer:

```bash
sudo ./deploy/scripts/install-postgres-backup-systemd.sh
```

Check the backup timer:

```bash
systemctl status savis-postgres-backup.timer
systemctl list-timers | grep savis-postgres-backup
```

Run a manual backup:

```bash
sudo systemctl start savis-postgres-backup.service
```

Show backup logs:

```bash
journalctl -u savis-postgres-backup.service -n 100 --no-pager
journalctl -u savis-postgres-backup.service -f
```

List local backups:

```bash
sudo -u savis find /home/savis/.local/share/savis/deploy/backups/postgres -maxdepth 1 -type f -name '*.dump' -ls
```

List remote backups:

```bash
sudo -u savis rclone lsf "$(sudo -u savis sh -c '. /etc/savis/savis.env && printf %s "$RCLONE_BACKUP_REMOTE"')" --files-only
```

## PostgreSQL

Check PostgreSQL readiness:

```bash
$COMPOSE exec -T postgres pg_isready -U "$(sudo sh -c '. /etc/savis/savis.env && printf %s "$DB_USER"')" -d "$(sudo sh -c '. /etc/savis/savis.env && printf %s "$DB_NAME"')"
```

Open `psql`:

```bash
$COMPOSE exec postgres psql -U "$(sudo sh -c '. /etc/savis/savis.env && printf %s "$DB_USER"')" -d "$(sudo sh -c '. /etc/savis/savis.env && printf %s "$DB_NAME"')"
```

Check migration versions:

```bash
$COMPOSE exec -T postgres psql -U "$(sudo sh -c '. /etc/savis/savis.env && printf %s "$DB_USER"')" -d "$(sudo sh -c '. /etc/savis/savis.env && printf %s "$DB_NAME"')" -c 'select * from savis_api.flyway_schema_history order by installed_rank desc limit 5;'
$COMPOSE exec -T postgres psql -U "$(sudo sh -c '. /etc/savis/savis.env && printf %s "$DB_USER"')" -d "$(sudo sh -c '. /etc/savis/savis.env && printf %s "$DB_NAME"')" -c 'select * from savis_executor.alembic_version;'
```

Run executor migrations manually:

```bash
$COMPOSE run --rm executor_migrate
```

## RabbitMQ

Queue purge commands are destructive. Use them only when pending messages can
be discarded.

Check RabbitMQ health:

```bash
$COMPOSE exec -T rabbitmq rabbitmq-diagnostics -q ping
```

List queues:

```bash
$COMPOSE exec -T rabbitmq rabbitmqctl list_queues name messages messages_ready messages_unacknowledged consumers
```

Purge the executor Celery task queue:

```bash
$COMPOSE stop executor_worker executor_beat
$COMPOSE exec -T rabbitmq rabbitmqctl purge_queue savis.executor.tasks
$COMPOSE up -d executor_worker executor_beat
```

Purge offer integration queues:

```bash
$COMPOSE stop backend_api executor_api executor_worker executor_beat
$COMPOSE exec -T rabbitmq rabbitmqctl purge_queue savis.offer.requests
$COMPOSE exec -T rabbitmq rabbitmqctl purge_queue savis.offer.results
$COMPOSE exec -T rabbitmq rabbitmqctl purge_queue savis.offer.invalidations
$COMPOSE up -d backend_api executor_api executor_worker executor_beat
```

Purge every SAVIS queue:

```bash
$COMPOSE stop backend_api executor_api executor_worker executor_beat
$COMPOSE exec -T rabbitmq rabbitmqctl purge_queue savis.executor.tasks
$COMPOSE exec -T rabbitmq rabbitmqctl purge_queue savis.offer.requests
$COMPOSE exec -T rabbitmq rabbitmqctl purge_queue savis.offer.results
$COMPOSE exec -T rabbitmq rabbitmqctl purge_queue savis.offer.invalidations
$COMPOSE up -d backend_api executor_api executor_worker executor_beat
```

## Disk And Docker

Check disk usage:

```bash
df -h
docker system df
```

List SAVIS volumes:

```bash
docker volume ls | grep savis
```

Check current release:

```bash
readlink -f /home/savis/.local/share/savis/deploy/current
cat /home/savis/.local/share/savis/deploy/current/release.env
```

## Deployment

Deploy a release package:

```bash
tar -xzf savis-v1.2.0.tar.gz
./savis-v1.2.0/deploy/scripts/deploy-production.sh ./savis-v1.2.0
```

Verify after deployment:

```bash
curl --fail http://127.0.0.1:8088/health
$COMPOSE ps
```
