#!/usr/bin/env python3
"""Run PostgreSQL integration tests in a fresh database on a local Postgres container."""
import json
import os
from pathlib import Path
import subprocess
import uuid

root = Path(__file__).resolve().parents[2]
container = os.environ.get("SAVIS_TEST_POSTGRES_CONTAINER", "postgres")
metadata = json.loads(subprocess.check_output(["docker", "inspect", container]))[0]
settings = dict(value.split("=", 1) for value in metadata["Config"]["Env"] if "=" in value)
user = settings.get("POSTGRES_USER", "postgres")
password = settings["POSTGRES_PASSWORD"]
port = metadata["NetworkSettings"]["Ports"]["5432/tcp"][0]["HostPort"]
database = "savis_quote_test_" + uuid.uuid4().hex
subprocess.run(["docker", "exec", container, "createdb", "-U", user, database], check=True)
try:
    environment = dict(os.environ, SAVIS_TEST_POSTGRES_URL=f"jdbc:postgresql://localhost:{port}/{database}",
                       SAVIS_TEST_POSTGRES_USER=user, SAVIS_TEST_POSTGRES_PASSWORD=password)
    result = subprocess.run(["./mvnw", "-Dtest=QuoteRequestPostgresTest", "test"],
                            cwd=root / "savis-api", env=environment, check=False)
    code = result.returncode
finally:
    subprocess.run(["docker", "exec", container, "dropdb", "-U", user, database], check=True)
raise SystemExit(code)
