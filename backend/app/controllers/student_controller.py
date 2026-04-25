from flask import request, jsonify
from app.extensions import db
from app.models.auth_model import User
from app.models.rental_model import Contract, Payment, Bill, RentalRequest 
from app.models.room_model import Room, Device 
from werkzeug.security import generate_password_hash
import traceback
from datetime import datetime
from app.models.event_model import Event

VALID_GENDERS = {'male', 'female'}

def normalize_gender(value, default='male'):
    normalized = str(value or default).strip().lower()
    return normalized if normalized in VALID_GENDERS else default

# 1. READ: Get student list
def get_all_students_logic():
    try:
        # Get all users with 'student' role
        students = User.query.filter_by(role='student').all()
        result = []
        
        for student in students:
            # Auto-fetch ID
            s_id = getattr(student, 'id', getattr(student, 'user_id', None))
            
            # Find active contract for this student
            contract = Contract.query.filter_by(user_id=s_id, status='active').first()
            room_name = "Unassigned"
            
            if contract:
                room = Room.query.get(contract.room_id)
                if room:
                    room_name = room.room_name

            result.append({
                "user_id": s_id,
                "username": student.username,
                "full_name": getattr(student, 'full_name', student.username),
                "email": student.email,
                "phone": getattr(student, 'phone', '') or '',
                "student_code": getattr(student, 'student_code', '') or '',
                "gender": normalize_gender(getattr(student, 'gender', 'male')),
                "balance": float(getattr(student, 'balance', 0)),
                "room": room_name,
                "status": "active" if contract else "pending"
            })
        return jsonify(result), 200
    except Exception as e:
        print("--- BACKEND ERROR GET STUDENTS ---")
        traceback.print_exc()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

# 2. CREATE: Add new student
def create_student_logic():
    try:
        data = request.json
        if not data.get('username') or not data.get('email'):
            return jsonify({"error": "Missing username or email"}), 400

        # Check Duplicate Username
        if User.query.filter_by(username=data['username']).first():
            return jsonify({"error": "This username already exists!"}), 400

        # Check Duplicate Email
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"error": f"Email address '{data['email']}' is already in use!"}), 400
        student_code = data.get('student_code') or None
        if student_code and User.query.filter_by(student_code=student_code).first():
            return jsonify({"error": "This student ID already exists!"}), 400

        hashed_pw = generate_password_hash(data.get('password') or '123456')
        
        # Create new User object
        new_student = User(
            username=data['username'],
            email=data['email'],
            password=hashed_pw,
            role='student',
            full_name=data.get('full_name') or data.get('username'),
            phone=data.get('phone', ''),
            student_code=student_code,
            gender=normalize_gender(data.get('gender'))
        )
        
        if hasattr(new_student, 'balance'): new_student.balance = 0.0

        db.session.add(new_student)
        db.session.commit()
        return jsonify({"message": "Student added successfully!"}), 201
    except Exception as e:
        db.session.rollback()
        print("--- BACKEND ERROR CREATE STUDENT ---")
        traceback.print_exc()
        return jsonify({"error": f"Creation error: {str(e)}"}), 400

