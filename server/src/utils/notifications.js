const { supabaseAdmin } = require('../config/supabase');

/**
 * Create a notification for a user
 * @param {string} userId - UUID of the user
 * @param {string} type - Type of notification (e.g., 'new_product', 'chat_message', 'subscription_update')
 * @param {string} title - Notification title
 * @param {string} message - Notification message body
 * @param {string} referenceId - Optional ID of related entity
 * @param {string} referenceType - Optional type of related entity
 * @returns {object} - Created notification or error
 */
const createNotification = async (userId, type, title, message, referenceId = null, referenceType = null) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: userId,
                type: type,
                title: title,
                message: message,
                reference_id: referenceId,
                reference_type: referenceType
            })
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            notification: data
        };
    } catch (error) {
        console.error('Error creating notification:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - UUID of the notification
 * @param {string} userId - UUID of the user (for security)
 * @returns {object} - Updated notification or error
 */
const markAsRead = async (notificationId, userId) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            notification: data
        };
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - UUID of the user
 * @returns {object} - Result
 */
const markAllAsRead = async (userId) => {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;

        return {
            success: true,
            message: 'All notifications marked as read'
        };
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get user notifications
 * @param {string} userId - UUID of the user
 * @param {number} limit - Number of notifications to return
 * @param {number} offset - Offset for pagination
 * @returns {object} - Notifications array or error
 */
const getUserNotifications = async (userId, limit = 20, offset = 0) => {
    try {
        const { data, error, count } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
            success: true,
            notifications: data,
            total: count,
            unread_count: data.filter(n => !n.is_read).length
        };
    } catch (error) {
        console.error('Error getting notifications:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    createNotification,
    markAsRead,
    markAllAsRead,
    getUserNotifications
};