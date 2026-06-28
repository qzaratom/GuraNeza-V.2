const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const { createNotification } = require('../utils/notifications');

// ============================================
// GET - Get current user profile
// ============================================
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select(`
                *,
                subscription_plan:subscription_plan_id(*)
            `)
            .eq('id', req.user.id)
            .single();

        if (error) throw error;

        res.json({
            message: 'Profile fetched successfully',
            user: user
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            message: 'Error fetching profile',
            error: error.message
        });
    }
});

// ============================================
// PUT - Update user profile
// ============================================
router.put('/profile', authenticateUser, async (req, res) => {
    try {
        const { display_name, phone_numbers, location, bio } = req.body;
        
        // Build update object with only provided fields
        const updates = {};
        if (display_name) updates.display_name = display_name;
        if (phone_numbers) {
            // Ensure max 2 phone numbers
            if (Array.isArray(phone_numbers) && phone_numbers.length <= 2) {
                updates.phone_numbers = phone_numbers;
            } else {
                return res.status(400).json({
                    message: 'Maximum 2 phone numbers allowed'
                });
            }
        }
        if (location !== undefined) updates.location = location;
        if (bio !== undefined) updates.bio = bio;

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        // Create notification for profile update
        await createNotification(
            req.user.id,
            'profile_update',
            'Profile Updated',
            'Your profile information has been updated successfully'
        );

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// ============================================
// PUT - Update profile picture
// ============================================
router.put('/profile-picture', authenticateUser, async (req, res) => {
    try {
        const { profile_picture_url } = req.body;

        if (!profile_picture_url) {
            return res.status(400).json({
                message: 'Profile picture URL is required'
            });
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ profile_picture_url })
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            message: 'Profile picture updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile picture:', error);
        res.status(500).json({
            message: 'Error updating profile picture',
            error: error.message
        });
    }
});

// ============================================
// PUT - Update poster image
// ============================================
router.put('/poster', authenticateUser, async (req, res) => {
    try {
        const { poster_url } = req.body;

        if (!poster_url) {
            return res.status(400).json({
                message: 'Poster URL is required'
            });
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ poster_url })
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            message: 'Poster updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating poster:', error);
        res.status(500).json({
            message: 'Error updating poster',
            error: error.message
        });
    }
});

// ============================================
// GET - Get user by ID (public profile)
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select(`
                id,
                display_name,
                profile_picture_url,
                poster_url,
                location,
                bio,
                role,
                created_at,
                subscription_plan:subscription_plan_id(name, badge_vip, badge_verified_seller)
            `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json({
            message: 'User fetched successfully',
            user: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            message: 'Error fetching user',
            error: error.message
        });
    }
});

// ============================================
// GET - Admin: Get all users
// ============================================
router.get('/', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            message: 'Users fetched successfully',
            count: users.length,
            users: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// ============================================
// PUT - Admin: Change user role
// ============================================
router.put('/:id/role', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body;

        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({
                message: 'Valid role is required (user or admin)'
            });
        }

        const { data: updatedUser, error } = await supabaseAdmin
            .from('users')
            .update({ role })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // Notify user about role change
        await createNotification(
            req.params.id,
            'role_update',
            'Account Role Updated',
            `Your account role has been updated to ${role}`
        );

        res.json({
            message: 'User role updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            message: 'Error updating user role',
            error: error.message
        });
    }
});

// ============================================
// DELETE - Delete user account
// ============================================
router.delete('/account', authenticateUser, async (req, res) => {
    try {
        // Delete user from our table
        const { error } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', req.user.id);

        if (error) throw error;

        res.json({
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({
            message: 'Error deleting account',
            error: error.message
        });
    }
});

// GET - Get current user profile
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        const { data: profile, error } = await supabaseAdmin
            .from('users')
            .select('*, subscription_plan:subscription_plan_id(*)')
            .eq('id', req.user.id)
            .single();
        
        if (error) return res.status(500).json({ message: 'Error', error: error.message });
        
        res.json({ user: profile });
    } catch (e) {
        res.status(500).json({ message: 'Error', error: e.message });
    }
});

// PUT - Update profile
router.put('/profile', authenticateUser, async (req, res) => {
    try {
        const { display_name, phone_numbers, location, bio } = req.body;
        const updates = {};
        if (display_name !== undefined) updates.display_name = display_name;
        if (phone_numbers !== undefined) updates.phone_numbers = phone_numbers;
        if (location !== undefined) updates.location = location;
        if (bio !== undefined) updates.bio = bio;
        
        const { data: updated, error } = await supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', req.user.id)
            .select('*, subscription_plan:subscription_plan_id(*)')
            .single();
        
        if (error) return res.status(500).json({ message: 'Error', error: error.message });
        
        res.json({ message: 'Profile updated', user: updated });
    } catch (e) {
        res.status(500).json({ message: 'Error', error: e.message });
    }
});

// PUT - Update profile picture
router.put('/profile-picture', authenticateUser, async (req, res) => {
    try {
        const { profile_picture_url } = req.body;
        if (!profile_picture_url) return res.status(400).json({ message: 'URL required' });
        
        const { data: updated, error } = await supabaseAdmin
            .from('users')
            .update({ profile_picture_url })
            .eq('id', req.user.id)
            .select()
            .single();
        
        if (error) return res.status(500).json({ message: 'Error', error: error.message });
        
        res.json({ message: 'Picture updated', user: updated });
    } catch (e) {
        res.status(500).json({ message: 'Error', error: e.message });
    }
});

// PUT - Update poster
router.put('/poster', authenticateUser, async (req, res) => {
    try {
        const { poster_url } = req.body;
        if (!poster_url) return res.status(400).json({ message: 'URL required' });
        
        const { data: updated, error } = await supabaseAdmin
            .from('users')
            .update({ poster_url })
            .eq('id', req.user.id)
            .select()
            .single();
        
        if (error) return res.status(500).json({ message: 'Error', error: error.message });
        
        res.json({ message: 'Poster updated', user: updated });
    } catch (e) {
        res.status(500).json({ message: 'Error', error: e.message });
    }
});

module.exports = router;