import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Avatar, Stack, Button,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Tooltip, InputAdornment, 
  Pagination, PaginationItem, MenuItem
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import { CiEdit, CiTrash } from "react-icons/ci";
import axios from 'axios';
import { showToast, showConfirm, showAlert } from '../../utils/swal';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [formData, setFormData] = useState({ 
    user_id: '', username: '', email: '', password: '', 
    full_name: '', phone: '', student_code: '', gender: 'male'
  });

  const API_URL = 'http://127.0.0.1:5000/api/students';

  const getConfig = useCallback(() => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const fetchStudents = useCallback(() => {
    axios.get(API_URL, getConfig())
      .then(response => { setStudents(response.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [getConfig]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const filteredStudents = students.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      s.username?.toLowerCase().includes(term) || 
      s.email?.toLowerCase().includes(term) ||
      s.full_name?.toLowerCase().includes(term) ||
      s.student_code?.toLowerCase().includes(term) ||
      (s.gender === 'female' ? 'female women' : 'male men').includes(term)
    );
  });

  const handleOpenModal = (student = null) => {
    if (student) {
      setIsEditMode(true);
      setFormData({ 
        user_id: student.user_id, username: student.username, email: student.email, password: '',
        full_name: student.full_name || '', phone: student.phone || '', student_code: student.student_code || '', gender: student.gender || 'male'
      });
    } else {
      setIsEditMode(false);
      setFormData({ user_id: '', username: '', email: '', password: '', full_name: '', phone: '', student_code: '', gender: 'male' });
    }
    setOpen(true);
  };

  const handleCloseModal = () => setOpen(false);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = () => {
    const apiCall = isEditMode 
      ? axios.put(`${API_URL}/${formData.user_id}`, formData, getConfig())
      : axios.post(API_URL, formData, getConfig());

    apiCall.then(() => { 
        fetchStudents(); 
        handleCloseModal(); 
        showToast(isEditMode ? 'Updated successfully!' : 'Created successfully!', 'success');
      })
      .catch(err => {
        showAlert("Error!", err.response?.data?.error || "Connection error", "error");
      });
  };

  const handleDelete = (id) => {
    showConfirm('Are you sure?', 'This student data will be permanently deleted!')
      .then((result) => {
        if (result.isConfirmed) {
          axios.delete(`${API_URL}/${id}`, getConfig())
            .then(() => { fetchStudents(); showToast('Deleted successfully!', 'success'); })
            .catch(err => { showAlert("Cannot delete!", err.response?.data?.error, "error"); });
        }
      });
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  const getGenderLabel = (value) => value === 'female' ? 'Female' : 'Male';
  const getGenderChipStyle = (value) => value === 'female'
    ? { bgcolor: '#fce7f3', color: '#9d174d' }
    : { bgcolor: '#dbeafe', color: '#1e40af' };

  return (
    <Box sx={{ p: 1 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" sx={{ mb: 4 }} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#1e3a8a', mb: 0.5 }}>Students List</Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>Manage student accommodation profiles</Typography>
        </Box>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <TextField 
            placeholder="Search by name, email, Student ID..." size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: '12px', '& .MuiOutlinedInput-root': { borderRadius: '12px' }, width: { xs: '100%', sm: '280px' } }}
            InputProps={{ startAdornment: ( <InputAdornment position="start"> <SearchIcon sx={{ color: '#94a3b8' }} /> </InputAdornment> ) }}
          />
          <Button onClick={() => handleOpenModal()} variant="contained" startIcon={<PersonAddIcon />} sx={{ backgroundColor: '#1e3a8a', borderRadius: '12px', textTransform: 'none', fontWeight: 'bold', px: 3, whiteSpace: 'nowrap' }}>
            Add New
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: '20px', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid #f0f0f0' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: '700', color: '#475569' }}>Student Profile</TableCell>
              <TableCell sx={{ fontWeight: '700', color: '#475569' }}>Gender</TableCell>
              <TableCell sx={{ fontWeight: '700', color: '#475569' }}>Contact Info</TableCell>
              <TableCell sx={{ fontWeight: '700', color: '#475569' }}>Room</TableCell>
              <TableCell sx={{ fontWeight: '700', color: '#475569' }}>Wallet Balance</TableCell>
              <TableCell align="center" sx={{ fontWeight: '700', color: '#475569' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? ( <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}>Loading data...</TableCell></TableRow> ) : (
              filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                <TableRow key={row.user_id} sx={{ '&:hover': { backgroundColor: '#f1f5f9' }, transition: '0.2s' }}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 'bold', width: 40, height: 40 }}>
                        {row.username ? row.username.charAt(0).toUpperCase() : 'S'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="700" color="#1e293b">{row.full_name || row.username}</Typography>
                        <Typography variant="caption" color="#64748b" sx={{ display: 'block' }}>Student ID: {row.student_code || 'Not updated'}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={getGenderLabel(row.gender)} size="small" sx={{ fontWeight: 'bold', ...getGenderChipStyle(row.gender) }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="#475569">{row.email}</Typography>
                    <Typography variant="caption" color="#64748b">{row.phone || 'Phone: N/A'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={row.room || 'Unassigned'} size="small" sx={{ fontWeight: '600', bgcolor: row.room !== 'Chưa xếp' && row.room !== 'Unassigned' ? '#f0fdf4' : '#fff7ed', color: row.room !== 'Chưa xếp' && row.room !== 'Unassigned' ? '#166534' : '#9a3412' }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#059669' }}>{formatCurrency(row.balance || 0)}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" justifyContent="center" spacing={1}>
                      <Tooltip title="Edit"><IconButton onClick={() => handleOpenModal(row)} sx={{ color: '#2563eb' }}><CiEdit size={22} /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton onClick={() => handleDelete(row.user_id)} sx={{ color: '#ef4444' }}><CiTrash size={22} /></IconButton></Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
            {filteredStudents.length === 0 && !loading && ( <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94a3b8' }}>No students match the search keyword.</TableCell></TableRow> )}
          </TableBody>
        </Table>

        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3, borderTop: '1px solid #f0f0f0' }}>
          <Pagination 
            count={Math.ceil(filteredStudents.length / rowsPerPage) || 1} 
            page={page + 1} onChange={(e, value) => setPage(value - 1)} 
            renderItem={(item) => (
              <PaginationItem {...item} components={{ previous: () => <span style={{ fontWeight: 'bold' }}>&lt; Prev</span>, next: () => <span style={{ fontWeight: 'bold' }}>Next &gt;</span> }} sx={{ fontWeight: '600', color: '#64748b', fontSize: '14px', borderRadius: '12px', margin: '0 4px', '&.Mui-selected': { bgcolor: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', '&:hover': { bgcolor: '#f1f5f9' } }, '&.MuiPaginationItem-previousNext': { color: '#94a3b8', bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent', color: '#1e3a8a' } } }} />
            )}
          />
        </Box>
      </TableContainer>

      <Dialog open={open} onClose={handleCloseModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: '800', pt: 3, color: '#1e3a8a' }}>{isEditMode ? 'Update Profile' : 'Create Student Profile'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <TextField label="Username" name="username" value={formData.username} onChange={handleChange} fullWidth disabled={isEditMode} size="small" />
              {!isEditMode && <TextField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} fullWidth size="small" />}
            </Box>
            <TextField label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} fullWidth size="small" />
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <TextField label="Student ID" name="student_code" value={formData.student_code} onChange={handleChange} fullWidth size="small" />
              <TextField label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} fullWidth size="small" />
            </Box>
            <TextField select label="Gender" name="gender" value={formData.gender} onChange={handleChange} fullWidth size="small">
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </TextField>
            <TextField label="Contact Email" name="email" value={formData.email} onChange={handleChange} fullWidth size="small" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseModal} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#2563eb', fontWeight: 'bold', px: 3 }}>Save Profile</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
