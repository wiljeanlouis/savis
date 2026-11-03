#!/usr/bin/env python3
"""Conservative SQL risk report; never executes SQL."""
import os
from pathlib import Path
import re
import sys
from urllib.parse import quote, quote_plus


def redact(value):
    for name, secret in sorted(os.environ.items(), key=lambda item: -len(item[1])):
        if secret and any(word in name.upper() for word in ("PASSWORD", "SECRET", "TOKEN", "KEY", "DB_URL", "DATABASE_URL")):
            for representation in (secret, quote(secret, safe=""), quote_plus(secret)):
                value = value.replace(representation, "[REDACTED]")
    return re.sub(r"[a-zA-Z][a-zA-Z0-9+.-]*://[^\s'\"]+", "[REDACTED_URL]", value)


def report(root):
    # Intentionally conservative, including historical files. An SQL regex cannot
    # prove compatibility, dynamic SQL safety, RLS safety, or acceptable lock time.
    risk = re.compile(r"\b(drop|truncate|delete|update|revoke)\b|\balter\s+|\bexecute\b", re.I)
    for path in sorted((root / "supabase/migrations").glob("*.sql")):
        if risk.search(path.read_text()):
            print(f"WARNING: potential destructive SQL operation in {path.name}")


if __name__ == "__main__":
    if sys.argv[1] == "redact":
        print(redact(sys.stdin.read()), end="")
    elif sys.argv[1] == "report":
        report(Path(sys.argv[2]))
