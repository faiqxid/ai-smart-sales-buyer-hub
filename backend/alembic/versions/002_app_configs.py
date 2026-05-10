"""add app configs table

Revision ID: 002
Revises: 001
Create Date: 2026-05-10

"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'app_configs',
        sa.Column('key', sa.String(100), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_by', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('key')
    )
    op.create_index(op.f('ix_app_configs_key'), 'app_configs', ['key'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_app_configs_key'), table_name='app_configs')
    op.drop_table('app_configs')
