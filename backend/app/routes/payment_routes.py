from flask import Blueprint, request, jsonify
from app.controllers.auth_controller import require_role
from app.controllers.payment_controller import (
    get_all_bills_logic,
    pay_bill_logic,
    get_payment_history_logic,
    get_student_payment_history_logic,
    create_single_bill_logic,
    auto_generate_bills_api_logic,
    create_momo_payment_logic,
    momo_ipn_logic,
    momo_return_logic
)

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/bills', methods=['GET', 'OPTIONS'], strict_slashes=False)
@require_role('admin', 'staff')
def handle_get_bills():
    if request.method == 'OPTIONS': return jsonify({'status': 'ok'}), 200
    return get_all_bills_logic()

@payment_bp.route('/bills/<int:bill_id>/pay', methods=['POST', 'OPTIONS'], strict_slashes=False)
@require_role('admin', 'staff')
def handle_pay_bill(bill_id):
    if request.method == 'OPTIONS': return jsonify({'status': 'ok'}), 200
    return pay_bill_logic(bill_id)

@payment_bp.route('/history', methods=['GET', 'OPTIONS'], strict_slashes=False)
@require_role('admin', 'staff')
def handle_get_history():
    if request.method == 'OPTIONS': return jsonify({'status': 'ok'}), 200
    return get_payment_history_logic()

@payment_bp.route('/student/<int:student_id>', methods=['GET', 'OPTIONS'], strict_slashes=False)
def handle_get_student_history(student_id):
    if request.method == 'OPTIONS': return jsonify({'status': 'ok'}), 200
    return get_student_payment_history_logic(student_id)

@payment_bp.route('/create', methods=['POST', 'OPTIONS'], strict_slashes=False)
@require_role('admin', 'staff')
def handle_create_bill():
    if request.method == 'OPTIONS': return jsonify({'status': 'ok'}), 200
    return create_single_bill_logic()

@payment_bp.route('/auto-generate', methods=['POST', 'OPTIONS'], strict_slashes=False)
@require_role('admin', 'staff')
def handle_auto_generate():
    if request.method == 'OPTIONS': return jsonify({'status': 'ok'}), 200
    return auto_generate_bills_api_logic()

@payment_bp.route('/create_momo_payment', methods=['POST', 'OPTIONS'], strict_slashes=False)
def handle_create_momo():
    if request.method == 'OPTIONS': return jsonify({'status': 'ok'}), 200
    return create_momo_payment_logic()

@payment_bp.route('/momo_ipn', methods=['POST', 'OPTIONS'], strict_slashes=False)
def handle_momo_ipn():
    if request.method == 'OPTIONS': return jsonify({'status': 'ok'}), 200
    return momo_ipn_logic()

@payment_bp.route('/momo_return', methods=['GET', 'OPTIONS'], strict_slashes=False)
def handle_momo_return():
    if request.method == 'OPTIONS': return jsonify({'status': 'ok'}), 200
    return momo_return_logic()
