import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { 
  Box, Drawer as MuiDrawer, List, ListItem, ListItemButton, 
  ListItemIcon, ListItemText, Typography, IconButton, Divider, Avatar, Stack, Chip
} from '@mui/material';

// Icons
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import BuildIcon from '@mui/icons-material/Build';
import PaymentIcon from '@mui/icons-material/Payment';
import EventIcon from '@mui/icons-material/Event';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import NotificationBell from '../components/NotificationBell';

const drawerWidth = 260;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  backgroundColor: '#1c3d8c', 
  color: '#94a3b8',
  borderRight: 'none',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(9)} + 1px)`,
  backgroundColor: '#1c3d8c', 
  color: '#94a3b8',
  borderRight: 'none',
});

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

const menuItems = [
  { text: 'Dashboard', icon: <HomeIcon />, path: '/admin', allowedRoles: ['admin', 'staff'] },
  { text: 'Students', icon: <PeopleIcon />, path: '/admin/students', allowedRoles: ['admin', 'staff'] },
  { text: 'Rooms', icon: <MeetingRoomIcon />, path: '/admin/rooms', allowedRoles: ['admin', 'staff'] }, 
  { text: 'Contracts', icon: <AssignmentIcon />, path: '/admin/contracts', allowedRoles: ['admin', 'staff'] },
  { text: 'Maintenance', icon: <BuildIcon />, path: '/admin/maintenance', allowedRoles: ['admin', 'staff'] },
  { text: 'Payments', icon: <PaymentIcon />, path: '/admin/payments', allowedRoles: ['admin', 'staff'] },
  { text: 'Events', icon: <EventIcon />, path: '/admin/events', allowedRoles: ['admin', 'staff'] }, 
  { text: 'Staff Manager', icon: <GroupIcon />, path: '/admin/staff', allowedRoles: ['admin'] }, 
  { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings', allowedRoles: ['admin'] }, 
];

export default function AdminLayout() {
  const [open, setOpen] = useState(true); 
  const location = useLocation();
  const navigate = useNavigate();


  const rawRole = localStorage.getItem('role') || 'student';
  const userRole = rawRole.trim().toLowerCase();

  const filteredMenuItems = menuItems.filter(item => 
    item.allowedRoles && item.allowedRoles.includes(userRole)
  );
  const roleLabel = userRole === 'admin' ? 'Administrator' : 'Staff';
  const roleInitial = userRole === 'admin' ? 'A' : 'S';

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#ffffff' }}>
      <Drawer variant="permanent" open={open}>
        <Box sx={{ p: 3, mb: 1, display: 'flex', alignItems: 'center', justifyContent: open ? 'space-between' : 'center' }}>
          {open && (
            <Box>
              <Typography variant="h5" fontWeight="900" sx={{ color: 'white' }}>
                DormHub
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>
                {userRole} PANEL
              </Typography>
            </Box>
          )}
          <IconButton onClick={handleDrawerToggle} sx={{ color: '#94a3b8' }}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Box>
        
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mx: 2, mb: 2 }} />

        <List sx={{ px: 2, flexGrow: 1 }}>
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1, display: 'block' }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    borderRadius: '12px',
                    backgroundColor: isActive ? '#34529d' : 'transparent',
                    color: isActive ? 'white' : '#94a3b8',
                    '&:hover': { backgroundColor: '#2d4a96', color: 'white' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center', color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ opacity: open ? 1 : 0 }}
                    primaryTypographyProps={{ fontWeight: isActive ? 'bold' : '500' }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <List sx={{ px: 2, mb: 2 }}>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton 
              onClick={handleLogout}
              sx={{ 
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                borderRadius: '12px', 
                color: '#94a3b8', 
                '&:hover': { backgroundColor: '#2d4a96', color: 'white' } 
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center', color: 'inherit' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" sx={{ opacity: open ? 1 : 0 }} primaryTypographyProps={{ fontWeight: '500' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, backgroundColor: '#ffffff', transition: '0.2s' }}>
        <Box
          sx={{
            mb: 4,
            px: { xs: 2, md: 3 },
            py: 2,
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            bgcolor: '#ffffff',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)'
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="800" color="#1e293b">
              {roleLabel} workspace
            </Typography>
            <Typography variant="body2" color="#64748b">
              Announcements, contracts, and operational updates
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <NotificationBell
              onViewAll={() => navigate('/admin/events')}
              storageKey={`${userRole}_notifications_last_seen_event_id`}
            />
            <Chip
              label={roleLabel}
              sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: '700', borderRadius: '10px' }}
            />
            <Avatar sx={{ width: 38, height: 38, bgcolor: '#1c3d8c', fontWeight: 'bold' }}>
              {roleInitial}
            </Avatar>
          </Stack>
        </Box>
        <Outlet />
      </Box>
    </Box>
  );
}
