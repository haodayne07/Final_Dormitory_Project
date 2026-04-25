import React from 'react';
import { 
  Card, CardContent, CardActions, Typography, 
  Box, Chip, Stack 
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import InfoIcon from '@mui/icons-material/Info';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BuildIcon from '@mui/icons-material/Build';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

// Cấu hình màu sắc và icon dựa trên loại thông báo
const getEventConfig = (type) => {
  switch (type) {
    case 'info': return { color: '#1e3a8a', bgColor: '#eff6ff', icon: <InfoIcon />, label: 'Thông tin' };
    case 'warning': return { color: '#b45309', bgColor: '#fffbeb', icon: <WarningAmberIcon />, label: 'Cảnh báo' };
    case 'maintenance': return { color: '#c2410c', bgColor: '#fff7ed', icon: <BuildIcon />, label: 'Bảo trì' };
    case 'event': return { color: '#047857', bgColor: '#ecfdf5', icon: <EventAvailableIcon />, label: 'Sự kiện' };
    default: return { color: '#475569', bgColor: '#f8fafc', icon: <CampaignIcon />, label: 'Chung' };
  }
};

const EventCard = ({ event, actions }) => {
  const config = getEventConfig(event.type);

  return (
    <Card sx={{ 
      height: '100%', // Quan trọng: Thẻ chiếm toàn bộ chiều cao của Grid item
      display: 'flex', 
      flexDirection: 'column', 
      borderRadius: '16px',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      '&:hover': { 
        transform: 'translateY(-5px)', 
        boxShadow: '0 12px 24px rgba(0,0,0,0.1)' 
      }
    }}>
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box sx={{ 
            p: 1.5, borderRadius: '12px', 
            bgcolor: config.bgColor, color: config.color,
            display: 'flex', alignItems: 'center'
          }}>
            {config.icon}
          </Box>
          <Chip 
            label={config.label} 
            size="small" 
            sx={{ 
              fontWeight: 'bold', bgcolor: config.bgColor, color: config.color,
              border: `1px solid ${config.color}20` 
            }} 
          />
        </Stack>

        {/* Giới hạn tiêu đề tối đa 2 dòng */}
        <Typography variant="h6" sx={{ 
          fontWeight: '700', mb: 1, color: '#1e293b',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', textOverflow: 'ellipsis',
          height: '3.2em', // Giữ chiều cao cố định cho tiêu đề
          lineHeight: '1.6em'
        }}>
          {event.title}
        </Typography>

        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2, fontWeight: '500' }}>
          📅 {event.event_date || 'N/A'} • ID: #{event.event_id}
        </Typography>

        {/* Giới hạn mô tả tối đa 3 dòng */}
        <Typography variant="body2" sx={{ 
          color: '#475569', lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', textOverflow: 'ellipsis',
          height: '4.8em' // Giữ chiều cao cố định cho phần mô tả
        }}>
          {event.description}
        </Typography>
      </CardContent>

      {/* Nếu có nút bấm (như nút Xóa của Admin), nó sẽ nằm ở dưới cùng */}
      {actions && (
        <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

export default EventCard;