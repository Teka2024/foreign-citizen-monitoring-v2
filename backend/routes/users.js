const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Accommodation = require('../models/Accommodation');
const bcrypt = require('bcryptjs');

// ==================== GET ALL USERS ====================
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    
    let query = {};
    
    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { fullName: searchRegex },
        { username: searchRegex },
        { email: searchRegex },
      ];
    }
    
    // Role filter
    if (role) {
      query.role = role;
    }
    
    // Status filter
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('accommodationId', 'name address type status')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== GET USER BY ID ====================
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('accommodationId', 'name address type capacity status');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== SEARCH USERS ====================
router.get('/search', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query required' 
      });
    }

    const searchRegex = new RegExp(query, 'i');
    const users = await User.find({
      $or: [
        { fullName: searchRegex },
        { username: searchRegex },
        { email: searchRegex },
      ]
    })
    .select('-password')
    .populate('accommodationId', 'name address')
    .limit(20);

    res.status(200).json({ 
      success: true, 
      count: users.length,
      data: users 
    });
  } catch (error) {
    console.error('❌ Search users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== GET USER STATISTICS ====================
router.get('/stats/summary', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [totalUsers, activeUsers, adminCount, officerCount, viewerCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'officer' }),
      User.countDocuments({ role: 'viewer' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        adminCount,
        officerCount,
        viewerCount
      }
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== CREATE USER ====================
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { 
      fullName, 
      username, 
      email, 
      password, 
      role, 
      department, 
      phoneNumber, 
      accommodationId 
    } = req.body;

    console.log('📝 Creating user:', { fullName, username, email, role, accommodationId });

    // Validate required fields
    if (!fullName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, username, email, and password are required'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Process role-specific requirements
    let finalRole = role || 'viewer';
    let finalDepartment = department || '';
    let finalAccommodationId = accommodationId || null;

    // Officer validation
    if (finalRole === 'officer') {
      finalDepartment = 'accommodation';
      
      if (!finalAccommodationId) {
        return res.status(400).json({
          success: false,
          message: 'Accommodation is required for Officer role'
        });
      }

      // Verify accommodation exists
      const accommodation = await Accommodation.findById(finalAccommodationId);
      if (!accommodation) {
        return res.status(404).json({
          success: false,
          message: 'Accommodation not found'
        });
      }
    }

    // ✅ Hash password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('🔑 Hashed password for', username, ':', hashedPassword.substring(0, 20) + '...');

    // Create user with hashed password
    const user = new User({
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: finalRole,
      department: finalDepartment,
      phoneNumber: phoneNumber || '',
      accommodationId: finalAccommodationId,
      isActive: true,
      createdBy: req.userId
    });

    await user.save();

    // Populate accommodation details for response
    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate('accommodationId', 'name address type status');

    console.log('✅ User created:', user.username);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: populatedUser
    });
  } catch (error) {
    console.error('❌ Create user error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== UPDATE USER ====================
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { fullName, phoneNumber, department, role, isActive, accommodationId } = req.body;

    // Find user first
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Prevent updating the last admin
    if (existingUser.role === 'admin' && role && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change the last admin\'s role'
        });
      }
    }

    // If role is 'officer', validate accommodation
    let finalAccommodationId = accommodationId || existingUser.accommodationId;
    if (role === 'officer' && accommodationId) {
      const accommodation = await Accommodation.findById(accommodationId);
      if (!accommodation) {
        return res.status(404).json({
          success: false,
          message: 'Accommodation not found'
        });
      }
      finalAccommodationId = accommodationId;
    }

    // Handle department properly
    let finalDepartment = department || existingUser.department || '';
    if (role === 'officer') {
      finalDepartment = 'accommodation';
    }

    const updateData = {
      fullName: fullName || existingUser.fullName,
      phoneNumber: phoneNumber || existingUser.phoneNumber || '',
      department: finalDepartment,
      role: role || existingUser.role,
      isActive: isActive !== undefined ? isActive : existingUser.isActive,
      accommodationId: finalAccommodationId
    };

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .select('-password')
    .populate('accommodationId', 'name address type status');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('❌ Update user error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== CHANGE USER ROLE ====================
router.patch('/:id/role', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'officer', 'viewer'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, officer, or viewer'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Prevent changing the last admin's role
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change the last admin\'s role'
        });
      }
    }

    // If changing to officer, ensure accommodation is set
    if (role === 'officer' && !user.accommodationId) {
      return res.status(400).json({
        success: false,
        message: 'Please assign an accommodation to this officer'
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role changed to ${role}`,
      data: { 
        id: user._id, 
        username: user.username, 
        role: user.role 
      }
    });
  } catch (error) {
    console.error('❌ Change role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change user role',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== TOGGLE USER STATUS ====================
router.patch('/:id/toggle-status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Prevent deactivating the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ 
        role: 'admin', 
        isActive: true 
      });
      if (adminCount <= 1 && user.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the last active admin'
        });
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { 
        id: user._id,
        username: user.username,
        isActive: user.isActive 
      }
    });
  } catch (error) {
    console.error('❌ Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== RESET USER PASSWORD (Admin) ====================
router.patch('/:id/reset-password', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Hash new password using bcrypt
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== DELETE USER ====================
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Prevent deleting self
    if (user._id.toString() === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }

    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== BULK DELETE USERS ====================
router.delete('/bulk/delete', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs to delete'
      });
    }

    // Prevent deleting self
    if (userIds.includes(req.userId.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Check for admin users
    const adminUsers = await User.find({
      _id: { $in: userIds },
      role: 'admin'
    });

    if (adminUsers.length > 0) {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount - adminUsers.length < 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete all admin users. At least one admin must remain.'
        });
      }
    }

    const result = await User.deleteMany({
      _id: { $in: userIds }
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} users deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;