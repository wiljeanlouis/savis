"""Alembic environment for the executor database."""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool, text

from alembic import context
from app.adapters.database import (
    offer_repository,
    provider_access_policy,
    savis_task_repository,
)
from app.adapters.database.session import Base
from app.config import EnvParams

config = context.config
config.set_main_option("sqlalchemy.url", EnvParams.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Referencing imported modules makes their registration side effect explicit.
_entities = (offer_repository, provider_access_policy, savis_task_repository)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without creating an Engine."""
    context.configure(
        url=EnvParams.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table_schema=EnvParams.DATABASE_SCHEMA,
        include_schemas=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations using a database connection."""
    configuration = config.get_section(config.config_ini_section, {})
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args={
            "options": f"-csearch_path={EnvParams.DATABASE_SCHEMA}",
        },
    )

    with connectable.connect() as connection:
        with connection.begin():
            connection.execute(
                text(
                    f'create schema if not exists "{EnvParams.DATABASE_SCHEMA}"',
                ),
            )
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            version_table_schema=EnvParams.DATABASE_SCHEMA,
            include_schemas=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
