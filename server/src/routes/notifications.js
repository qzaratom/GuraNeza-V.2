const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { getUserNotifications, markAsRead, markAllAsRead } = require('../utils/notifications');

// ============================================
// GET - Get my notifications
// ============================================
router.get('/', authenticateUser, async (req, res) => {
    try {
        const { limit = 20, offset = 0, unread_only } = req.query;

        let query = supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        // Filter unread only if requested
        if (unread_only === 'true') {
            query = query.eq('is_read', false);
        }

        const { data: notifications, error, count } = await query;

        if (error) throw error;

        // Get unread count
        const { count: unreadCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', req.user.id)
            .eq('is_read', false);

        res.json({
            message: 'Notifications fetched successfully',
            total: count,
            unread_count: unreadCount || 0,
            limit: parseInt(limit),
            offset: parseInt(offset),
            notifications: notifications || []
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            message: 'Error fetching notifications',
            error: error.message
        });
    }
});

// ============================================
// GET - Get unread notification count
// ============================================
router.get('/unread-count', authenticateUser, async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', req.user.id)
            .eq('is_read', false);

        if (error) throw error;

        res.json({
            message: 'Unread count fetched successfully',
            unread_count: count || 0
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            message: 'Error fetching unread count',
            error: error.message
        });
    }
});

// ============================================
// PUT - Mark notification as read
// ============================================
router.put('/:id/read', authenticateUser, async (req, res) => {
    try {
        const result = await markAsRead(req.params.id, req.user.id);

        if (!result.success) {
            return res.status(400).json({
                message: 'Error marking notification as read',
                error: result.error
            });
        }

        res.json({
            message: 'Notification marked as read',
            notification: result.notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            message: 'Error marking notification as read',
            error: error.message
        });
    }
});

// ============================================
// PUT - Mark all notifications as read
// ============================================
router.put('/read-all', authenticateUser, async (req, res) => {
    try {
        const result = await markAllAsRead(req.user.id);

        if (!result.success) {
            return res.status(400).json({
                message: 'Error marking all notifications as read',
                error: result.error
            });
        }

        res.json({
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            message: 'Error marking all notifications as read',
            error: error.message
        });
    }
});

// ============================================
// DELETE - Delete a notification
// ============================================
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        // Check if notification exists and belongs to user
        const { data: notification, error: fetchError } = await supabase
            .from('notifications')
            .select('id')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (fetchError || !notification) {
            return res.status(404).json({
                message: 'Notification not found'
            });
        }

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.json({
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            message: 'Error deleting notification',
            error: error.message
        });
    }
});

// ============================================
// DELETE - Delete all notifications
// ============================================
router.delete('/', authenticateUser, async (req, res) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.json({
            message: 'All notifications deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting all notifications:', error);
        res.status(500).json({
            message: 'Error deleting all notifications',
            error: error.message
        });
    }
});

module.exports = router;