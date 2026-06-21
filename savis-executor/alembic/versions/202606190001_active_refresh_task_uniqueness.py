"""Prevent duplicate active offer refresh tasks.

Revision ID: 202606190001
Revises: 202606130001
Create Date: 2026-06-19
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import sqlalchemy as sa

from alembic import op

if TYPE_CHECKING:
    from collections.abc import Sequence

revision: str = "202606190001"
down_revision: str | None = "202606130001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SCHEMA = "savis_executor"
INDEX_NAME = "uq_savis_tasks_active_refresh_offer"


def upgrade() -> None:
    """Add a uniqueness guard for active refresh tasks per offer."""
    op.create_index(
        INDEX_NAME,
        "savis_tasks",
        [sa.text("(payload ->> 'offer_id')")],
        unique=True,
        schema=SCHEMA,
        postgresql_where=sa.text(
            "type = 'REFRESH_OFFER' and status = 'IN_PROGRESS'",
        ),
    )


def downgrade() -> None:
    """Downgrades are intentionally unsupported in production."""
    message = "SAVIS migrations are forward-only"
    raise NotImplementedError(message)
