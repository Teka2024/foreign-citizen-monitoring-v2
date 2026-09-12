import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';

const StatCard = ({ title, value, icon, color, trend, subtitle }) => {
  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}15`,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          {trend && (
            <Chip
              label={trend}
              size="small"
              color={trend.startsWith('+') ? 'success' : trend.startsWith('-') ? 'error' : 'default'}
              sx={{ fontWeight: 500 }}
            />
          )}
        </Box>
        
        <Typography
          variant="h4"
          sx={{
            mt: 2,
            fontWeight: 700,
            fontSize: '2rem',
          }}
        >
          {value?.toLocaleString() || 0}
        </Typography>
        
        <Typography variant="body2" color="textSecondary">
          {title}
        </Typography>
        
        {subtitle && (
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;