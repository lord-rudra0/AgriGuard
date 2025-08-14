import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import UserSettings from '../models/UserSettings.js';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get user settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user settings or create default ones
    let userSettings = await UserSettings.findOne({ userId });
    
    if (!userSettings) {
      userSettings = new UserSettings({
        userId,
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          weatherAlerts: true,
          systemUpdates: true,
          marketingEmails: false
        },
        security: {
          twoFactorEnabled: false
        },
        system: {
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          temperatureUnit: 'celsius',
          autoSave: true
        }
      });
      await userSettings.save();
    }

    res.json({
      success: true,
      settings: {
        notifications: userSettings.notifications,
        security: userSettings.security,
        system: userSettings.system
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update profile information
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, username, email, phone, location, bio, avatar } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }

    // Check if username is already taken by another user
    if (username) {
      const existingUserByUsername = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUserByUsername) {
        return res.status(400).json({ success: false, message: 'Username already in use' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name: name || undefined,
          username: username || undefined,
          email: email || undefined,
          phone: phone || undefined,
          location: location || undefined,
          bio: bio || undefined,
          avatar: avatar || undefined,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update security settings
router.put('/security', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword, twoFactorEnabled } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required' });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update password
      await User.findByIdAndUpdate(userId, {
        password: hashedNewPassword,
        updatedAt: new Date()
      });
    }

    // Update security settings
    let userSettings = await UserSettings.findOne({ userId });
    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    userSettings.security = {
      ...userSettings.security,
      twoFactorEnabled: twoFactorEnabled !== undefined ? twoFactorEnabled : userSettings.security?.twoFactorEnabled || false
    };

    await userSettings.save();

    res.json({
      success: true,
      message: 'Security settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update notification preferences
router.put('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationSettings = req.body;

    let userSettings = await UserSettings.findOne({ userId });
    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    userSettings.notifications = {
      ...userSettings.notifications,
      ...notificationSettings
    };

    await userSettings.save();

    res.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update system preferences
router.put('/system', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const systemSettings = req.body;

    let userSettings = await UserSettings.findOne({ userId });
    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    userSettings.system = {
      ...userSettings.system,
      ...systemSettings
    };

    await userSettings.save();

    res.json({
      success: true,
      message: 'System preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete account (optional advanced feature)
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify password before deletion
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: 'Password is incorrect' });
    }

    // Delete user and associated settings
    await User.findByIdAndDelete(userId);
    await UserSettings.findOneAndDelete({ userId });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
