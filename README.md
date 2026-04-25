# 🏢 DormHub - Comprehensive Dormitory Management System

**DormHub** is a modern dormitory management platform designed to streamline and optimize the administration of rooms, students, staff, and billing processes. This project focuses on efficiency, security, and a seamless user experience.

---

## 🌊 Development Methodology: Waterfall Model

This project was developed following the **Waterfall** software development life cycle, ensuring a structured and comprehensive approach through each phase:

1.  **Requirements Analysis:** Documented all necessary functionalities for a robust dormitory management system.
2.  **System Design:** Crafted Use Case diagrams, Entity Relationship Diagrams (ERD), and a Decoupled Architecture separating the React frontend from the Flask backend.
3.  **Implementation:** Developed the functional modules using the Python Flask and ReactJS tech stack.
4.  **Testing:** Verified API stability, JWT authentication flows, and MoMo payment integration.
5.  **Deployment & Maintenance:** Launched the system for practical use and finalized the codebase for the graduation defense.



[Image of waterfall model stages]


---

## 🚀 Tech Stack

The system utilizes a **Decoupled Architecture** to ensure high performance and scalability:

* **Frontend:** ReactJS, Material-UI (MUI), and Axios for API communication.
* **Backend:** Python Flask, Flask-SQLAlchemy (ORM), and Flask-JWT-Extended for security.
* **Database:** PostgreSQL for reliable relational data management.
* **Integration:** MoMo Payment Gateway (Sandbox) for digital transactions.

---

## ✨ Key Features

* **Room Management:** Full CRUD (Create, Read, Update, Delete) operations for rooms, including capacity tracking and maintenance status.
* **Student Management:** Comprehensive profiles including contact details, student IDs, and digital wallet balance monitoring.
* **Staff Management:** Role-based access control (RBAC) ensuring only authorized Admin or Staff can access specific modules.
* **Contracts & Notifications:** Automated dormitory contract generation and a real-time notification system for operational updates.
* **Security:** Robust user authentication via JWT Tokens, secure password hashing, and protected API routes.

---

## 👨‍💻 Developer
* **NGUYE NHAT HAO** - IT Student at **University of Greenwich**.
* **Role:** Full Stack Developer.

---

## ⚙️ Installation Guide

### 1. Backend Setup (Flask)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Executed on macOS/MacBook Pro
pip install -r requirements.txt
python3 run.py