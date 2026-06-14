"""Create the initial executor schema.

Revision ID: 202606130001
Revises:
Create Date: 2026-06-13
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import sqlalchemy as sa

from alembic import op

if TYPE_CHECKING:
    from collections.abc import Sequence

revision: str = "202606130001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SCHEMA = "savis_executor"


def upgrade() -> None:
    """Create tables and indexes owned by the executor."""
    op.execute(sa.text(f'create schema if not exists "{SCHEMA}"'))

    op.create_table(
        "savis_tasks",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("type", sa.String(length=64), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        schema=SCHEMA,
    )
    op.create_index(
        "idx_savis_tasks_status_updated",
        "savis_tasks",
        ["status", "updated_at"],
        schema=SCHEMA,
    )

    op.create_table(
        "offers",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("external_id", sa.String(length=255), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("brand", sa.String(length=255), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("price_amount", sa.Numeric(12, 4), nullable=True),
        sa.Column("price_currency", sa.String(length=8), nullable=True),
        sa.Column("package_size_value", sa.Numeric(12, 4), nullable=True),
        sa.Column("package_size_unit", sa.String(length=32), nullable=True),
        sa.Column("image_url", sa.String(length=2048), nullable=False),
        sa.Column("provider_name", sa.String(length=255), nullable=False),
        sa.Column("provider_identifier", sa.String(length=255), nullable=False),
        sa.Column("provider_site", sa.String(length=2048), nullable=False),
        sa.Column("provider_address", sa.String(length=1024), nullable=False),
        sa.Column("search_term", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column(
            "offer_type",
            sa.String(length=32),
            server_default="FOOD",
            nullable=False,
        ),
        sa.Column("last_retrieved_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("next_refresh_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("refresh_frequency_hours", sa.Integer(), nullable=False),
        sa.Column("last_seen_task_id", sa.String(length=36), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "provider_identifier",
            "external_id",
            name="uq_offers_provider_external_id",
        ),
        schema=SCHEMA,
    )
    op.create_index(
        "idx_offers_refresh",
        "offers",
        ["status", "next_refresh_at"],
        schema=SCHEMA,
    )
    op.create_index(
        "idx_offers_facets",
        "offers",
        ["offer_type", "search_term", "status"],
        schema=SCHEMA,
    )

    op.create_table(
        "provider_access_states",
        sa.Column("provider_identifier", sa.String(length=255), nullable=False),
        sa.Column("consecutive_blocks", sa.Integer(), nullable=False),
        sa.Column("blocked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("probe_reserved_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_request_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_request_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_success_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_block_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("provider_identifier"),
        schema=SCHEMA,
    )


def downgrade() -> None:
    """Downgrades are intentionally unsupported in production."""
    message = "SAVIS migrations are forward-only"
    raise NotImplementedError(message)
