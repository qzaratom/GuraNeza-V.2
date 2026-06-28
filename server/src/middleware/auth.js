const { supabase } = require('../config/supabase');

/**
 * Middleware to authenticate users via Supabase JWT token
 */
const authenticateUser = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                message: 'No authorization header'
            });
        }

        // Extract the token (format: "Bearer <token>")
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                message: 'No token provided'
            });
        }

        // Verify the token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                message: 'Invalid or expired token',
                error: error?.message
            });
        }

        // Get full user profile from our users table
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

        if (profileError || !userProfile) {
            return res.status(404).json({
                message: 'User profile not found in database'
            });
        }

        // Attach user info to request object
        req.user = userProfile;
        req.authUser = user; // Original Supabase auth user
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            message: 'Authentication error',
            error: error.message
        });
    }
};

module.exports = { authenticateUser };