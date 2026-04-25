import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Grid, Card, CardContent, Stack, Button, Chip, Avatar, Divider, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel, Paper,
  Snackbar 
} from '@mui/material';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import CampaignIcon from '@mui/icons-material/Campaign';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckIcon from '@mui/icons-material/Check';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; 
import axios from 'axios';
// NEW: Import useLocation and useNavigate to catch URL returned from MoMo
import { useLocation, useNavigate } from 'react-router-dom'; 

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [openLegalDialog, setOpenLegalDialog] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // NEW: State to handle loading effect while redirecting to MoMo
  const [paying, setPaying] = useState(false);

  const [toast, setToast] = useState({ open: false, message: '', type: 'success' });
  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') return;
    setToast({ ...toast, open: false });
  };

  const currentStudentId = localStorage.getItem('user_id'); 

  // NEW: Initialize location and navigate
  const location = useLocation();
  const navigate = useNavigate();

  const fetchData = () => {
    axios.get(`http://127.0.0.1:5000/api/students/dashboard/${currentStudentId}`)
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading Student Dashboard data:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================
  // NEW: HANDLE MOMO RESULT RETURNED ON URL
  // ==========================================
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const resultCode = queryParams.get('resultCode');
    const orderId = queryParams.get('orderId');

    if (resultCode && orderId) {
      if (resultCode === '0') {
        // Transaction successful, call API to update status
        axios.get(`http://127.0.0.1:5000/api/payments/momo_return?resultCode=${resultCode}&orderId=${orderId}`)
          .then(() => {
            setToast({ open: true, message: 'MoMo payment successful!', type: 'success' });
            fetchData(); // Reload data to turn the bill card green
          })
          .catch(err => {
            console.error("Error updating payment:", err);
            setToast({ open: true, message: 'Error updating bill status.', type: 'error' });
          });
      } else {
        // Transaction failed or cancelled
        setToast({ open: true, message: 'Transaction cancelled or incomplete.', type: 'error' });
      }
      
      // Remove URL parameters to clean the path
      navigate('/student/dashboard', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, navigate]);

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  const getGenderLabel = (value) => value === 'female' ? 'Female' : 'Male';

  const handleRequestRoom = () => {
    setSubmitting(true);
    axios.post('http://127.0.0.1:5000/api/students/request-room', {
      user_id: currentStudentId,
      room_id: selectedRoom.id
    })
    .then(() => { 
      setToast({ open: true, message: 'Request submitted successfully! Please wait.', type: 'success' });
      setOpenLegalDialog(false);
      setSelectedRoom(null);
      setLoading(true); 
      fetchData(); 
    })
    .catch(err => {
      setToast({ open: true, message: "An error occurred: " + (err.response?.data?.error || err.message), type: 'error' });
    })
    .finally(() => setSubmitting(false));
  };

  // ==========================================
  // FUNCTION TO HANDLE MOMO PAYMENT API CALL
  // ==========================================
  const handlePayment = () => {
    setPaying(true);
    
    const billId = data.billing.id;
    if (!billId) {
      setToast({ open: true, message: 'No payable bill was found for your account.', type: 'error' });
      setPaying(false);
      return;
    }

    axios.post('http://127.0.0.1:5000/api/payments/create_momo_payment', {
      bill_id: billId
    })
    .then(response => {
      if (response.data.payUrl) {
        window.location.href = response.data.payUrl;
      }
    })
    .catch(err => {
      setToast({ open: true, message: "Error creating payment: " + (err.response?.data?.error || err.message), type: 'error' });
      setPaying(false);
    });
  };

  if (loading || !data) {
    return (
      <Box sx={{ width: '100%', minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const containerStyle = { width: '100%', maxWidth: '100%', m: 0, pb: 5 };

  if (data.hasRejectedRequest) {
    return (
      <Box sx={{ ...containerStyle, minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={0} sx={{ p: 5, borderRadius: '16px', textAlign: 'center', border: '1px solid #fca5a5', maxWidth: '600px', width: '100%', bgcolor: '#fef2f2' }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: '#fee2e2', color: '#dc2626', margin: '0 auto', mb: 3 }}>
            <ErrorOutlineIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h6" fontWeight="bold" color="#991b1b" sx={{ textTransform: 'uppercase', mb: 4, lineHeight: 1.6 }}>
            YOUR CONTRACT HAS BEEN REJECTED, PLEASE CONTACT ADMIN@123 FOR MORE DETAILS
          </Typography>
          <Button 
            variant="contained" 
            color="error" 
            href="mailto:admin@gmail.com"
            sx={{ borderRadius: '8px', fontWeight: 'bold', px: 4, py: 1.5, boxShadow: 'none', '&:hover': {bgcolor: '#b91c1c'} }}
          >
            Contact Admin now
          </Button>
        </Paper>
      </Box>
    );
  }

  if (data.hasPendingRequest) {
    return (
      <Box sx={{ ...containerStyle, minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={0} sx={{ p: 5, borderRadius: '16px', textAlign: 'center', border: '1px solid #e0e0e0', maxWidth: '600px', width: '100%', bgcolor: 'white' }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: '#fef08a', color: '#ca8a04', margin: '0 auto', mb: 3 }}>
            <HourglassEmptyIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" fontWeight="bold" color="#1e293b" mb={1}>Pending contract approval</Typography>
          <Typography variant="body1" color="#64748b" mb={4}>
            Your room rental request has been sent to Management. Please wait for Admin confirmation. This process may take 1-2 business days.
          </Typography>
          <Button variant="outlined" disabled sx={{ borderRadius: '8px', fontWeight: 'bold', px: 4, py: 1.5 }}>Status: Pending</Button>
        </Paper>
      </Box>
    );
  }

  if (!data.hasRoom) {
    return (
      <Box sx={containerStyle}>
        <Box sx={{ mb: 5, pb: 3, borderBottom: '2px solid #f0f0f0' }}>
          <Typography variant="h4" fontWeight="900" color="#1e293b" mb={1}>Hello {data.studentName},</Typography>
          <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 'normal' }}>Below is a list of available rooms. Please select a room to continue.</Typography>
        </Box>

        <Grid container spacing={4}>
          {data.availableRooms?.map(room => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
              <Card sx={{ 
                borderRadius: '12px', 
                border: '1px solid #ebebeb', 
                boxShadow: 'none', 
                transition: 'all 0.3s ease', 
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': { 
                  borderColor: '#f97316', 
                  boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                  transform: 'translateY(-4px)' 
                } 
              }}
              onClick={() => setSelectedRoom(room)}
              >
                <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                  {room.image_url ? (
                    <Box 
                      component="img"
                      src={room.image_url.startsWith('http') ? room.image_url : `http://127.0.0.1:5000/${room.image_url.replace(/^\/+/, '')}`}
                      alt={room.name}
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x250/f1f5f9/94a3b8?text=No+Image"; }}
                      sx={{ width: '100%', height: '240px', objectFit: 'cover', transition: 'transform 0.5s', '&:hover': { transform: 'scale(1.05)' } }}
                    />
                  ) : (
                    <Box sx={{ width: '100%', height: '240px', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography color="#94a3b8" variant="body2">No image</Typography>
                    </Box>
                  )}
                  <Chip label="Featured" size="small" sx={{ position: 'absolute', bottom: 12, left: 12, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', fontWeight: 'bold', fontSize: '12px', py: 1.5 }} />
                </Box>

                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', '&:last-child': { pb: 3 } }}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="#1e293b" sx={{ mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {room.name}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="#ea580c" mb={2}>
                      {formatCurrency(room.price)} / month
                    </Typography>
                  </Box>
                  <Stack direction="row" alignItems="center" spacing={1.5} color="#64748b" sx={{ fontSize: '14px', flexWrap: 'wrap', rowGap: 1 }}>
                    <Typography variant="body2" fontWeight="500">Capacity: {room.capacity} people</Typography>
                    <Typography variant="body2">•</Typography>
                    <Typography variant="body2" fontWeight="500">Available: {room.capacity - room.current_tenants}</Typography>
                    <Chip label={`${getGenderLabel(room.gender_type)} room`} size="small" sx={{ bgcolor: room.gender_type === 'female' ? '#fce7f3' : '#dbeafe', color: room.gender_type === 'female' ? '#9d174d' : '#1e40af', fontWeight: 'bold' }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {(!data.availableRooms || data.availableRooms.length === 0) && (
            <Grid item xs={12}>
              <Typography sx={{ p: 6, textAlign: 'center', color: '#64748b', bgcolor: '#f8fafc', borderRadius: '12px', fontSize: '1.2rem' }}>There are currently no available rooms.</Typography>
            </Grid>
          )}
        </Grid>

        <Dialog open={Boolean(selectedRoom)} onClose={() => setSelectedRoom(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
          <DialogTitle sx={{ fontWeight: 'bold', color: '#1e293b', borderBottom: '1px solid #ebebeb', pb: 2, pt: 3, px: 4 }}>Details of {selectedRoom?.name}</DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            {selectedRoom?.image_url ? (
              <Box 
                component="img"
                src={selectedRoom.image_url.startsWith('http') ? selectedRoom.image_url : `http://127.0.0.1:5000/${selectedRoom.image_url.replace(/^\/+/, '')}`}
                alt={selectedRoom.name}
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/f1f5f9/94a3b8?text=Image+Load+Error"; }}
                sx={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px', mb: 3 }}
              />
            ) : (
              <Box sx={{ width: '100%', height: '250px', bgcolor: '#f8fafc', borderRadius: '12px', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1' }}>
                <Typography color="#94a3b8" fontWeight="bold">This room has no images updated yet</Typography>
              </Box>
            )}

            <Typography variant="h5" fontWeight="bold" color="#ea580c" mb={1}>{formatCurrency(selectedRoom?.price)} <span style={{fontSize: '16px', color: '#64748b', fontWeight: 'normal'}}>/ student / month</span></Typography>
            <Chip label={`${getGenderLabel(selectedRoom?.gender_type)} room`} size="small" sx={{ mb: 2, bgcolor: selectedRoom?.gender_type === 'female' ? '#fce7f3' : '#dbeafe', color: selectedRoom?.gender_type === 'female' ? '#9d174d' : '#1e40af', fontWeight: 'bold' }} />
            <Typography variant="body1" color="#64748b" mb={3}>Electricity and water bills will be calculated separately based on actual monthly consumption.</Typography>
            
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" fontWeight="bold" mb={2} color="#1e293b">Available Furniture & Amenities:</Typography>
            <Grid container spacing={2}>
              {selectedRoom?.amenities && selectedRoom.amenities.length > 0 ? (
                selectedRoom.amenities.map((item, idx) => (
                  <Grid item xs={6} key={idx}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <CheckIcon sx={{ color: '#16a34a', fontSize: 20 }} />
                      <Typography variant="body1" color="#475569" fontWeight="500">{item}</Typography>
                    </Stack>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography variant="body1" color="#ef4444" sx={{ fontStyle: 'italic' }}>* This room is currently not equipped with any amenities.</Typography>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, px: 4, borderTop: '1px solid #ebebeb' }}>
            <Button onClick={() => setSelectedRoom(null)} color="inherit" sx={{ fontWeight: 'bold', px: 3, transition: '0.2s', '&:hover': { bgcolor: '#f1f5f9' } }}>Cancel</Button>
            <Button variant="contained" sx={{ fontWeight: 'bold', borderRadius: '8px', bgcolor: '#f97316', transition: '0.2s', '&:hover': {bgcolor: '#ea580c', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'}, px: 4, py: 1.5 }} onClick={() => { setOpenLegalDialog(true); }}>
              Register to rent
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openLegalDialog} onClose={() => setOpenLegalDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
          <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #ebebeb', p: 3 }}>TERMS & COMMITMENTS</DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Box sx={{ bgcolor: '#f8fafc', p: 4, borderRadius: '12px', border: '1px solid #e2e8f0', height: '300px', overflowY: 'auto', mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>Article 1. Financial Obligations</Typography>
              <Typography variant="body1" mb={3} color="#475569">Pay room, electricity, and water bills on time.</Typography>
            </Box>
            <FormControlLabel control={<Checkbox checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} color="warning" size="large" />} label={<Typography variant="h6" fontWeight="bold">I have read and commit to comply.</Typography>} />
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid #ebebeb' }}>
            <Button onClick={() => setOpenLegalDialog(false)} color="inherit" sx={{ fontWeight: 'bold', px: 3, transition: '0.2s', '&:hover': { bgcolor: '#f1f5f9' } }}>Cancel</Button>
            <Button variant="contained" disabled={!isAgreed || submitting} onClick={handleRequestRoom} sx={{ fontWeight: 'bold', borderRadius: '8px', bgcolor: '#f97316', transition: '0.2s', '&:hover': {bgcolor: '#ea580c', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'}, px: 4, py: 1.5 }}>
              Agree & Submit Request
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={toast.open} autoHideDuration={3000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Paper elevation={3} sx={{ display: 'flex', alignItems: 'center', p: '12px 24px', borderRadius: '12px', minWidth: '300px', bgcolor: 'white', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2.5, bgcolor: toast.type === 'success' ? '#f0fdf4' : (toast.type === 'error' ? '#fef2f2' : '#fffbeb') }}>
              {toast.type === 'success' ? <CheckCircleIcon sx={{ color: '#86efac', fontSize: 32 }} /> : <WarningAmberIcon sx={{ color: toast.type === 'error' ? '#fca5a5' : '#fcd34d', fontSize: 32 }} />}
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1.1rem' }}>
              {toast.message}
            </Typography>
          </Paper>
        </Snackbar>

      </Box>
    );
  }

  return (
    <Box sx={containerStyle}>
      <Box sx={{ mb: 5, pb: 3, borderBottom: '2px solid #f0f0f0' }}>
        <Typography variant="h4" fontWeight="900" color="#1e293b" mb={1}>Good morning, {data.studentName}!</Typography>
        <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 'normal' }}>Wishing you a productive study day.</Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={7}>
          <Stack spacing={4}>
            
            {/* CARD 1: Payment Status */}
            {data.billing.status === 'unpaid' ? (
              <Card sx={{ borderRadius: '12px', border: '1px solid #fca5a5', bgcolor: '#fef2f2', boxShadow: 'none', transition: '0.3s', '&:hover': { boxShadow: '0 8px 24px rgba(239, 68, 68, 0.1)' } }}>
                <CardContent sx={{ p: { xs: 3, md: 4, lg: 5 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <WarningAmberIcon sx={{ color: '#ef4444', fontSize: 40 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold" color="#991b1b" mb={0.5}>{data.billing.title || `Unpaid bill for ${data.billing.month}`}</Typography>
                      <Typography variant="body1" color="#b91c1c">Deadline: <strong>{data.billing.dueDate}</strong></Typography>
                    </Box>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={4}>
                    <Typography variant="h4" fontWeight="900" color="#ef4444">{formatCurrency(data.billing.amount)}</Typography>
                    
                    {/* MoMo Payment Button */}
                    <Button 
                      variant="contained" 
                      color="error" 
                      size="large" 
                      disabled={paying}
                      onClick={handlePayment}
                      sx={{ 
                        borderRadius: '8px', fontWeight: 'bold', textTransform: 'none', px: 4, py: 1.5, boxShadow: 'none',
                        transition: 'all 0.3s ease',
                        '&:hover': { bgcolor: '#dc2626', transform: 'translateY(-3px)', boxShadow: '0 6px 16px rgba(220, 38, 38, 0.4)' }
                      }}
                    >
                      {paying ? 'Redirecting...' : 'Pay now'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ borderRadius: '12px', border: '1px solid #bbf7d0', bgcolor: '#f0fdf4', boxShadow: 'none' }}>
                <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 36 }} />
                  <Typography variant="h6" fontWeight="bold" color="#166534">Great! You have fully paid this month's fees.</Typography>
                </CardContent>
              </Card>
            )}

            {/* CARD 2: Accommodation Information */}
            <Card sx={{ borderRadius: '12px', border: '1px solid #ebebeb', boxShadow: 'none' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5" fontWeight="bold" color="#1e293b">Accommodation Information</Typography>
                  <Button 
                    onClick={() => navigate('/student/room')}
                    endIcon={<ArrowForwardIosIcon sx={{ fontSize: '14px !important' }}/>} 
                    size="large" 
                    sx={{ 
                      textTransform: 'none', fontWeight: 'bold', color: '#2563eb', fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: '#eff6ff', borderRadius: '8px', px: 2 }
                    }}
                  >
                     Room Details
                  </Button>
                </Stack>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9', transition: '0.3s', '&:hover': { borderColor: '#cbd5e1', bgcolor: 'white' } }}>
                      <Typography variant="subtitle2" color="#64748b" display="block" mb={1} textTransform="uppercase">Current Room</Typography>
                      <Typography variant="h5" fontWeight="900" color="#2563eb">{data.room.name}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9', transition: '0.3s', '&:hover': { borderColor: '#cbd5e1', bgcolor: 'white' } }}>
                      <Typography variant="subtitle2" color="#64748b" display="block" mb={1} textTransform="uppercase">Room Type</Typography>
                      <Typography variant="h6" fontWeight="bold" color="#1e293b">{data.room.type}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9', transition: '0.3s', '&:hover': { borderColor: '#cbd5e1', bgcolor: 'white' } }}>
                      <Typography variant="subtitle2" color="#64748b" display="block" mb={1} textTransform="uppercase">Contract Expiry</Typography>
                      <Typography variant="h6" fontWeight="bold" color="#1e293b">{data.room.endDate}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* CARD 3: Maintenance */}
            <Card sx={{ borderRadius: '12px', border: '1px solid #ebebeb', boxShadow: 'none' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5" fontWeight="bold" color="#1e293b">Recent Maintenance</Typography>
                  <Button 
                    size="large" 
                    sx={{ 
                      textTransform: 'none', fontWeight: 'bold', color: '#64748b', fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: '#f1f5f9', color: '#1e293b', borderRadius: '8px', px: 2 }
                    }}
                  >
                    View all
                  </Button>
                </Stack>
                
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 2.5, borderTop: '1px solid #f1f5f9' }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="#1e293b" mb={0.5}>{data.maintenance.title}</Typography>
                    <Typography variant="body1" color="#94a3b8">Submitted at: {data.maintenance.date}</Typography>
                  </Box>
                  <Chip label={data.maintenance.status} sx={{ bgcolor: '#fef08a', color: '#ca8a04', fontWeight: 'bold', borderRadius: '6px', px: 2, py: 2.5, fontSize: '14px' }} />
                </Stack>
              </CardContent>
            </Card>

          </Stack>
        </Grid>

        {/* RIGHT COLUMN (NEWSBOARD) */}
        <Grid item xs={12} lg={5}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" fontWeight="900" color="#1e293b" mb={3}>
              Dormitory Newsboard
            </Typography>
            
            <Stack spacing={3} sx={{ flexGrow: 1 }}>
              {data.events && data.events.length > 0 ? (
                data.events.map((event) => (
                  <Card 
                    key={event.id} 
                    sx={{ 
                      borderRadius: '16px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: 'none', 
                      transition: 'all 0.3s ease', 
                      '&:hover': { borderColor: '#cbd5e1', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } 
                    }}
                  >
                    <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Chip 
                          label={event.type === 'warning' ? 'Warning' : event.type === 'maintenance' ? 'Maintenance' : 'Information'} 
                          size="small" 
                          sx={{ 
                            bgcolor: event.type === 'warning' ? '#fef3c7' : event.type === 'maintenance' ? '#fee2e2' : '#eff6ff', 
                            color: event.type === 'warning' ? '#d97706' : event.type === 'maintenance' ? '#dc2626' : '#2563eb',
                            fontWeight: 'bold', fontSize: '13px', borderRadius: '6px', px: 1.5, py: 1.5
                          }} 
                        />
                        <Typography variant="body2" color="#94a3b8" fontWeight="500">
                          {event.date}
                        </Typography>
                      </Stack>
                      
                      {/* Tiêu đề */}
                      <Typography variant="h6" fontWeight="bold" color="#1e293b" sx={{ lineHeight: 1.4, mb: 2 }}>
                        {event.title}
                      </Typography>

                      {/* Hiển thị TOÀN BỘ NỘI DUNG chi tiết */}
                      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        <Typography variant="body2" color="#475569" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                          {event.description}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Typography variant="body1" color="#94a3b8" mt={2} fontStyle="italic">
                  No announcements right now.
                </Typography>
              )}
            </Stack>
            
            <Button 
              fullWidth 
              variant="outlined" 
              size="large" 
              onClick={() => navigate('/student/events')} 
              sx={{ 
                mt: 4, borderRadius: '12px', textTransform: 'none', fontWeight: 'bold', fontSize: '1.1rem', color: '#1c4f9f', borderColor: '#cbd5e1', py: 1.5,
                transition: 'all 0.3s ease',
                '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' } 
              }}
            >
              View all announcements
            </Button>
          </Box>
        </Grid>

      </Grid>
      
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Paper elevation={3} sx={{ display: 'flex', alignItems: 'center', p: '12px 24px', borderRadius: '12px', minWidth: '300px', bgcolor: 'white', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2.5, bgcolor: toast.type === 'success' ? '#f0fdf4' : (toast.type === 'error' ? '#fef2f2' : '#fffbeb') }}>
            {toast.type === 'success' ? <CheckCircleIcon sx={{ color: '#86efac', fontSize: 32 }} /> : <WarningAmberIcon sx={{ color: toast.type === 'error' ? '#fca5a5' : '#fcd34d', fontSize: 32 }} />}
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1.1rem' }}>
            {toast.message}
          </Typography>
        </Paper>
      </Snackbar>
    </Box>
  );
}
