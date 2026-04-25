from flask import request, jsonify
from app.extensions import db
from app.models.rental_model import Contract, Bill, Payment
from app.models.auth_model import User
from app.models.room_model import Room
from datetime import datetime
from app.utils.scheduler import auto_generate_bills 
import traceback

import uuid
import hmac
import hashlib
import requests

MOMO_ENDPOINT = "https://test-payment.momo.vn/v2/gateway/api/create"
PARTNER_CODE = "MOMO" 
ACCESS_KEY = "F8BBA842ECF85"
SECRET_KEY = "K951B6PE1waDMi640xX08PD3vg6EkVlz"


def get_all_bills_logic():
    try:
        bills = Bill.query.order_by(
            db.case({ 'unpaid': 0 }, value=Bill.status, else_=1),
            Bill.due_date.desc()
        ).all()
        
        result = []
        for b in bills:
            contract = Contract.query.get(b.contract_id)
            student = User.query.get(contract.user_id) if contract else None
            room = Room.query.get(contract.room_id) if contract else None
            
            result.append({
                'bill_id': b.bill_id,
                'title': b.title,
                'student_name': getattr(student, 'full_name', 'Unknown') if student else "Unknown",
                'room_name': room.room_name if room else "Unknown",
                'amount': b.amount,
                'due_date': b.due_date.strftime('%Y-%m-%d'),
                'status': b.status
            })
        return jsonify(result), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def pay_bill_logic(bill_id):
    try:
        data = request.get_json()
        method = data.get('method', 'Cash')
        
        bill = Bill.query.get_or_404(bill_id)
        if bill.status == 'paid':
            return jsonify({'error': 'Already paid!'}), 400
            
        bill.status = 'paid'
        new_payment = Payment(
            bill_id=bill.bill_id,
            method=method,
            amount_paid=bill.amount,
            payment_date=datetime.utcnow()
        )
        db.session.add(new_payment)
        db.session.commit()
        return jsonify({'message': 'Success!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def get_payment_history_logic():
    try:
        payments = Payment.query.order_by(Payment.payment_date.desc()).all()
        result = []
        for p in payments:
            bill = Bill.query.get(p.bill_id)
            contract = Contract.query.get(bill.contract_id) if bill else None
            student = User.query.get(contract.user_id) if contract else None
            
            result.append({
                'payment_id': p.payment_id,
                'title': bill.title if bill else "Unknown",
                'student_name': getattr(student, 'full_name', 'Unknown') if student else "Unknown",
                'method': p.method,
                'amount_paid': p.amount_paid,
                'payment_date': p.payment_date.strftime('%Y-%m-%d %H:%M')
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_student_payment_history_logic(student_id):
    try:
        contracts = Contract.query.filter_by(user_id=student_id).all()
        contract_ids = [contract.contract_id for contract in contracts]
        if not contract_ids:
            return jsonify([]), 200

        bills = Bill.query.filter(Bill.contract_id.in_(contract_ids)).order_by(Bill.due_date.desc()).all()
        result = []
        for bill in bills:
            payment = Payment.query.filter_by(bill_id=bill.bill_id).order_by(Payment.payment_date.desc()).first()
            contract = Contract.query.get(bill.contract_id)
            room = Room.query.get(contract.room_id) if contract else None

            result.append({
                'bill_id': bill.bill_id,
                'title': bill.title,
                'room_name': room.room_name if room else 'Unknown',
                'amount': bill.amount,
                'due_date': bill.due_date.strftime('%Y-%m-%d') if bill.due_date else '',
                'status': bill.status,
                'payment_method': payment.method if payment else '',
                'payment_date': payment.payment_date.strftime('%Y-%m-%d %H:%M') if payment and payment.payment_date else '',
                'amount_paid': payment.amount_paid if payment else 0
            })

        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_single_bill_logic():
    try:
        data = request.get_json()
        due_date = datetime.strptime(data.get('due_date'), '%Y-%m-%d').date()
        new_bill = Bill(
            contract_id=data.get('contract_id'),
            title=data.get('title'),
            amount=data.get('amount'),
            due_date=due_date,
            status='unpaid'
        )
        db.session.add(new_bill)
        db.session.commit()
        return jsonify({'message': 'Bill created successfully!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

def auto_generate_bills_api_logic():
    try:
        count = auto_generate_bills()
        return jsonify({'message': f'Successfully mass-issued {count} bills!'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def create_momo_payment_logic():
    try:
        data = request.get_json()
        bill_id = data.get('bill_id')
        if not bill_id:
            return jsonify({"error": "Missing bill ID"}), 400
        
        bill = Bill.query.get_or_404(bill_id)
        if bill.status == 'paid':
            return jsonify({"error": "Bill already paid"}), 400
            
        amount_int = int(bill.amount)
        amount_str = str(amount_int)
        
        order_info = f"Dormitory Payment for Bill {bill_id}"
        order_id = f"{bill_id}_{str(uuid.uuid4())[:8]}"
        request_id = str(uuid.uuid4())
        
        redirect_url = "http://localhost:5173/student/dashboard" 
        ipn_url = "https://momo.vn" 
        extra_data = "" 
        
        request_type = "payWithCC" 

        raw_signature = (
            f"accessKey={ACCESS_KEY}&"
            f"amount={amount_str}&"
            f"extraData={extra_data}&"
            f"ipnUrl={ipn_url}&"
            f"orderId={order_id}&"
            f"orderInfo={order_info}&"
            f"partnerCode={PARTNER_CODE}&"
            f"redirectUrl={redirect_url}&"
            f"requestId={request_id}&"
            f"requestType={request_type}"
        )
        
        signature = hmac.new(
            SECRET_KEY.encode('utf-8'), 
            raw_signature.encode('utf-8'), 
            hashlib.sha256
        ).hexdigest()

        request_data = {
            "partnerCode": PARTNER_CODE,
            "partnerName": "DormHub",
            "storeId": "DormHub_KTX",
            "requestId": request_id,
            "amount": amount_int,
            "orderId": order_id,
            "orderInfo": order_info,
            "redirectUrl": redirect_url,
            "ipnUrl": ipn_url,
            "lang": "vi",
            "extraData": extra_data,
            "requestType": request_type,
            "signature": signature
        }

        response = requests.post(MOMO_ENDPOINT, json=request_data)
        res_data = response.json()

        if res_data.get('resultCode') == 0:
            return jsonify({"payUrl": res_data.get('payUrl')}), 200
        else:
            print("❌ MoMo Error Detail:", res_data)
            return jsonify({"error": res_data.get('message')}), 400

    except Exception as e:
        print("❌ MOMO LINK GENERATION ERROR: ", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

def momo_ipn_logic():
    try:
        data = request.get_json()
        print("🔔 MOMO NOTIFICATION: ", data)
        
        if data.get('resultCode') == 0:
            order_id = data.get('orderId')
            bill_id = int(order_id.split('_')[0])
            amount_paid = float(data.get('amount'))

            bill = Bill.query.get(bill_id)
            if bill and bill.status != 'paid':
                bill.status = 'paid'
                
                new_payment = Payment(
                    bill_id=bill.bill_id,
                    method='MoMo Sandbox',
                    amount_paid=amount_paid,
                    payment_date=datetime.utcnow()
                )
                db.session.add(new_payment)
                db.session.commit()
                print(f"✅ AUTO-PAID FOR BILL {bill_id}")

        return '', 204
    except Exception as e:
        db.session.rollback()
        print("IPN ERROR: ", str(e))
        return jsonify({"error": str(e)}), 500

def momo_return_logic():
    try:
        order_id = request.args.get('orderId')
        result_code = request.args.get('resultCode')

        if result_code == '0':
            bill_id = int(order_id.split('_')[0])
            bill = Bill.query.get(bill_id)
            
            if bill and bill.status != 'paid':
                bill.status = 'paid' 
                
                new_payment = Payment(
                    bill_id=bill.bill_id,
                    method='Bank Transfer (MoMo)', 
                    amount_paid=bill.amount,
                    payment_date=datetime.utcnow()
                )
                db.session.add(new_payment)
                db.session.commit()
                return jsonify({"message": "Payment updated successfully!"}), 200
            
            return jsonify({"message": "Bill has already been processed."}), 200
        else:
            return jsonify({"error": "Transaction failed or cancelled"}), 400
            
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
