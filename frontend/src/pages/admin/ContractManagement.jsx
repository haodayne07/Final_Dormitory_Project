import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Avatar, Stack, Button,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Tooltip, InputAdornment, 
  Tabs, Tab, Pagination, PaginationItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import axios from 'axios';
import { showToast, showConfirm, showAlert } from '../../utils/swal';

export default function ContractManagement() {
  const [tabIndex, setTabIndex] = useState(0); 
  const [requests, setRequests] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState(''); 
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [open, setOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({ start_date: '', end_date: '', deposit_amount: 0 });

  const getConfig = useCallback(() => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const fetchData = useCallback(() => {
    const reqApi = axios.get('http://127.0.0.1:5000/api/contracts/requests', getConfig());
    const conApi = axios.get('http://127.0.0.1:5000/api/contracts', getConfig());

    Promise.all([reqApi, conApi])
      .then(([reqRes, conRes]) => {
        setRequests(reqRes.data);
        setContracts(conRes.data);
      })
      .catch(err => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [getConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  const getGenderLabel = (value) => value === 'female' ? 'Female' : 'Male';
  const getGenderChipStyle = (value) => value === 'female'
    ? { bgcolor: '#fce7f3', color: '#9d174d' }
    : { bgcolor: '#dbeafe', color: '#1e40af' };

  const handleTabChange = (event, newValue) => { setTabIndex(newValue); setPage(0); setSearchTerm(''); };
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleOpenApproveModal = (req) => {
    setSelectedRequest(req);
    const today = new Date();
    const sixMonthsLater = new Date(new Date().setMonth(today.getMonth() + 6));
    setFormData({ 
      start_date: today.toISOString().split('T')[0], 
      end_date: sixMonthsLater.toISOString().split('T')[0], 
      deposit_amount: 1000000 
    });
    setOpen(true);
  };

  const handleApprove = () => {
    axios.put(`http://127.0.0.1:5000/api/contracts/requests/${selectedRequest.request_id}`, { ...formData, action: 'approve' }, getConfig())
      .then(() => { fetchData(); setOpen(false); showToast('Contract created successfully!', 'success'); })
      .catch(err => showAlert("Approval Rejected!", err.response?.data?.error, "error"));
  };

  const handleReject = (reqId) => {
    showConfirm('Reject Request?', 'Are you sure you want to reject this student?')
      .then((result) => {
        if (result.isConfirmed) {
          axios.put(`http://127.0.0.1:5000/api/contracts/requests/${reqId}`, { action: 'reject' }, getConfig())
            .then(() => { fetchData(); showToast('Rejected successfully!', 'success'); })
            .catch(err => showAlert("Error!", err.response?.data?.error, "error"));
        }
      });
  };

  const currentList = tabIndex === 0 ? requests : contracts;
  
  const filteredList = currentList.filter(item => 
    item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.room_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 1 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 3 }} spacing={2}>
        <Typography variant="h4" fontWeight="900" color="#1e3a8a">Contracts & Requests</Typography>
        
        <TextField 
            placeholder="Search student, room..." 
            size="small" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#64748b' }}/></InputAdornment> }}
            sx={{ width: { xs: '100%', sm: '320px' }, bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: '12px', '& fieldset': { borderColor: '#cbd5e1', borderWidth: '1.5px', }, '&:hover fieldset': { borderColor: '#1c3d8c', }, '&.Mui-focused fieldset': { borderColor: '#1c3d8c', borderWidth: '2px', }, } }}
        />
      </Stack>

      <Paper sx={{ mb: 3, borderRadius: '16px' }}>
        <Tabs value={tabIndex} onChange={handleTabChange} sx={{ px: 2 }}>
          <Tab icon={<AssignmentIcon />} iconPosition="start" label={`Requests (${requests.filter(r => r.status === 'pending').length})`} />
          <Tab icon={<CheckCircleOutlineIcon />} iconPosition="start" label={`Contracts (${contracts.length})`} />
        </Tabs>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: '20px', border: '1px solid #f0f0f0' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Student</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Room</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{tabIndex === 0 ? 'Submitted Date' : 'Term Duration'}</TableCell>
              {tabIndex === 1 && <TableCell sx={{ fontWeight: 'bold' }}>Deposit Amount</TableCell>}
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>Loading...</TableCell></TableRow> : 
              filteredList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ bgcolor: '#1c3d8c', width: 32, height: 32 }}>{row.student_name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="600">{row.student_name}</Typography>
                        <Chip label={getGenderLabel(row.student_gender)} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 'bold', ...getGenderChipStyle(row.student_gender) }} />
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2">{row.room_name}</Typography>
                      <Chip label={`${getGenderLabel(row.room_gender_type)} room`} size="small" sx={{ alignSelf: 'flex-start', height: 20, fontSize: 11, fontWeight: 'bold', ...getGenderChipStyle(row.room_gender_type) }} />
                    </Stack>
                  </TableCell>
                  <TableCell>{tabIndex === 0 ? row.created_at : `${row.start_date} to ${row.end_date}`}</TableCell>
                  
                  {tabIndex === 1 && (
                    <TableCell sx={{ fontWeight: 'bold', color: '#16a34a' }}>
                      {formatCurrency(row.deposit_amount || 0)}
                    </TableCell>
                  )}

                  <TableCell>
                    <Chip 
                      label={row.status === 'pending' ? 'Pending' : row.status === 'rejected' ? 'Rejected' : row.status === 'active' ? 'Active' : row.status} 
                      size="small" 
                      color={
                        row.status === 'pending' ? 'warning' : 
                        row.status === 'rejected' ? 'error' : 
                        'success'
                      } 
                    />
                  </TableCell>

                  <TableCell align="center">
                    {tabIndex === 0 && row.status === 'pending' && (
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Approve"><IconButton onClick={() => handleOpenApproveModal(row)} color="success"><CheckCircleOutlineIcon /></IconButton></Tooltip>
                        <Tooltip title="Reject"><IconButton onClick={() => handleReject(row.request_id)} color="error"><HighlightOffIcon /></IconButton></Tooltip>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>

        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3, borderTop: '1px solid #f0f0f0' }}>
          <Pagination 
            count={Math.ceil(filteredList.length / rowsPerPage) || 1} 
            page={page + 1} 
            onChange={(e, value) => setPage(value - 1)} 
            renderItem={(item) => (
              <PaginationItem
                {...item}
                components={{ previous: () => <span style={{ fontWeight: 'bold' }}>&lt; Prev</span>, next: () => <span style={{ fontWeight: 'bold' }}>Next &gt;</span> }}
                sx={{
                  fontWeight: '600', color: '#64748b', fontSize: '14px', borderRadius: '12px', margin: '0 4px',
                  '&.Mui-selected': { bgcolor: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', '&:hover': { bgcolor: '#f1f5f9' } },
                  '&.MuiPaginationItem-previousNext': { color: '#94a3b8', bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent', color: '#1e3a8a' } }
                }}
              />
            )}
          />
        </Box>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '15px' } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Approve Contract</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {selectedRequest && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={`${getGenderLabel(selectedRequest.student_gender)} student`} size="small" sx={{ fontWeight: 'bold', ...getGenderChipStyle(selectedRequest.student_gender) }} />
                <Chip label={`${getGenderLabel(selectedRequest.room_gender_type)} room`} size="small" sx={{ fontWeight: 'bold', ...getGenderChipStyle(selectedRequest.room_gender_type) }} />
              </Stack>
            )}
            <TextField label="Start Date" name="start_date" type="date" value={formData.start_date} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="End Date" name="end_date" type="date" value={formData.end_date} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Deposit Amount" name="deposit_amount" type="number" value={formData.deposit_amount} onChange={handleChange} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained" color="success" sx={{ fontWeight: 'bold' }}>Confirm Approval</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
