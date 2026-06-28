const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');

// ============================================
// POST - Auth Callback (After Google Sign In)
// ============================================
router.post('/callback', async (req, res) => {
    try {
        const { access_token, user } = req.body;

        console.log('========================================');
        console.log('AUTH CALLBACK RECEIVED');
        console.log('Email:', user?.email);
        console.log('========================================');

        if (!user || !user.email) {
            return res.status(400).json({
                message: 'User data from Google is required'
            });
        }

        // Check if user already exists (using admin to bypass RLS)
        const { data: existingUser, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching user:', fetchError);
            return res.status(500).json({
                message: 'Database error checking user',
                error: fetchError.message
            });
        }

        // EXISTING USER - UPDATE
        if (existingUser) {
            console.log('User exists, updating...');
            
            const { data: updatedUser, error: updateError } = await supabaseAdmin
                .from('users')
                .update({
                    google_id: user.id,
                    last_seen: new Date().toISOString(),
                    profile_picture_url: user.user_metadata?.avatar_url || existingUser.profile_picture_url
                })
                .eq('id', existingUser.id)
                .select('*, subscription_plan:subscription_plan_id(*)')
                .single();

            if (updateError) {
                console.error('Error updating user:', updateError);
                return res.status(500).json({
                    message: 'Error updating user',
                    error: updateError.message
                });
            }

            console.log('User updated:', updatedUser.email);
            return res.json({
                message: 'Login successful',
                is_new_user: false,
                user: updatedUser
            });
        }

        // NEW USER - CREATE (using admin to bypass RLS)
        console.log('Creating new user...');
        
        const { data: freePlan } = await supabaseAdmin
            .from('subscription_plans')
            .select('id')
            .eq('name', 'Free')
            .single();

        const newUser = {
            google_id: user.id,
            email: user.email,
            display_name: user.user_metadata?.full_name || user.email.split('@')[0],
            profile_picture_url: user.user_metadata?.avatar_url || null,
            role: 'user',
            subscription_plan_id: freePlan?.id || null,
            subscription_status: 'free',
            products_count: 0,
            last_seen: new Date().toISOString()
        };

        console.log('Inserting:', newUser.email, newUser.display_name);

        const { data: createdUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert(newUser)
            .select('*, subscription_plan:subscription_plan_id(*)')
            .single();

        if (createError) {
            console.error('Error creating user:', createError);
            return res.status(500).json({
                message: 'Error creating user in database',
                error: createError.message
            });
        }

        console.log('User created successfully! ID:', createdUser.id);
        console.log('========================================');

        return res.status(201).json({
            message: 'Account created successfully',
            is_new_user: true,
            user: createdUser
        });

    } catch (error) {
        console.error('UNEXPECTED ERROR:', error);
        return res.status(500).json({
            message: 'Unexpected error',
            error: error.message
        });
    }
});

// ============================================
// GET - Refresh user data
// ============================================
router.get('/refresh/:user_id', async (req, res) => {
    try {
        // Use admin to bypass RLS
        let { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*, subscription_plan:subscription_plan_id(*)')
            .eq('id', req.params.user_id)
            .maybeSingle();

        // If not found by ID, try by google_id
        if (!user) {
            const result = await supabaseAdmin
                .from('users')
                .select('*, subscription_plan:subscription_plan_id(*)')
                .eq('google_id', req.params.user_id)
                .maybeSingle();
            
            user = result.data;
            error = result.error;
        }

        if (error) {
            console.error('Error fetching user:', error);
            return res.status(500).json({ message: 'Database error', error: error.message });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found yet' });
        }

        console.log('User refreshed:', user.email);
        return res.json({ message: 'User refreshed', user: user });

    } catch (error) {
        console.error('Refresh error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;