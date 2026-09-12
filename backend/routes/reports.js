const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ForeignCitizen = require('../models/ForeignCitizen');
const Accommodation = require('../models/Accommodation');
const AccommodationHistory = require('../models/AccommodationHistory');
const Alert = require('../models/Alert');

// ==================== GENERATE REPORTS ====================
router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    console.log('📊 Report request:', { startDate, endDate, type, role: req.user.role });

    let data = [];
    let reportType = type || 'citizens';

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59')
        }
      };
    }

    // ✅ Officer: Only see data for their accommodation
    let accommodationFilter = {};
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      accommodationFilter = { 'currentAccommodation.accommodationId': accommodationId };
    }

    // Get data based on report type
    switch (reportType) {
      case 'citizens':
        data = await ForeignCitizen.find({
          ...dateFilter,
          ...accommodationFilter
        })
          .select('firstName lastName passportNumber nationality visaType entryDate status riskLevel')
          .limit(100);
        break;

      case 'accommodations':
        let accFilter = {};
        if (req.user.role === 'officer' && req.user.accommodationId) {
          const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
          accFilter._id = accommodationId;
        }
        data = await Accommodation.find({
          ...dateFilter,
          ...accFilter
        })
          .select('name type address capacity currentOccupants status')
          .limit(100);
        break;

      case 'checkins':
        let checkinFilter = {};
        if (req.user.role === 'officer' && req.user.accommodationId) {
          const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
          checkinFilter.accommodation = accommodationId;
        }
        data = await AccommodationHistory.find({
          ...dateFilter,
          ...checkinFilter
        })
          .populate('citizen', 'fullName passportNumber')
          .populate('accommodation', 'name')
          .select('checkInDate expectedCheckOutDate purpose status roomNumber')
          .limit(100);
        break;

      case 'alerts':
        let alertFilter = {};
        if (req.user.role === 'officer' && req.user.accommodationId) {
          const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
          alertFilter = {
            $or: [
              { 'metadata.toAccommodation': accommodationId },
              { 'metadata.fromAccommodation': accommodationId }
            ]
          };
        }
        data = await Alert.find({
          ...dateFilter,
          ...alertFilter
        })
          .populate('citizenId', 'fullName passportNumber')
          .select('title description type severity status createdAt')
          .limit(100);
        break;

      default:
        data = [];
    }

    console.log(`📊 Found ${data.length} records for ${reportType}`);

    res.status(200).json({
      success: true,
      data: data,
      count: data.length,
      reportType: reportType,
      filters: { startDate, endDate }
    });

  } catch (error) {
    console.error('❌ Report error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== EXPORT REPORT (CSV) ====================
router.get('/export', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    // Get the report data first
    let data = [];
    let reportType = type || 'citizens';

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59')
        }
      };
    }

    // Officer filter
    let accommodationFilter = {};
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      accommodationFilter = { 'currentAccommodation.accommodationId': accommodationId };
    }

    switch (reportType) {
      case 'citizens':
        data = await ForeignCitizen.find({
          ...dateFilter,
          ...accommodationFilter
        }).lean();
        break;
      case 'accommodations':
        let accFilter = {};
        if (req.user.role === 'officer' && req.user.accommodationId) {
          const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
          accFilter._id = accommodationId;
        }
        data = await Accommodation.find({
          ...dateFilter,
          ...accFilter
        }).lean();
        break;
      case 'checkins':
        let checkinFilter = {};
        if (req.user.role === 'officer' && req.user.accommodationId) {
          const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
          checkinFilter.accommodation = accommodationId;
        }
        data = await AccommodationHistory.find({
          ...dateFilter,
          ...checkinFilter
        })
          .populate('citizen', 'fullName passportNumber')
          .populate('accommodation', 'name')
          .lean();
        break;
      case 'alerts':
        let alertFilter = {};
        if (req.user.role === 'officer' && req.user.accommodationId) {
          const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
          alertFilter = {
            $or: [
              { 'metadata.toAccommodation': accommodationId },
              { 'metadata.fromAccommodation': accommodationId }
            ]
          };
        }
        data = await Alert.find({
          ...dateFilter,
          ...alertFilter
        })
          .populate('citizenId', 'fullName passportNumber')
          .lean();
        break;
      default:
        data = [];
    }

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data found to export'
      });
    }

    // Generate CSV
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        let val = row[header];
        if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        }
        if (typeof val === 'string' && val.includes(',')) {
          val = `"${val}"`;
        }
        return val || '';
      });
      csvRows.push(values.join(','));
    }

    const csv = csvRows.join('\n');
    const filename = `report-${reportType}-${startDate}-${endDate}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);

  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;