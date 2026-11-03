#!/usr/bin/env python3
"""Validate the complete Supabase migration chain and submissions on a disposable DB."""
from concurrent.futures import ThreadPoolExecutor
import json
import os
from pathlib import Path
import subprocess
import uuid

root = Path(__file__).resolve().parents[2]
container = os.environ.get("SAVIS_TEST_SUPABASE_CONTAINER", "supabase_db_savis-supabase")
database = "savis_quote_test_" + uuid.uuid4().hex

def sql(statement):
    result = subprocess.run(["docker", "exec", "-i", container, "psql", "-X", "-U", "postgres", "-d", database,
                             "-v", "ON_ERROR_STOP=1", "-At"], input=statement, text=True, capture_output=True, check=True)
    if "not ok " in result.stdout:
        raise AssertionError(result.stdout)
    return result.stdout

subprocess.run(["docker", "exec", container, "createdb", "-U", "postgres", database], check=True)
try:
    sql("create schema extensions; grant usage on schema extensions to public;")
    for migration in sorted((root / "supabase/migrations").glob("*.sql")):
        sql(migration.read_text())
    for test in sorted((root / "supabase/tests").glob("*.sql")):
        print(sql(test.read_text()), flush=True)
    payload = {"request_id": str(uuid.uuid4()), "type": "QUOTE_REQUEST", "customer": {"name": "Test", "phone": "5145550123"},
               "requested_services": ["organisation"], "event_details": {"request_type": "organisation", "event_type": "Mariage",
               "event_date": "2027-01-01", "event_address": "Montréal", "budget": "À préciser"}, "items": []}
    literal = json.dumps(payload).replace("'", "''")
    query = "select public.submit_quote_request('" + literal + "'::jsonb);"
    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(sql, [query, query]))
    assert results[0].strip() == results[1].strip(), "concurrent submissions must return one reception"
    assert sql("select count(*) from public.quote_requests;").strip() == "1", "one durable reception expected"
    if os.environ.get("SAVIS_TEST_SUPABASE_LINT") == "1":
        subprocess.run(["npx", "--yes", "supabase", "db", "lint", "--db-url",
                        f"postgresql://postgres:postgres@127.0.0.1:54322/{database}", "--level", "warning"], cwd=root, check=True)
    print("ok - complete migrations, SQL contracts, privileges and concurrent submissions", flush=True)
finally:
    subprocess.run(["docker", "exec", container, "dropdb", "-U", "postgres", database], check=True)
