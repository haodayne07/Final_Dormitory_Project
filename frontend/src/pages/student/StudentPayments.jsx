import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PaymentIcon from '@mui/icons-material/Payment';
import axios from 'axios';

export default function StudentPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const currentStudentId = localStorage.getItem('user_id');

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  useEffect(() => {
    axios.get(`http://127.0.0.1:5000/api/payments/student/${currentStudentId}`)
      .then((res) => setPayments(res.data))
      .catch((err) => console.error('Error loading payment history:', err))
      .finally(() => setLoading(false));
  }, [currentStudentId]);

  const handlePay = (billId) => {
    setPayingId(billId);
    axios.post('http://127.0.0.1:5000/api/payments/create_momo_payment', { bill_id: billId })
      .then((res) => {
        if (res.data.payUrl) {
          window.location.href = res.data.payUrl;
        }
      })
      .catch((err) => {
        console.error('Error creating MoMo payment:', err);
        setPayingId(null);
      });
  };

  const unpaidCount = payments.filter((item) => item.status === 'unpaid').length;
  const totalPaid = payments
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + Number(item.amount_paid || item.amount || 0), 0);

  if (loading) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1, pb: 5 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" color="#1e3a8a" gutterBottom>
            Bills & Payments
          </Typography>
          <Typography variant="body2" color="#64748b">
            Track your monthly dormitory bills and payment history.
          </Typography>
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
        <Card sx={{ flex: 1, borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: '#fef2f2', color: '#dc2626' }}>
                <WarningAmberIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="#64748b">Unpaid bills</Typography>
                <Typography variant="h5" fontWeight="900" color="#1e293b">{unpaidCount}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: '#dcfce7', color: '#16a34a' }}>
                <CheckCircleIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="#64748b">Total paid</Typography>
                <Typography variant="h5" fontWeight="900" color="#1e293b">{formatCurrency(totalPaid)}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: 'none', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 760 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Bill</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Room</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Paid At</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                  No bills have been created for your account yet.
                </TableCell>
              </TableRow>
            ) : payments.map((item) => (
              <TableRow key={item.bill_id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <ReceiptLongIcon sx={{ color: '#1c3d8c' }} />
                    <Typography variant="body2" fontWeight="700" color="#1e293b">{item.title}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{item.room_name}</TableCell>
                <TableCell>{item.due_date || 'N/A'}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#059669' }}>{formatCurrency(item.amount)}</TableCell>
                <TableCell>
                  <Chip
                    label={item.status === 'paid' ? 'Paid' : 'Unpaid'}
                    size="small"
                    sx={{
                      fontWeight: 'bold',
                      bgcolor: item.status === 'paid' ? '#dcfce7' : '#fee2e2',
                      color: item.status === 'paid' ? '#166534' : '#991b1b'
                    }}
                  />
                </TableCell>
                <TableCell>{item.payment_date || '-'}</TableCell>
                <TableCell align="center">
                  {item.status === 'unpaid' ? (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PaymentIcon />}
                      disabled={payingId === item.bill_id}
                      onClick={() => handlePay(item.bill_id)}
                      sx={{ bgcolor: '#1c3d8c', borderRadius: '8px', textTransform: 'none', fontWeight: 'bold' }}
                    >
                      {payingId === item.bill_id ? 'Redirecting' : 'Pay MoMo'}
                    </Button>
                  ) : (
                    <Typography variant="caption" color="#166534" fontWeight="bold">
                      {item.payment_method || 'Completed'}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