# 3. UPDATE: Update student information
def update_student_logic(user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.json
        
        # Check duplicate email if changing email
        if 'email' in data and data['email'] != user.email:
            existing_email = User.query.filter_by(email=data['email']).first()
            if existing_email:
                return jsonify({"error": "This email address is already used by another user!"}), 400
            user.email = data['email']

        incoming_student_code = data.get('student_code') or None
        if 'student_code' in data and incoming_student_code != getattr(user, 'student_code', None):
            existing_code = User.query.filter_by(student_code=incoming_student_code).first() if incoming_student_code else None
            if existing_code:
                return jsonify({"error": "This student ID is already used by another student!"}), 400

        if 'full_name' in data: user.full_name = data['full_name']
        if 'phone' in data: user.phone = data['phone']
        if 'student_code' in data: user.student_code = incoming_student_code
        if 'gender' in data: user.gender = normalize_gender(data.get('gender'), getattr(user, 'gender', 'male'))
        
        db.session.commit()
        return jsonify({"message": "Updated successfully!"}), 200
    except Exception as e:
        db.session.rollback()
        print("--- BACKEND ERROR UPDATE STUDENT ---")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400

# 4. DELETE: Remove student
def delete_student_logic(user_id):
    try:
        user = User.query.get_or_404(user_id)
        # Block deletion if student has an active contract
        active_c = Contract.query.filter_by(user_id=user_id, status='active').first()
        if active_c:
            return jsonify({"error": "Cannot delete a student currently residing in a room!"}), 400

        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Deleted successfully!"}), 200
    except Exception as e:
        db.session.rollback()
        print("--- BACKEND ERROR DELETE STUDENT ---")
        traceback.print_exc()
        return jsonify({"error": "Cannot delete due to data constraints"}), 400


# Đừng quên thêm import model Event ở đầu file:
# from app.models.event_model import Event
# =========================================================
# GET DASHBOARD DATA FOR STUDENT (CONNECTED TO REAL EVENTS)
# =========================================================
def get_student_dashboard_logic(student_id):
    try:
        student = User.query.get(student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        contract = Contract.query.filter_by(user_id=student_id, status='active').first()
        has_room = bool(contract)
        
        pending_request = RentalRequest.query.filter_by(user_id=student_id, status='pending').first()
        has_pending_request = bool(pending_request)

        student_gender = normalize_gender(getattr(student, 'gender', 'male'))
        room_info = {"name": "No room assigned", "type": "N/A", "endDate": "N/A"}
        billing_info = {"id": None, "status": "paid", "amount": 0, "dueDate": "", "month": "", "title": ""}
        available_rooms_data = []

        if has_room:
            if contract.room:
                room_info = {
                    "name": contract.room.room_name,
                    "type": f"{contract.room.capacity}-person room",
                    "endDate": contract.end_date.strftime('%d/%m/%Y') if contract.end_date else "N/A"
                }
            
            unpaid_bill = Bill.query.join(Contract).filter(
                Contract.user_id == student_id, 
                Bill.status == 'unpaid'
            ).first()
            
            if unpaid_bill:
                b_date = unpaid_bill.due_date
                billing_info = {
                    "id": unpaid_bill.bill_id,
                    "status": "unpaid",
                    "amount": unpaid_bill.amount,
                    "dueDate": b_date.strftime('%d/%m/%Y') if b_date else "N/A",
                    "month": f"Month {b_date.month if b_date else datetime.now().month}",
                    "title": unpaid_bill.title
                }
        elif not has_pending_request:
            available_rooms = Room.query.filter(Room.status.in_(['Trống', 'available', 'trống', 'vacant', 'Vacant'])).all()
            available_rooms = [
                room for room in available_rooms
                if normalize_gender(getattr(room, 'gender_type', 'male')) == student_gender
            ]

            for r in available_rooms:
                current_tenants = Contract.query.filter_by(room_id=r.room_id, status='active').count() 
                amenities_list = [d.devices_name for d in r.devices] if hasattr(r, 'devices') and r.devices else []
                
                available_rooms_data.append({
                    "id": r.room_id,
                    "name": r.room_name,
                    "capacity": r.capacity,
                    "current_tenants": current_tenants,
                    "price": getattr(r, 'price', 1500000), 
                    "gender_type": normalize_gender(getattr(r, 'gender_type', 'male')),
                    "image_url": getattr(r, 'image_url', None), 
                    "amenities": amenities_list
                })

       
        recent_events = Event.query.order_by(Event.event_id.desc()).limit(3).all()
        events_data = []
        for e in recent_events:
            
            # ĐỊNH DẠNG NGÀY THÁNG AN TOÀN CHỐNG CRASH 500
            date_formatted = "N/A"
            if e.event_date:
                if hasattr(e.event_date, 'strftime'):
                    # Nếu đã là chuẩn Date Object
                    date_formatted = e.event_date.strftime('%d/%m/%Y')
                else:
                    # Đề phòng dữ liệu cũ bị kẹt dưới dạng String
                    try:
                        clean_date = str(e.event_date).split('T')[0]
                        date_obj = datetime.strptime(clean_date, '%Y-%m-%d')
                        date_formatted = date_obj.strftime('%d/%m/%Y')
                    except Exception:
                        date_formatted = str(e.event_date)

            events_data.append({
                "id": e.event_id,
                "title": e.title,
                "description": e.description,
                "type": e.type,
                "date": date_formatted
            })

        return jsonify({
            'studentName': getattr(student, 'full_name', student.username) or student.username,
            'studentGender': student_gender,
            'hasRoom': has_room,                         
            'hasPendingRequest': has_pending_request,    
            'availableRooms': available_rooms_data,      
            'room': room_info,
            'billing': billing_info,
            'maintenance': { "title": "Routine maintenance", "status": "Processing", "date": "Yesterday" },
            'events': events_data  # <--- TRUYỀN DỮ LIỆU BẢNG TIN THẬT RA FRONTEND
        }), 200

    except Exception as e:
        print("--- BACKEND ERROR GET STUDENT DASHBOARD ---")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def request_room_logic():
    try:
        data = request.json
        user_id = data.get('user_id')
        room_id = data.get('room_id')
        
        if not user_id or not room_id:
            return jsonify({'error': 'Missing user or room information'}), 400

        student = User.query.get(user_id)
        room = Room.query.get(room_id)
        if not student or not room:
            return jsonify({'error': 'Student or room not found'}), 404

        student_gender = normalize_gender(getattr(student, 'gender', 'male'))
        room_gender = normalize_gender(getattr(room, 'gender_type', 'male'))
        if student_gender != room_gender:
            return jsonify({'error': 'This student can only request rooms that match their gender.'}), 400

        current_tenants = Contract.query.filter_by(room_id=room.room_id, status='active').count()
        if current_tenants >= room.capacity:
            return jsonify({'error': 'This room is already full.'}), 400

        active_contract = Contract.query.filter_by(user_id=user_id, status='active').first()
        if active_contract:
            return jsonify({'error': 'This student already has an active room.'}), 400

        # Check for existing pending requests
        exist = RentalRequest.query.filter_by(user_id=user_id, status='pending').first()
        if exist:
            return jsonify({'error': 'You already have a pending request!'}), 400
            
        new_request = RentalRequest(user_id=user_id, room_id=room_id, status='pending')
        db.session.add(new_request)
        db.session.commit()
        
        return jsonify({'message': 'Room rental request submitted successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        print("--- BACKEND ERROR REQUEST ROOM ---")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# =========================================================
# GET ROOM DETAILS FOR "MY ROOM" PAGE
# =========================================================
def get_my_room_details_logic(student_id):
    try:
        
        contract = Contract.query.filter_by(user_id=student_id, status='active').first()
        if not contract:
            return jsonify({'error': 'You currently do not have a room.'}), 404

        room = Room.query.get(contract.room_id)
        if not room:
            return jsonify({'error': 'Room information not found.'}), 404
            
        
        active_contracts = Contract.query.filter_by(room_id=room.room_id, status='active').all()
        roommates = []
        for c in active_contracts:
            user = User.query.get(c.user_id)
            if user:
                u_id = getattr(user, 'id', getattr(user, 'user_id', None))
                roommates.append({
                    "id": u_id,
                    "name": getattr(user, 'full_name', user.username) or user.username,
                    "email": getattr(user, 'email', 'Not updated'),
                    "phone": getattr(user, 'phone', 'Not updated'),
                    "is_me": str(u_id) == str(student_id)
                })
       
        devices_data = []
        if hasattr(room, 'devices') and room.devices:
            for d in room.devices:
                devices_data.append({
                    "id": d.devices_id,
                    "name": d.devices_name,
                    "status": getattr(d, 'status', 'good'),
                    "purchase_date": d.purchase_date.strftime('%d/%m/%Y') if getattr(d, 'purchase_date', None) else "N/A"
                })

       
        return jsonify({
            "room_info": {
                "id": room.room_id,
                "name": room.room_name,
                "capacity": room.capacity,
                "current_tenants": len(roommates),
                "price": room.price,
                "gender_type": normalize_gender(getattr(room, 'gender_type', 'male')),
                "image_url": getattr(room, 'image_url', None)
            },
            "contract_info": {
                "contract_id": contract.contract_id,
                "start_date": contract.start_date.strftime('%d/%m/%Y') if contract.start_date else "N/A",
                "end_date": contract.end_date.strftime('%d/%m/%Y') if contract.end_date else "N/A",
                "deposit": float(contract.deposit_amount) if contract.deposit_amount else 0
            },
            "roommates": roommates,
            "devices": devices_data
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========================================================
# GET STUDENT MAINTENANCE HISTORY
# =========================================================
def get_maintenance_history_logic(student_id):
    try:
        from app.models.rental_model import MaintenanceHistory

        # Get maintenance requests for this student
        histories = MaintenanceHistory.query.filter_by(user_id=student_id).all()
        result = []
        
        for h in histories:
            # Find device name based on devices_id
            device = Device.query.get(h.devices_id) if h.devices_id else None
            
            # Format date from date_maintenance
            date_str = "Today"
            if h.date_maintenance:
                date_str = h.date_maintenance.strftime('%d/%m/%Y')
                
            result.append({
                "id": h.maintenance_id,
                "device_name": device.devices_name if device else "Unknown device",
                "description": h.note if h.note else "No description provided",
                "status": h.devices_status if h.devices_status else "pending",
                "date": date_str
            })
            
        result.reverse() # Show latest reports first
        return jsonify(result), 200
    except Exception as e:
        print("--- BACKEND ERROR GET MAINTENANCE HISTORY ---")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# =========================================================
# CREATE MAINTENANCE REQUEST
# =========================================================
def create_maintenance_request_logic():
    try:
        data = request.json
        student_id = data.get('student_id')
        device_id = data.get('device_id')
        description = data.get('description')

        if not student_id or not device_id or not description:
            return jsonify({'error': 'Missing required information!'}), 400

        from app.models.rental_model import MaintenanceHistory
            
        # Assign correctly to MaintenanceHistory Model columns
        new_report = MaintenanceHistory(
            user_id=student_id,
            devices_id=device_id,     
            note=description,         
            devices_status='pending'  
        )

        db.session.add(new_report)
        
        # Change device status to "broken"
        device = Device.query.get(device_id)
        if device:
            device.status = 'broken'

        db.session.commit()
        return jsonify({'message': 'Maintenance request submitted successfully!'}), 201
    except Exception as e:
        db.session.rollback()
        print("--- BACKEND ERROR CREATE MAINTENANCE ---")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
