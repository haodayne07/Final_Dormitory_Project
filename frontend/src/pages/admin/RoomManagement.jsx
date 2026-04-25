import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Avatar, Stack, Button,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Tooltip, InputAdornment, MenuItem,
  Pagination, PaginationItem 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddHomeWorkIcon from '@mui/icons-material/AddHomeWork';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';
import { CiEdit, CiTrash } from "react-icons/ci";
import { showToast, showConfirm, showAlert } from '../../utils/swal';

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('all'); 
  const [genderFilter, setGenderFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({ 
    room_id: '', room_name: '', capacity: 4, price: 0, status: 'vacant', gender_type: 'male', description: '' 
  });

  const API_URL = 'http://127.0.0.1:5000/api/rooms';

  const getConfig = useCallback((isMultipart = false) => {
    const token = localStorage.getItem('token');
    return {
      headers: { 
        Authorization: `Bearer ${token}`,
        ...(isMultipart ? { 'Content-Type': 'multipart/form-data' } : {})
      }
    };
  }, []);

  const fetchRooms = useCallback(() => {
    axios.get(API_URL, getConfig())
      .then(response => { setRooms(response.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [getConfig]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const filteredRooms = rooms.filter(r => {
    const genderLabel = r.gender_type === 'female' ? 'female women' : 'male men';
    const matchText = r.room_name.toLowerCase().includes(searchTerm.toLowerCase()) || r.price.toString().includes(searchTerm) || genderLabel.includes(searchTerm.toLowerCase());
    let matchPrice = true;
    if (priceFilter === 'under1m') matchPrice = r.price < 1000000;
    else if (priceFilter === '1m_to_2m') matchPrice = r.price >= 1000000 && r.price <= 2000000;
    else if (priceFilter === 'over2m') matchPrice = r.price > 2000000;
    const matchGender = genderFilter === 'all' || r.gender_type === genderFilter;
    return matchText && matchPrice && matchGender;
  });

  const handleOpenModal = (room = null) => {
    setImageFile(null);
    if (room) {
      setIsEditMode(true);
      setFormData({ 
        room_id: room.room_id, room_name: room.room_name, capacity: room.capacity, 
        price: room.price, status: room.status, gender_type: room.gender_type || 'male', description: room.description 
      });
      setImagePreview(room.image_url ? `http://127.0.0.1:5000${room.image_url}` : '');
    } else {
      setIsEditMode(false);
      setFormData({ room_id: '', room_name: '', capacity: 4, price: 0, status: 'vacant', gender_type: 'male', description: '' });
      setImagePreview('');
    }
    setOpen(true);
  };

  const handleCloseModal = () => setOpen(false);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    const dataToSend = new FormData();
    dataToSend.append('room_name', formData.room_name);
    dataToSend.append('capacity', formData.capacity);
    dataToSend.append('price', formData.price);
    dataToSend.append('status', formData.status);
    dataToSend.append('gender_type', formData.gender_type);
    dataToSend.append('description', formData.description);
    if (imageFile) {
        dataToSend.append('image', imageFile);
    }

    const apiCall = isEditMode 
      ? axios.put(`${API_URL}/${formData.room_id}`, dataToSend, getConfig(true))
      : axios.post(API_URL, dataToSend, getConfig(true));

    apiCall.then(() => { 
        fetchRooms(); 
        handleCloseModal(); 
        showToast(isEditMode ? 'Room updated successfully!' : 'New room added!', 'success');
      })
      .catch(err => {
        showAlert("Error!", err.response?.data?.error || "Cannot save room information", "error");
      });
  };

  const handleDelete = (id) => {
    showConfirm('Are you sure?', 'Room data will be permanently deleted!')
      .then((result) => {
        if (result.isConfirmed) {
          axios.delete(`${API_URL}/${id}`, getConfig())
            .then(() => { fetchRooms(); showToast('Room deleted successfully!', 'success'); })
            .catch(err => { showAlert("Cannot delete!", err.response?.data?.error, "error"); });
        }
      });
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  const getGenderLabel = (value) => value === 'female' ? 'Female room' : 'Male room';
  const getGenderChipStyle = (value) => value === 'female'
    ? { bgcolor: '#fce7f3', color: '#9d174d' }
    : { bgcolor: '#dbeafe', color: '#1e40af' };

  const getStatusChip = (status, current, capacity) => {
    if (status === 'maintenance') return <Chip label="Maintenance" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 'bold' }} />;
    if (current >= capacity) return <Chip label="Full" size="small" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 'bold' }} />;
    return <Chip label="Vacant" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 'bold' }} />;
  };

  return (
    <Box sx={{ p: 1 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" sx={{ mb: 4 }} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#1e3a8a', mb: 0.5 }}>Rooms Management</Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>Manage room categories, images, and capacity</Typography>
        </Box>
        
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <TextField placeholder="Search by name or price..." size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ bgcolor: 'white', borderRadius: '12px', width: { xs: '100%', sm: '200px' }}} InputProps={{ startAdornment: ( <InputAdornment position="start"> <SearchIcon sx={{ color: '#94a3b8' }} /> </InputAdornment> ), }} />
          <TextField select size="small" value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} sx={{ bgcolor: 'white', borderRadius: '12px', minWidth: '160px' }}>
            <MenuItem value="all">All Prices</MenuItem>
            <MenuItem value="under1m">Under 1,000,000</MenuItem>
            <MenuItem value="1m_to_2m">1M - 2M</MenuItem>
            <MenuItem value="over2m">Over 2,000,000</MenuItem>
          </TextField>
          <TextField select size="small" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} sx={{ bgcolor: 'white', borderRadius: '12px', minWidth: '150px' }}>
            <MenuItem value="all">All Room Types</MenuItem>
            <MenuItem value="male">Male Rooms</MenuItem>
            <MenuItem value="female">Female Rooms</MenuItem>
          </TextField>
          <Button onClick={() => handleOpenModal()} variant="contained" startIcon={<AddHomeWorkIcon />} sx={{ backgroundColor: '#1c3d8c', borderRadius: '12px', textTransform: 'none', fontWeight: 'bold', px: 3, whiteSpace: 'nowrap', width: { xs: '100%', md: 'auto' } }}> Add Room </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: '20px', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: '700', color: '#475569' }}>Room</TableCell>
              <TableCell sx={{ fontWeight: '700', color: '#475569' }}>Capacity</TableCell>
              <TableCell sx={{ fontWeight: '700', color: '#475569' }}>Room Type</TableCell>
              <TableCell sx={{ fontWeight: '700', color: '#475569' }}>Price</TableCell>
              <TableCell sx={{ fontWeight: '700', color: '#475569' }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: '700', color: '#475569' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? ( <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}>Loading room list...</TableCell></TableRow> ) : (
              filteredRooms.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                <TableRow key={row.room_id} sx={{ '&:hover': { backgroundColor: '#f1f5f9' }, transition: '0.2s' }}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar src={row.image_url ? `http://127.0.0.1:5000${row.image_url}` : undefined} sx={{ bgcolor: '#1c3d8c', color: 'white', fontWeight: 'bold', width: 50, height: 50, borderRadius: '12px' }}>
                        {!row.image_url && row.room_name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="700" color="#1e293b">{row.room_name}</Typography>
                        <Typography variant="caption" color="#64748b">{row.description || "Dormitory Room"}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600"> {row.current_occupancy} / {row.capacity} <small style={{color: '#94a3b8', fontWeight: 'normal'}}>(Pax)</small> </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={getGenderLabel(row.gender_type)} size="small" sx={{ fontWeight: 'bold', ...getGenderChipStyle(row.gender_type) }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>{formatCurrency(row.price)}</TableCell>
                  <TableCell> {getStatusChip(row.status, row.current_occupancy, row.capacity)} </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" justifyContent="center" spacing={1}>
                      <Tooltip title="Edit" arrow><IconButton onClick={() => handleOpenModal(row)} sx={{ color: '#2563eb' }}><CiEdit size={24} /></IconButton></Tooltip>
                      <Tooltip title="Delete Room" arrow><IconButton onClick={() => handleDelete(row.room_id)} sx={{ color: '#ef4444' }}><CiTrash size={24} /></IconButton></Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3, borderTop: '1px solid #f0f0f0' }}>
          <Pagination count={Math.ceil(filteredRooms.length / rowsPerPage) || 1} page={page + 1} onChange={(e, value) => setPage(value - 1)} renderItem={(item) => (
              <PaginationItem {...item} components={{ previous: () => <span style={{ fontWeight: 'bold' }}>&lt; Prev</span>, next: () => <span style={{ fontWeight: 'bold' }}>Next &gt;</span> }} sx={{ fontWeight: '600', color: '#64748b', fontSize: '14px', borderRadius: '12px', margin: '0 4px', '&.Mui-selected': { bgcolor: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', '&:hover': { bgcolor: '#f1f5f9' } }, '&.Mui-disabled': { opacity: 0.3 }, '&.MuiPaginationItem-previousNext': { color: '#94a3b8', bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent', color: '#1e3a8a' } } }} />
            )}
          />
        </Box>
      </TableContainer>

      <Dialog open={open} onClose={handleCloseModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ fontWeight: '800', pt: 3, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddHomeWorkIcon /> {isEditMode ? 'Update Room' : 'Add New Room'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box sx={{ textAlign: 'center', border: '2px dashed #cbd5e1', borderRadius: '16px', p: 3, position: 'relative', bgcolor: '#f8fafc' }}>
              {imagePreview ? (
                <Box>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '10px' }} />
                  <Button component="label" variant="outlined" size="small" sx={{ borderRadius: '8px', textTransform: 'none' }}>
                    Change Image
                    <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                  </Button>
                </Box>
              ) : (
                <Box>
                  <CloudUploadIcon sx={{ fontSize: 50, color: '#94a3b8', mb: 1 }} />
                  <Typography variant="body2" color="#64748b" mb={2}>Drag & drop or click to select room image</Typography>
                  <Button component="label" variant="contained" sx={{ bgcolor: '#1c3d8c', borderRadius: '8px', textTransform: 'none' }}>
                    Upload Image
                    <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                  </Button>
                </Box>
              )}
            </Box>

            <TextField label="Room Name" name="room_name" value={formData.room_name} onChange={handleChange} fullWidth variant="outlined" />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Capacity" name="capacity" type="number" value={formData.capacity} onChange={handleChange} fullWidth />
              <TextField label="Price" name="price" type="number" value={formData.price} onChange={handleChange} fullWidth />
            </Stack>
            <TextField select label="Room Type" name="gender_type" value={formData.gender_type} onChange={handleChange} fullWidth>
              <MenuItem value="male">Male room</MenuItem>
              <MenuItem value="female">Female room</MenuItem>
            </TextField>
            <TextField select label="Status" name="status" value={formData.status} onChange={handleChange} fullWidth>
              <MenuItem value="vacant">Vacant / Available</MenuItem>
              <MenuItem value="maintenance">Under Maintenance</MenuItem>
            </TextField>
            <TextField label="Description / Notes" name="description" value={formData.description} onChange={handleChange} fullWidth multiline rows={2} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseModal} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#1c3d8c', fontWeight: 'bold', px: 4, borderRadius: '10px' }}> Save Information </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
