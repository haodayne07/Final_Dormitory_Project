from app.extensions import db
from datetime import datetime

ROLE_STUDENT = 'student'
ROLE_ADMIN = 'admin'
ROLE_STAFF = 'staff'

class User(db.Model):
    __tablename__ = 'users'
    
    # Các trường cơ bản và xác thực
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    role = db.Column(db.String(20), nullable=False, default=ROLE_STUDENT)
    
    # Các trường thông tin thêm
    full_name = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    student_code = db.Column(db.String(20), unique=True, nullable=True)
    gender = db.Column(db.String(10), nullable=False, default='male')
    
    # Các trường tài chính và hệ thống
    balance = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships (Quan hệ)
    contracts = db.relationship('Contract', backref='student', lazy=True, foreign_keys='Contract.user_id')
    rental_requests = db.relationship('RentalRequest', backref='requester', lazy=True, foreign_keys='RentalRequest.user_id')
    maintenance_histories = db.relationship('MaintenanceHistory', backref='reporter', lazy=True, foreign_keys='MaintenanceHistory.user_id')
