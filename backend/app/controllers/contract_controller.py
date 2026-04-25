from flask import request, jsonify
from app.extensions import db
from app.models.rental_model import Contract, RentalRequest
from app.models.auth_model import User 
from app.models.room_model import Room
from datetime import datetime
import traceback

VALID_GENDERS = {'male', 'female'}

def normalize_gender(value, default='male'):
    normalized = str(value or default).strip().lower()
    return normalized if normalized in VALID_GENDERS else default

# ==========================================
# PART 1: RENTAL REQUESTS MANAGEMENT
# ==========================================

def get_all_requests_logic():
    try:
        requests = RentalRequest.query.order_by(
            db.case({ 'pending': 0 }, value=RentalRequest.status, else_=1),
            RentalRequest.created_at.desc()
        ).all()
        
        result = []
        for req in requests:
            student = User.query.get(req.user_id)
            room = Room.query.get(req.room_id)
            result.append({
                'request_id': req.request_id,
                'user_id': req.user_id,
                'student_name': student.full_name or student.username if student else "Unknown",
                'student_gender': normalize_gender(getattr(student, 'gender', 'male')) if student else 'male',
                'room_id': req.room_id,
                'room_name': room.room_name if room else "Unknown",
                'room_gender_type': normalize_gender(getattr(room, 'gender_type', 'male')) if room else 'male',
                'created_at': req.created_at.strftime('%Y-%m-%d %H:%M') if req.created_at else "",
                'status': req.status
            })
        return jsonify(result), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def create_request_logic():
    try:
        data = request.get_json()
        
        existing_req = RentalRequest.query.filter_by(user_id=data['user_id'], room_id=data['room_id'], status='pending').first()
        if existing_req:
            return jsonify({'error': 'You have already submitted a request for this room. Please wait for approval!'}), 400
            
        new_req = RentalRequest(
            user_id=data['user_id'],
            room_id=data['room_id']
        )
        db.session.add(new_req)
        db.session.commit()
        return jsonify({'message': 'Room rental request submitted successfully!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

def process_request_logic(request_id):
    try:
        data = request.get_json()
        action = data.get('action') 
        
        req = RentalRequest.query.get_or_404(request_id)
        
        if req.status != 'pending':
            return jsonify({'error': 'This request has already been processed!'}), 400
            
        if action == 'reject':
            req.status = 'rejected'
            db.session.commit()
            return jsonify({'message': 'Room rental request rejected!'}), 200
            
        elif action == 'approve':
            # CHECK ROOM CAPACITY BEFORE APPROVING
            room = Room.query.get(req.room_id)
            if not room:
                return jsonify({'error': 'Room does not exist!'}), 404

            student = User.query.get(req.user_id)
            if not student:
                return jsonify({'error': 'Student does not exist!'}), 404

            if normalize_gender(getattr(student, 'gender', 'male')) != normalize_gender(getattr(room, 'gender_type', 'male')):
                return jsonify({'error': 'Student gender does not match this room type!'}), 400

            active_contract = Contract.query.filter_by(user_id=req.user_id, status='active').first()
            if active_contract:
                return jsonify({'error': 'This student already has an active contract!'}), 400
                
            current_occupancy = Contract.query.filter_by(room_id=room.room_id, status='active').count()
            if current_occupancy >= room.capacity:
                return jsonify({'error': f'Room {room.room_name} is full ({current_occupancy}/{room.capacity}), cannot approve more requests!'}), 400

            # APPROVE AND CREATE CONTRACT IF CAPACITY ALLOWS
            req.status = 'approved'
            start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
            end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()
            
            new_contract = Contract(
                user_id=req.user_id,
                room_id=req.room_id,
                start_date=start_date,
                end_date=end_date,
                deposit_amount=data.get('deposit_amount', 0),
                status='active'
            )
            db.session.add(new_contract)
            db.session.commit()
            
            return jsonify({'message': 'Request approved and Contract created successfully!'}), 200
            
        return jsonify({'error': 'Invalid action!'}), 400
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 400


# ==========================================
# PART 2: CONTRACTS MANAGEMENT
# ==========================================

def get_all_contracts_logic():
    try:
        contracts = Contract.query.order_by(Contract.start_date.desc()).all()
        result = []
        for c in contracts:
            student = User.query.get(c.user_id)
            room = Room.query.get(c.room_id)
            result.append({
                'contract_id': c.contract_id,
                'user_id': c.user_id,
                'student_name': student.full_name or student.username if student else "Unknown",
                'student_gender': normalize_gender(getattr(student, 'gender', 'male')) if student else 'male',
                'room_id': c.room_id,
                'room_name': room.room_name if room else "Unknown",
                'room_gender_type': normalize_gender(getattr(room, 'gender_type', 'male')) if room else 'male',
                'start_date': c.start_date.strftime('%Y-%m-%d') if c.start_date else "",
                'end_date': c.end_date.strftime('%Y-%m-%d') if c.end_date else "",
                'deposit_amount': float(c.deposit_amount) if c.deposit_amount else 0,
                'status': c.status
            })
        return jsonify(result), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
