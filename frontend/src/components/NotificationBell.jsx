import React, { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  Typography
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InfoIcon from '@mui/icons-material/Info';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BuildIcon from '@mui/icons-material/Build';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api/events';
const DEFAULT_STORAGE_KEY = 'student_notifications_last_seen_event_id';

const getTypeMeta = (type) => {
  switch (type) {
    case 'warning':
      return { icon: <WarningAmberIcon sx={{ color: '#d97706', fontSize: 20 }} />, label: 'Warning' };
    case 'maintenance':
      return { icon: <BuildIcon sx={{ color: '#dc2626', fontSize: 20 }} />, label: 'Maintenance' };
    default:
      return { icon: <InfoIcon sx={{ color: '#2563eb', fontSize: 20 }} />, label: 'Information' };
  }
};

export default function NotificationBell({ onViewAll, storageKey = DEFAULT_STORAGE_KEY }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSeenId, setLastSeenId] = useState(() => Number(localStorage.getItem(storageKey) || 0));

  useEffect(() => {
    let isMounted = true;

    axios.get(API_URL)
      .then((res) => {
        if (!isMounted) return;
        const sortedEvents = [...res.data]
          .filter((event) => event.status !== 'inactive')
          .sort((a, b) => b.event_id - a.event_id);
        setEvents(sortedEvents);
      })
      .catch((err) => console.error('Error loading notifications:', err))
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const open = Boolean(anchorEl);
  const latestEventId = events[0]?.event_id || 0;
  const unreadCount = events.filter((event) => event.event_id > lastSeenId).length;
  const previewEvents = events.slice(0, 5);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    if (latestEventId > lastSeenId) {
      localStorage.setItem(storageKey, String(latestEventId));
      setLastSeenId(latestEventId);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewAll = () => {
    handleClose();
    onViewAll();
  };

  return (
    <>
      <IconButton sx={{ color: '#64748b' }} onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error" max={9}>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 360,
            maxWidth: 'calc(100vw - 24px)',
            borderRadius: '16px',
            mt: 1.5,
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)'
          }
        }}
      >
        <Box sx={{ px: 2.5, py: 2 }}>
          <Typography variant="subtitle1" fontWeight="800" color="#1e293b">
            Notifications
          </Typography>
          <Typography variant="body2" color="#64748b">
            Latest announcements from the dormitory board
          </Typography>
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : previewEvents.length === 0 ? (
          <Box sx={{ px: 2.5, py: 4 }}>
            <Typography variant="body2" color="#94a3b8" textAlign="center">
              No notifications available.
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {previewEvents.map((event) => {
              const typeMeta = getTypeMeta(event.type);
              const isUnread = event.event_id > lastSeenId;

              return (
                <ListItem
                  key={event.event_id}
                  alignItems="flex-start"
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    bgcolor: isUnread ? '#f8fafc' : 'white',
                    borderLeft: isUnread ? '3px solid #1c3d8c' : '3px solid transparent'
                  }}
                >
                  <Box sx={{ pt: 0.5, mr: 1.5 }}>
                    {typeMeta.icon}
                  </Box>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <Typography variant="body2" fontWeight="700" color="#1e293b">
                          {event.title}
                        </Typography>
                        <Typography variant="caption" color="#94a3b8" sx={{ whiteSpace: 'nowrap' }}>
                          {event.event_date}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          variant="caption"
                          sx={{ display: 'block', color: '#1c3d8c', fontWeight: '700', mt: 0.25, mb: 0.5 }}
                        >
                          {typeMeta.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="#64748b"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {event.description}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}

        <Divider />

        <Box sx={{ p: 1.5 }}>
          <Button
            onClick={handleViewAll}
            fullWidth
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: '700', color: '#1c3d8c' }}
          >
            View all announcements
          </Button>
        </Box>
      </Menu>
    </>
  );
}
