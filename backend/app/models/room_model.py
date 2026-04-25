from app.extensions import db

class Room(db.Model):
    __tablename__ = 'rooms'
    
    room_id = db.Column(db.Integer, primary_key=True)
    room_name = db.Column(db.String(50), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='vacant')
    gender_type = db.Column(db.String(10), nullable=False, default='male')
    description = db.Column(db.Text)
    
    image_url = db.Column(db.String(255), nullable=True)

    contracts = db.relationship('Contract', backref='room', lazy=True)
    devices = db.relationship('Device', backref='room', lazy=True)
    rental_requests = db.relationship('RentalRequest', backref='target_room', lazy=True)

class Device(db.Model):
    __tablename__ = 'devices'
    
    devices_id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.room_id'), nullable=False)
    devices_name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), default='good')
    purchase_date = db.Column(db.Date)
    
   
    image_url = db.Column(db.String(255), nullable=True)
    

    maintenance_histories = db.relationship('MaintenanceHistory', backref='device', lazy=True)
