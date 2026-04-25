import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import RoomManagement from './pages/admin/RoomManagement';
import Maintenance from './pages/admin/Maintenance';
import ContractManagement from './pages/admin/ContractManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import EventManagement from './pages/admin/EventManagement';
import Settings from './pages/admin/Settings';
import StaffManagement from './pages/staff/StaffManagement';
import StudentLayout from './layouts/StudentLayout'; 
import StudentDashboard from './pages/student/StudentDashboard'; 
import StudentMaintenance from './pages/student/StudentMaintenance';
import MyRoom from './pages/student/MyRoom'; 
import Login from './pages/auth/Login';
import StudentEvents from './pages/student/StudentEvents';
import StudentPayments from './pages/student/StudentPayments';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || 'student';

  if (!token) return <Navigate to="/login" replace />;
  
 
  if (allowedRoles && !allowedRoles.includes(role)) {
    
    const adminGroup = ['admin', 'staff'];

    if (adminGroup.includes(role)) {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/student/dashboard" replace />;
    }
  }
  
  return children;
};

function App() {
  return (
    <>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" />} />
          
          {}
          {}
          {}
          {}
          {}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<StudentManagement />} /> 
            <Route path="rooms" element={<RoomManagement />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="contracts" element={<ContractManagement />} />
            <Route path="payments" element={<PaymentManagement />} />
            <Route path="events" element={<EventManagement />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="settings" element={<Settings />} />
            
          </Route>

          {}
          {}
          {}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="room" element={<MyRoom />} />
            <Route path="maintenance" element={<StudentMaintenance />} />
            <Route path="payments" element={<StudentPayments />} />
            <Route path="events" element={<StudentEvents />} />
          </Route>

        </Routes>
      </Router>
    </>
  );
}

export default App;
