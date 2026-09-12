const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ForeignCitizen = require('../models/ForeignCitizen');
const AccommodationHistory = require('../models/AccommodationHistory');
const Alert = require('../models/Alert');

// ==================== DASHBOARD STATISTICS ====================
router.get('/stats', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats...');
    
    let citizenFilter = {};
    let checkinFilter = {};
    
    // ✅ Officer: Only see stats for their accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      citizenFilter = { 'currentAccommodation.accommodationId': accommodationId };
      checkinFilter = { accommodation: accommodationId };
    }

    const [
      totalCitizens,
      activeCitizens,
      checkedIn,
      overstayed,
      highRisk,
      pendingAlerts
    ] = await Promise.all([
      ForeignCitizen.countDocuments(citizenFilter),
      ForeignCitizen.countDocuments({ ...citizenFilter, status: 'active' }),
      AccommodationHistory.countDocuments({ ...checkinFilter, status: 'active' }),
      ForeignCitizen.countDocuments({ ...citizenFilter, status: 'overstayed' }),
      ForeignCitizen.countDocuments({ ...citizenFilter, riskLevel: { $in: ['high', 'critical'] } }),
      Alert.countDocuments({ status: 'pending' }),
    ]);

    const stats = {
      totalCitizens: totalCitizens || 0,
      activeCitizens: activeCitizens || 0,
      checkedIn: checkedIn || 0,
      overstayed: overstayed || 0,
      highRisk: highRisk || 0,
      pendingAlerts: pendingAlerts || 0,
    };

    console.log('✅ Dashboard stats:', stats);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== ACTIVITY TRENDS ====================
router.get('/trends', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching activity trends...');

    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const trends = [];
    const now = new Date();
    
    // ✅ Officer filter
    let checkinFilter = {};
    let citizenFilter = {};
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      checkinFilter = { accommodation: accommodationId };
      citizenFilter = { 'currentAccommodation.accommodationId': accommodationId };
    }
    
    for (let i = 0; i < months.length; i++) {
      const monthIndex = now.getMonth() - (5 - i);
      const d = new Date(now.getFullYear(), monthIndex, 1);
      
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      
      const entries = await ForeignCitizen.countDocuments({
        ...citizenFilter,
        createdAt: { $gte: start, $lte: end },
      });
      const checkins = await AccommodationHistory.countDocuments({
        ...checkinFilter,
        checkInDate: { $gte: start, $lte: end },
      });
      
      trends.push({
        month: months[i],
        entries: entries || 0,
        checkins: checkins || 0,
      });
    }

    console.log('✅ Activity trends:', trends);

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('❌ Trends error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== STATUS DISTRIBUTION ====================
router.get('/distribution', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching status distribution...');
    
    let filter = {};
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      filter = { 'currentAccommodation.accommodationId': accommodationId };
    }

    const [
      active,
      expired,
      pending,
      suspended,
      overstayed,
      exited
    ] = await Promise.all([
      ForeignCitizen.countDocuments({ ...filter, status: 'active' }),
      ForeignCitizen.countDocuments({ ...filter, status: 'expired' }),
      ForeignCitizen.countDocuments({ ...filter, status: 'pending' }),
      ForeignCitizen.countDocuments({ ...filter, status: 'suspended' }),
      ForeignCitizen.countDocuments({ ...filter, status: 'overstayed' }),
      ForeignCitizen.countDocuments({ ...filter, status: 'exited' }),
    ]);

    const distribution = [
      { name: 'Active', value: active || 0, color: '#4caf50' },
      { name: 'Overstayed', value: overstayed || 0, color: '#f44336' },
      { name: 'Expired', value: expired || 0, color: '#ff9800' },
      { name: 'Pending', value: pending || 0, color: '#2196f3' },
      { name: 'Suspended', value: suspended || 0, color: '#9e9e9e' },
      { name: 'Exited', value: exited || 0, color: '#795548' },
    ];

    const filteredDistribution = distribution.filter(d => d.value > 0);
    const result = filteredDistribution.length > 0 ? filteredDistribution : [
      { name: 'No Data', value: 1, color: '#e0e0e0' }
    ];

    console.log('✅ Status distribution:', result);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Distribution error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== OVERSTAY MONITORING ====================
router.get('/overstay-monitoring', authenticate, async (req, res) => {
  try {
    console.log('🔍 Running overstay monitoring...');
    
    let citizenFilter = {};
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      citizenFilter = { 'currentAccommodation.accommodationId': accommodationId };
    }
    
    const citizens = await ForeignCitizen.find({
      ...citizenFilter,
      status: { $in: ['active', 'overstayed'] }
    });
    
    const now = new Date();
    const overstayData = [];
    const expiringSoon = [];
    const overstayed = [];

    for (const citizen of citizens) {
      let expiryDate = null;
      let docType = '';
      
      if (citizen.entryDocType === 'visa') {
        expiryDate = citizen.visaExpiryDate;
        docType = 'Visa';
      } else if (citizen.entryDocType === 'id') {
        expiryDate = citizen.idExpiryDate;
        docType = 'ID';
      } else if (citizen.entryDocType === 'other') {
        expiryDate = citizen.otherExpiryDate;
        docType = 'Other Document';
      }

      if (expiryDate) {
        const expiry = new Date(expiryDate);
        const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        const isOverstayed = daysRemaining < 0;
        const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 7;

        const citizenInfo = {
          citizenId: citizen._id,
          fullName: citizen.fullName || `${citizen.firstName} ${citizen.lastName}`,
          passportNumber: citizen.passportNumber,
          docType: docType,
          expiryDate: expiry,
          daysRemaining: daysRemaining,
          isOverstayed: isOverstayed,
          isExpiringSoon: isExpiringSoon,
          status: citizen.status,
          riskLevel: citizen.riskLevel,
          currentAccommodation: citizen.currentAccommodation?.accommodationId?.name || 'N/A'
        };

        if (isOverstayed) {
          overstayed.push({
            ...citizenInfo,
            daysOverstayed: Math.abs(daysRemaining)
          });
        } else if (isExpiringSoon) {
          expiringSoon.push(citizenInfo);
        }
        overstayData.push(citizenInfo);
      }
    }

    const summary = {
      totalCitizensChecked: citizens.length,
      overstayedCount: overstayed.length,
      expiringSoonCount: expiringSoon.length,
    };

    console.log('📊 Overstay summary:', summary);

    res.status(200).json({
      success: true,
      data: {
        summary: summary,
        overstayed: overstayed,
        expiringSoon: expiringSoon,
        allData: overstayData
      }
    });
  } catch (error) {
    console.error('❌ Overstay monitoring error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;