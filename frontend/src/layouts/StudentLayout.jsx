import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Drawer, List, ListItem, ListItemIcon, ListItemText, 
  Typography, Avatar, IconButton, AppBar, Toolbar, Stack, Tooltip
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HotelIcon from '@mui/icons-material/Hotel';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import CampaignIcon from '@mui/icons-material/Campaign';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NotificationBell from '../components/NotificationBell';

const drawerWidth = 260;
const collapsedWidth = 84; 

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const handleMobileToggle = () => setMobileOpen(!mobileOpen);
  const handleDesktopToggle = () => setDesktopOpen(!desktopOpen);

  const currentWidth = desktopOpen ? drawerWidth : collapsedWidth;


  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/student/dashboard' },
    { text: 'My Room', icon: <HotelIcon />, path: '/student/room' },
    { text: 'Bills & Payments', icon: <ReceiptLongIcon />, path: '/student/payments' },
    { text: 'Maintenance', icon: <BuildCircleIcon />, path: '/student/maintenance' },
    { text: 'Newsboard', icon: <CampaignIcon />, path: '/student/events' },
  ];

  const renderDrawerContent = (isExpanded) => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1c3d8c', color: 'white', overflowX: 'hidden' }}>
      
      <Box sx={{ 
        p: isExpanded ? 3 : 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isExpanded ? 'space-between' : 'center', 
        transition: 'all 0.3s',
        minHeight: '80px' 
      }}>
        {isExpanded ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'white', color: '#1c3d8c', fontWeight: 'bold' }}>S</Avatar>
              <Box sx={{ whiteSpace: 'nowrap' }}>
                <Typography variant="h6" fontWeight="900" color="white">DormHub</Typography>
                <Typography variant="caption" sx={{ color: '#cbd5e1' }}>Student Portal</Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={handleDesktopToggle} 
              sx={{ color: '#cbd5e1', '&:hover': { color: 'white', bgcolor: 'rgba(255, 255, 255, 0.1)' }, display: { xs: 'none', sm: 'flex' } }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </>
        ) : (
          <IconButton 
            onClick={handleDesktopToggle} 
            sx={{ color: '#cbd5e1', '&:hover': { color: 'white', bgcolor: 'rgba(255, 255, 255, 0.1)' }, display: { xs: 'none', sm: 'flex' } }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Box>

      <List sx={{ px: isExpanded ? 2 : 1.5, flexGrow: 1, mt: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          return (
            <Tooltip title={!isExpanded ? item.text : ""} placement="right" key={item.text} arrow>
              <ListItem 
                button 
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                sx={{
                  mb: 1,
                  borderRadius: '12px',
                  bgcolor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  color: isActive ? 'white' : '#94a3b8',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)', color: 'white' },
                  transition: 'all 0.2s ease-in-out',
                  justifyContent: isExpanded ? 'initial' : 'center',
                  px: isExpanded ? 2 : 0,
                  py: 1.2
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: '40px', justifyContent: isExpanded ? 'initial' : 'center' }}>
                  {item.icon}
                </ListItemIcon>
                {isExpanded && (
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ fontWeight: isActive ? '800' : '600', fontSize: '14px', whiteSpace: 'nowrap' }} 
                  />
                )}
              </ListItem>
            </Tooltip>
          );
        })}
      </List>

      <Box sx={{ p: isExpanded ? 2 : 1.5 }}>
        {/* ĐÃ DỊCH TOOLTIP ĐĂNG XUẤT */}
        <Tooltip title={!isExpanded ? "Logout" : ""} placement="right" arrow>
          <ListItem 
            button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              localStorage.removeItem('user_id');
              navigate('/login');
            }} 
            sx={{ 
              borderRadius: '12px', 
              color: '#94a3b8', 
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'white' },
              transition: 'all 0.2s ease-in-out',
              justifyContent: isExpanded ? 'initial' : 'center',
              px: isExpanded ? 2 : 0,
              py: 1.2
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: '40px', justifyContent: isExpanded ? 'initial' : 'center' }}>
              <LogoutIcon />
            </ListItemIcon>
            {isExpanded && (
              <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap' }} />
            )}
          </ListItem>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
      
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { sm: `calc(100% - ${currentWidth}px)` }, 
          ml: { sm: `${currentWidth}px` }, 
          bgcolor: 'white', 
          boxShadow: 'none', 
          borderBottom: '1px solid #f0f0f0',
          transition: 'width 0.3s, margin 0.3s'
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleMobileToggle} sx={{ mr: 2, display: { sm: 'none' }, color: '#1e293b' }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={2} alignItems="center">
            <NotificationBell
              onViewAll={() => navigate('/student/events')}
              storageKey="student_notifications_last_seen_event_id"
            />
            {}
            <Avatar sx={{ width: 35, height: 35, bgcolor: '#e2e8f0', color: '#1e293b', fontSize: '14px', fontWeight: 'bold' }}>ST</Avatar>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: currentWidth }, flexShrink: { sm: 0 }, transition: 'width 0.3s' }}>
        
        <Drawer 
          variant="temporary" 
          open={mobileOpen} 
          onClose={handleMobileToggle} 
          ModalProps={{ keepMounted: true }} 
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' } }}
        >
          {renderDrawerContent(true)}
        </Drawer>

        <Drawer 
          variant="permanent" 
          sx={{ 
            display: { xs: 'none', sm: 'block' }, 
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: currentWidth, border: 'none', transition: 'width 0.3s', overflowX: 'hidden' } 
          }} 
          open
        >
          {renderDrawerContent(desktopOpen)}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, width: { sm: `calc(100% - ${currentWidth}px)` }, mt: 7, transition: 'width 0.3s' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
