"""add_covering_index_to_transaction

Revision ID: b9444ddf3915
Revises: d3f35b61d9e6
Create Date: 2026-09-22 13:34:29.710075

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b9444ddf3915"
down_revision: Union[str, Sequence[str], None] = "d3f35b61d9e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.get_context().autocommit_block():
        op.execute(
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_portfolio_covering
            ON transactions (user_id, ticker)
            INCLUDE (shares, price_per_share);
            """
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.get_context().autocommit_block():
        op.execute(
            """
            DROP INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_portfolio_covering;
            """
        )
