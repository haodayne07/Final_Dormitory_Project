"""Add gender fields and missing runtime tables

Revision ID: b7c3d9e2f4a1
Revises: 67ee40718e55
Create Date: 2026-04-24 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'b7c3d9e2f4a1'
down_revision = '67ee40718e55'
branch_labels = None
depends_on = None


def _tables():
    return set(sa.inspect(op.get_bind()).get_table_names())


def _columns(table_name):
    return {column['name'] for column in sa.inspect(op.get_bind()).get_columns(table_name)}


def upgrade():
    tables = _tables()

    if 'users' in tables and 'gender' not in _columns('users'):
        op.add_column('users', sa.Column('gender', sa.String(length=10), nullable=False, server_default='male'))
        op.alter_column('users', 'gender', server_default=None)

    if 'rooms' in tables:
        room_columns = _columns('rooms')
        if 'gender_type' not in room_columns:
            op.add_column('rooms', sa.Column('gender_type', sa.String(length=10), nullable=False, server_default='male'))
            op.alter_column('rooms', 'gender_type', server_default=None)
        if 'image_url' not in room_columns:
            op.add_column('rooms', sa.Column('image_url', sa.String(length=255), nullable=True))

    if 'devices' in tables and 'image_url' not in _columns('devices'):
        op.add_column('devices', sa.Column('image_url', sa.String(length=255), nullable=True))

    if 'settings' not in tables:
        op.create_table(
            'settings',
            sa.Column('setting_id', sa.Integer(), nullable=False),
            sa.Column('electricity_price', sa.Float(), nullable=True),
            sa.Column('water_price', sa.Float(), nullable=True),
            sa.Column('default_deposit', sa.Float(), nullable=True),
            sa.Column('auto_billing', sa.Boolean(), nullable=True),
            sa.Column('email_notifications', sa.Boolean(), nullable=True),
            sa.Column('maintenance_mode', sa.Boolean(), nullable=True),
            sa.PrimaryKeyConstraint('setting_id')
        )
        settings_table = sa.table(
            'settings',
            sa.column('electricity_price', sa.Float),
            sa.column('water_price', sa.Float),
            sa.column('default_deposit', sa.Float),
            sa.column('auto_billing', sa.Boolean),
            sa.column('email_notifications', sa.Boolean),
            sa.column('maintenance_mode', sa.Boolean),
        )
        op.bulk_insert(settings_table, [{
            'electricity_price': 3500,
            'water_price': 15000,
            'default_deposit': 1500000,
            'auto_billing': True,
            'email_notifications': False,
            'maintenance_mode': False,
        }])

    if 'events' not in tables:
        op.create_table(
            'events',
            sa.Column('event_id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('type', sa.String(length=50), nullable=True),
            sa.Column('event_date', sa.Date(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=True),
            sa.PrimaryKeyConstraint('event_id')
        )


def downgrade():
    tables = _tables()

    if 'events' in tables:
        op.drop_table('events')

    if 'settings' in tables:
        op.drop_table('settings')

    if 'devices' in tables and 'image_url' in _columns('devices'):
        op.drop_column('devices', 'image_url')

    if 'rooms' in tables:
        room_columns = _columns('rooms')
        if 'image_url' in room_columns:
            op.drop_column('rooms', 'image_url')
        if 'gender_type' in room_columns:
            op.drop_column('rooms', 'gender_type')

    if 'users' in tables and 'gender' in _columns('users'):
        op.drop_column('users', 'gender')
