from flask import request, jsonify
from app.extensions import db
from app.models.setting_model import Setting
from app.models.user_model import User
from werkzeug.security import check_password_hash, generate_password_hash
import traceback

def get_or_create_setting():
    setting = Setting.query.first()
    if setting:
        return setting

    setting = Setting(
        electricity_price=3500,
        water_price=15000,
        default_deposit=1500000,
        auto_billing=True,
        email_notifications=False,
        maintenance_mode=False
    )
    db.session.add(setting)
    db.session.flush()
    return setting

def get_settings_logic():
    try:
        # Retrieve the first configuration record
        setting = get_or_create_setting()
        # Retrieve Admin account (assume first user or role='admin')
        admin = User.query.filter_by(role='admin').first() or User.query.first()
        
        return jsonify({
            'dormConfig': {
                'electricityPrice': setting.electricity_price if setting else 3500,
                'waterPrice': setting.water_price if setting else 15000,
                'defaultDeposit': setting.default_deposit if setting else 1500000
            },
            'systemConfig': {
                'autoBilling': setting.auto_billing if setting else True,
                'emailNotifications': setting.email_notifications if setting else False,
                'maintenanceMode': setting.maintenance_mode if setting else False
            },
            'account': {
                'fullName': admin.full_name if admin else '',
                'email': admin.email if admin else '',
                'phone': admin.phone if admin else ''
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def update_dorm_config_logic():
    try:
        data = request.get_json()
        setting = get_or_create_setting()
        
        setting.electricity_price = data.get('electricityPrice', setting.electricity_price)
        setting.water_price = data.get('waterPrice', setting.water_price)
        setting.default_deposit = data.get('defaultDeposit', setting.default_deposit)
        
        db.session.commit()
        return jsonify({'message': 'Dormitory configuration updated successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

def update_system_config_logic():
    try:
        data = request.get_json()
        setting = get_or_create_setting()
        
        setting.auto_billing = data.get('autoBilling', setting.auto_billing)
        setting.email_notifications = data.get('emailNotifications', setting.email_notifications)
        setting.maintenance_mode = data.get('maintenanceMode', setting.maintenance_mode)
        
        db.session.commit()
        return jsonify({'message': 'System configuration updated successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

def update_account_logic():
    try:
        data = request.get_json()
        admin = User.query.filter_by(role='admin').first() or User.query.first()
        
        admin.full_name = data.get('fullName', admin.full_name)
        admin.phone = data.get('phone', admin.phone)
        admin.email = data.get('email', admin.email)
        
        # If both old and new passwords are provided, attempt to update password
        old_pass = data.get('oldPassword')
        new_pass = data.get('newPassword')
        if old_pass and new_pass:
            if check_password_hash(admin.password, old_pass):
                admin.password = generate_password_hash(new_pass)
            else:
                return jsonify({'error': 'Current password is incorrect!'}), 400
                
        db.session.commit()
        return jsonify({'message': 'Account updated successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
