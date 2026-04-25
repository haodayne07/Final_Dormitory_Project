import os
from flask import request, jsonify
from werkzeug.utils import secure_filename
from app.models.room_model import Room, Device
from app.extensions import db
from datetime import datetime
import traceback

VALID_ROOM_GENDERS = {'male', 'female'}

def normalize_room_gender(value, default='male'):
    normalized = str(value or default).strip().lower()
    return normalized if normalized in VALID_ROOM_GENDERS else default

# Configure upload folders for rooms and devices
UPLOAD_FOLDER = 'static/uploads/rooms'
DEVICE_UPLOAD_FOLDER = 'static/uploads/devices'
os.makedirs(UPLOAD_FOLDER, exist_ok=True) 
os.makedirs(DEVICE_UPLOAD_FOLDER, exist_ok=True) 

# ==========================================
# PART 1: DEVICE MANAGEMENT (FULL CRUD + IMAGE UPLOAD)
# ==========================================

# 1. GET ALL: Fetch all devices
def get_all_devices_logic():
    try:
        devices = Device.query.all()
        result = []
        for d in devices:
            # Get room name from relationship
            room_name = d.room.room_name if d.room else "Unknown"
            result.append({
                'devices_id': d.devices_id,
                'room_id': d.room_id,
                'room_name': room_name,
                'devices_name': d.devices_name,
                'status': d.status,
                'purchase_date': d.purchase_date.strftime('%Y-%m-%d') if d.purchase_date else "",
                'image_url': getattr(d, 'image_url', "") or ""
            })
        return jsonify(result), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# 2. CREATE: Add a device (Supports Form Data and Image File)
def add_device_logic():
    try:
        data = request.form
        
        # Process device image upload
        image_url = ""
        if 'image' in request.files:
            file = request.files['image']
            if file.filename != '':
                filename = secure_filename(file.filename)
                unique_filename = f"dev_{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                filepath = os.path.join(DEVICE_UPLOAD_FOLDER, unique_filename)
                file.save(filepath)
                image_url = f"/{filepath}"

        # Process date
        p_date = None
        if data.get('purchase_date'):
            p_date = datetime.strptime(data.get('purchase_date'), '%Y-%m-%d').date()

        new_device = Device(
            room_id=data.get('room_id'),
            devices_name=data.get('devices_name'),
            status=data.get('status', 'good'),
            purchase_date=p_date,
            image_url=image_url
        )
        db.session.add(new_device)
        db.session.commit()
        return jsonify({'message': 'Device added successfully!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# 3. UPDATE FULL: Update device information & image
def update_device_logic(device_id):
    try:
        device = Device.query.get_or_404(device_id)
        data = request.form

        if 'room_id' in data: device.room_id = data.get('room_id')
        if 'devices_name' in data: device.devices_name = data.get('devices_name')
        if 'status' in data: device.status = data.get('status')
        
        if data.get('purchase_date'):
            device.purchase_date = datetime.strptime(data.get('purchase_date'), '%Y-%m-%d').date()

        # Process new image upload
        if 'image' in request.files:
            file = request.files['image']
            if file.filename != '':
                filename = secure_filename(file.filename)
                unique_filename = f"dev_{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                filepath = os.path.join(DEVICE_UPLOAD_FOLDER, unique_filename)
                file.save(filepath)
                device.image_url = f"/{filepath}"

        db.session.commit()
        return jsonify({'message': 'Device updated successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# 4. DELETE: Remove a device
def delete_device_logic(device_id):
    try:
        device = Device.query.get_or_404(device_id)
        db.session.delete(device)
        db.session.commit()
        return jsonify({'message': 'Device deleted successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# 5. Quick Update Device Status (JSON payload)
def update_device_status_logic(device_id):
    data = request.get_json()
    device = Device.query.get_or_404(device_id)
    device.status = data.get('status', device.status)
    db.session.commit()
    return jsonify({'message': 'Device status updated successfully!'}), 200


# ==========================================
# PART 2: ROOM MANAGEMENT
# ==========================================
def get_all_rooms_logic():
    try:
        rooms = Room.query.all()
        result = []
        for r in rooms:
            current_occupancy = sum(1 for c in r.contracts if c.status == 'active') if hasattr(r, 'contracts') else 0
            result.append({
                'room_id': r.room_id,
                'room_name': r.room_name,
                'capacity': r.capacity,
                'current_occupancy': current_occupancy,
                'price': float(r.price),
                'status': r.status,
                'gender_type': normalize_room_gender(getattr(r, 'gender_type', 'male')),
                'description': r.description or "",
                'image_url': getattr(r, 'image_url', "") or "" 
            })
        return jsonify(result), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def add_room_logic():
    try:
        data = request.form 
        
        if Room.query.filter_by(room_name=data.get('room_name')).first():
            return jsonify({'error': f"Room name '{data.get('room_name')}' already exists!"}), 400
            
        image_url = ""
        if 'image' in request.files:
            file = request.files['image']
            if file.filename != '':
                filename = secure_filename(file.filename)
                unique_filename = f"room_{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
                file.save(filepath)
                image_url = f"/{filepath}" 
                
        new_room = Room(
            room_name=data.get('room_name'),
            capacity=data.get('capacity'),
            price=data.get('price'),
            status=data.get('status', 'vacant'),
            gender_type=normalize_room_gender(data.get('gender_type')),
            description=data.get('description', ''),
            image_url=image_url
        )
        db.session.add(new_room)
        db.session.commit()
        return jsonify({'message': 'Room added successfully!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

def update_room_logic(room_id):
    try:
        room = Room.query.get_or_404(room_id)
        data = request.form
        
        if 'room_name' in data and data.get('room_name') != room.room_name:
            if Room.query.filter_by(room_name=data.get('room_name')).first():
                return jsonify({'error': f"Room name '{data.get('room_name')}' is already in use!"}), 400
            room.room_name = data.get('room_name')
            
        if 'capacity' in data: room.capacity = data.get('capacity')
        if 'price' in data: room.price = data.get('price')
        if 'status' in data: room.status = data.get('status')
        if 'gender_type' in data: room.gender_type = normalize_room_gender(data.get('gender_type'), getattr(room, 'gender_type', 'male'))
        if 'description' in data: room.description = data.get('description')
        
        if 'image' in request.files:
            file = request.files['image']
            if file.filename != '':
                filename = secure_filename(file.filename)
                unique_filename = f"room_{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
                file.save(filepath)
                room.image_url = f"/{filepath}"
        
        db.session.commit()
        return jsonify({'message': 'Room updated successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

def delete_room_logic(room_id):
    try:
        room = Room.query.get_or_404(room_id)
        active_contracts = [c for c in room.contracts if c.status == 'active'] if hasattr(room, 'contracts') else []
        if len(active_contracts) > 0:
            return jsonify({'error': 'Cannot delete a room with active residents!'}), 400
            
        db.session.delete(room)
        db.session.commit()
        return jsonify({'message': 'Room deleted successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Cannot delete room due to existing devices or related data!'}), 400

# ==========================================
# PART 3: OTHER APIs
# ==========================================
def get_vacant_rooms_logic():
    rooms = Room.query.filter_by(status='vacant').all()
    return jsonify([{
        'id': r.room_id,
        'name': r.room_name,
        'gender_type': normalize_room_gender(getattr(r, 'gender_type', 'male'))
    } for r in rooms]), 200

def get_room_details_logic(id):
    room = Room.query.get_or_404(id)
    return jsonify({'name': room.room_name, 'status': room.status}), 200
