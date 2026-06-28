const { supabase } = require('../config/supabase');

/**
 * Middleware to check if authenticated user is an admin
 * Must be used AFTER authenticateUser middleware
 */
const requireAdmin = async (req, res, next) => {
    try {
        // req.user should be set by authenticateUser middleware
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required first'
            });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Admin access required'
            });
        }

        // Also check from database directly to be extra safe
        const { data: user, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (error || !user || user.role !== 'admin') {
            return res.status(403).json({
                message: 'Admin access required'
            });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({
            message: 'Authorization error',
            error: error.message
        });
    }
};

module.exports = { requireAdmin };