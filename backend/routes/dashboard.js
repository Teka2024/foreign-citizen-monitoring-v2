const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ForeignCitizen = require('../models/ForeignCitizen');
const AccommodationHistory = require('../models/AccommodationHistory');
const Accommodation = require('../models/Accommodation');
const Alert = require('../models/Alert');

// ==================== DASHBOARD STATISTICS ====================
router.get('/stats', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats...');

    let citizenFilter = {};
    let checkinFilter = {};
    let accommodationFilter = {};
    let alertFilter = {};

    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      citizenFilter = { 'currentAccommodation.accommodationId': accommodationId };
      checkinFilter = { accommodation: accommodationId };
      accommodationFilter = { _id: accommodationId };
      alertFilter = { 'metadata.fromAccommodation': accommodationId };
    }

    const [
      totalCitizens,
      activeCitizens,
      checkedIn,
      checkedOut,
      highRisk,
      pendingAlerts,
      totalAccommodations,
    ] = await Promise.all([
      ForeignCitizen.countDocuments(citizenFilter),
      ForeignCitizen.countDocuments({ ...citizenFilter, status: 'active' }),
      AccommodationHistory.countDocuments({ ...checkinFilter, status: 'active' }),
      AccommodationHistory.countDocuments({ ...checkinFilter, status: 'checked_out' }),
      ForeignCitizen.countDocuments({
        ...citizenFilter,
        riskLevel: { $in: ['high', 'critical'] },
      }),
      Alert.countDocuments({ ...alertFilter, status: 'new' }),
      Accommodation.countDocuments(accommodationFilter),
    ]);

    const citizens = await ForeignCitizen.find({
      ...citizenFilter,
      status: { $in: ['active', 'overstayed'] },
    });

    const now = new Date();
    let overstayed = 0;

    for (const citizen of citizens) {
      const { expiryDate } = getDocumentExpiry(citizen);
      if (expiryDate && new Date(expiryDate) < now) {
        overstayed++;
      }
    }

    const stats = {
      totalCitizens: totalCitizens || 0,
      activeCitizens: activeCitizens || 0,
      checkedIn: checkedIn || 0,
      checkedOut: checkedOut || 0,
      overstayed: overstayed || 0,
      highRisk: highRisk || 0,
      pendingAlerts: pendingAlerts || 0,
      totalAccommodations: totalAccommodations || 0,
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

    const [active, expired, pending, suspended, overstayed, exited] = await Promise.all([
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
      const { expiryDate, docType } = getDocumentExpiry(citizen);

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

// ==================== RECENT CHECK-INS ====================
router.get('/recent-checkins', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching recent check-ins...');

    const limit = parseInt(req.query.limit) || 5;

    let checkinFilter = {};
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      checkinFilter = { accommodation: accommodationId };
    }

    const recentCheckIns = await AccommodationHistory.find({
      ...checkinFilter,
      status: 'active'
    })
      .populate('citizen', 'fullName passportNumber nationality photo')
      .populate('accommodation', 'name type address')
      .sort({ checkInDate: -1 })
      .limit(limit);

    console.log(`✅ Found ${recentCheckIns.length} recent check-ins`);

    res.status(200).json({
      success: true,
      data: recentCheckIns,
    });
  } catch (error) {
    console.error('❌ Recent check-ins error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== ✅ NEW: ACTIVITY TRENDS (DAILY / MONTHLY / YEARLY) ====================
router.get('/activity-trends', authenticate, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    console.log(`📊 Fetching activity trends — period: ${period}`);

    // ✅ Officer scope
    let citizenFilter = {};
    let checkinFilter = {};
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      citizenFilter = { 'currentAccommodation.accommodationId': accommodationId };
      checkinFilter = { accommodation: accommodationId };
    }

    const now = new Date();
    const result = [];

    // -------------------- DAILY (last 7 days) --------------------
    if (period === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
        const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);

        const [registrations, checkins, checkouts] = await Promise.all([
          ForeignCitizen.countDocuments({
            ...citizenFilter,
            createdAt: { $gte: start, $lte: end },
          }),
          AccommodationHistory.countDocuments({
            ...checkinFilter,
            checkInDate: { $gte: start, $lte: end },
          }),
          AccommodationHistory.countDocuments({
            ...checkinFilter,
            status: 'checked_out',
            actualCheckOutDate: { $gte: start, $lte: end },
          }),
        ]);

        result.push({
          label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          registrations: registrations || 0,
          checkins: checkins || 0,
          checkouts: checkouts || 0,
        });
      }
    }

    // -------------------- MONTHLY (last 6 months) --------------------
    else if (period === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

        const [registrations, checkins, checkouts] = await Promise.all([
          ForeignCitizen.countDocuments({
            ...citizenFilter,
            createdAt: { $gte: start, $lte: end },
          }),
          AccommodationHistory.countDocuments({
            ...checkinFilter,
            checkInDate: { $gte: start, $lte: end },
          }),
          AccommodationHistory.countDocuments({
            ...checkinFilter,
            status: 'checked_out',
            actualCheckOutDate: { $gte: start, $lte: end },
          }),
        ]);

        result.push({
          label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          registrations: registrations || 0,
          checkins: checkins || 0,
          checkouts: checkouts || 0,
        });
      }
    }

    // -------------------- YEARLY (last 3 years) --------------------
    else if (period === 'yearly') {
      for (let i = 2; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59);

        const [registrations, checkins, checkouts] = await Promise.all([
          ForeignCitizen.countDocuments({
            ...citizenFilter,
            createdAt: { $gte: start, $lte: end },
          }),
          AccommodationHistory.countDocuments({
            ...checkinFilter,
            checkInDate: { $gte: start, $lte: end },
          }),
          AccommodationHistory.countDocuments({
            ...checkinFilter,
            status: 'checked_out',
            actualCheckOutDate: { $gte: start, $lte: end },
          }),
        ]);

        result.push({
          label: String(year),
          registrations: registrations || 0,
          checkins: checkins || 0,
          checkouts: checkouts || 0,
        });
      }
    }

    // -------------------- FALLBACK --------------------
    else {
      return res.status(400).json({
        success: false,
        message: 'Invalid period. Use daily, monthly, or yearly.',
      });
    }

    console.log(`✅ Activity trends (${period}):`, result);

    res.status(200).json({
      success: true,
      period,
      data: result,
    });
  } catch (error) {
    console.error('❌ Activity trends error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ✅ Shared helper: pick the correct document expiry date + label
function getDocumentExpiry(citizen) {
  const map = {
    visa:  { date: citizen.visaExpiryDate,  label: 'Visa' },
    id:    { date: citizen.idExpiryDate,    label: 'ID' },
    stamp: { date: citizen.stampExpiryDate, label: 'Stamp' },
    other: { date: citizen.otherExpiryDate, label: 'Other Document' },
  };

  if (citizen.entryDocType && map[citizen.entryDocType]?.date) {
    return {
      expiryDate: map[citizen.entryDocType].date,
      docType:    map[citizen.entryDocType].label,
    };
  }

  for (const key of ['visa', 'id', 'stamp', 'other']) {
    if (map[key].date) {
      return { expiryDate: map[key].date, docType: map[key].label };
    }
  }

  return { expiryDate: null, docType: '' };
}

module.exports = router;