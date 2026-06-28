const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const { createNotification } = require('../utils/notifications');

// ============================================
// GET - Get all subscription plans (public)
// ============================================
router.get('/plans', async (req, res) => {
    try {
        const { data: plans, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('price_rwf', { ascending: true });

        if (error) throw error;

        res.json({
            message: 'Subscription plans fetched successfully',
            plans: plans
        });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({
            message: 'Error fetching subscription plans',
            error: error.message
        });
    }
});

// ============================================
// GET - Get current user subscription
// ============================================
router.get('/my-subscription', authenticateUser, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select(`
                subscription_status,
                subscription_plan:subscription_plan_id(*)
            `)
            .eq('id', req.user.id)
            .single();

        if (error) throw error;

        res.json({
            message: 'Subscription fetched successfully',
            subscription: {
                status: user.subscription_status,
                plan: user.subscription_plan
            }
        });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({
            message: 'Error fetching subscription',
            error: error.message
        });
    }
});

// ============================================
// POST - Request subscription upgrade
// ============================================
router.post('/upgrade', authenticateUser, async (req, res) => {
    try {
        const { plan_id } = req.body;

        if (!plan_id) {
            return res.status(400).json({
                message: 'Plan ID is required'
            });
        }

        // Check if plan exists
        const { data: plan, error: planError } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', plan_id)
            .eq('is_active', true)
            .single();

        if (planError || !plan) {
            return res.status(404).json({
                message: 'Subscription plan not found'
            });
        }

        // Check if user already has this plan
        if (req.user.subscription_plan_id === plan_id && req.user.subscription_status === 'active') {
            return res.status(400).json({
                message: 'You are already subscribed to this plan'
            });
        }

        // Check if there's a pending request
        const { data: existingRequest } = await supabase
            .from('subscription_requests')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('status', 'pending')
            .single();

        if (existingRequest) {
            return res.status(400).json({
                message: 'You already have a pending subscription request'
            });
        }

        // Get current payment code from admin settings
        const { data: paymentSetting } = await supabase
            .from('payment_settings')
            .select('payment_code')
            .eq('is_active', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        // Create subscription request
        const { data: request, error } = await supabase
            .from('subscription_requests')
            .insert({
                user_id: req.user.id,
                plan_id: plan_id,
                payment_code: paymentSetting?.payment_code || null,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // Update user subscription status to pending
        await supabaseAdmin
            .from('users')
            .update({ subscription_status: 'pending' })
            .eq('id', req.user.id);

        // Create admin chat for this subscription request
        const { data: chat } = await supabase
            .from('chats')
            .insert({
                chat_type: 'subscription',
                participant_1: req.user.id,
                participant_2: null, // Admin will be assigned later
                last_message: `Subscription upgrade request: ${plan.name} plan (${plan.price_rwf} RWF)`
            })
            .select()
            .single();

        // Update request with chat_id
        if (chat) {
            await supabase
                .from('subscription_requests')
                .update({ admin_chat_id: chat.id })
                .eq('id', request.id);
        }

        // Auto-send message in chat
        if (chat) {
            await supabase
                .from('messages')
                .insert({
                    chat_id: chat.id,
                    sender_id: req.user.id,
                    content: `Hi, I would like to upgrade to the ${plan.name} plan (${plan.price_rwf} RWF). Payment code: ${paymentSetting?.payment_code || 'Not set'}`
                });
        }

        // Notify admins
        const { data: admins } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'admin');

        if (admins) {
            for (const admin of admins) {
                await createNotification(
                    admin.id,
                    'subscription_request',
                    'New Subscription Request',
                    `${req.user.display_name} wants to upgrade to ${plan.name} plan`,
                    request.id,
                    'subscription'
                );
            }
        }

        // Notify user
        await createNotification(
            req.user.id,
            'subscription_requested',
            'Upgrade Request Sent',
            `Your request to upgrade to ${plan.name} plan has been sent. Admin will contact you shortly.`,
            request.id,
            'subscription'
        );

        res.status(201).json({
            message: 'Subscription upgrade request sent successfully',
            request: request,
            payment_code: paymentSetting?.payment_code || null
        });
    } catch (error) {
        console.error('Error requesting upgrade:', error);
        res.status(500).json({
            message: 'Error requesting upgrade',
            error: error.message
        });
    }
});

// ============================================
// GET - Get my subscription requests
// ============================================
router.get('/my-requests', authenticateUser, async (req, res) => {
    try {
        const { data: requests, error } = await supabase
            .from('subscription_requests')
            .select(`
                *,
                plan:plan_id(*)
            `)
            .eq('user_id', req.user.id)
            .order('requested_at', { ascending: false });

        if (error) throw error;

        res.json({
            message: 'Subscription requests fetched successfully',
            requests: requests || []
        });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({
            message: 'Error fetching subscription requests',
            error: error.message
        });
    }
});

// ============================================
// GET - Admin: Get all subscription requests
// ============================================
router.get('/admin/requests', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let query = supabase
            .from('subscription_requests')
            .select(`
                *,
                user:user_id(
                    id,
                    display_name,
                    email,
                    phone_numbers,
                    subscription_status
                ),
                plan:plan_id(*)
            `)
            .order('requested_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        if (status) {
            query = query.eq('status', status);
        }

        const { data: requests, error, count } = await query;

        if (error) throw error;

        res.json({
            message: 'Subscription requests fetched successfully',
            total: count,
            requests: requests || []
        });
    } catch (error) {
        console.error('Error fetching admin requests:', error);
        res.status(500).json({
            message: 'Error fetching subscription requests',
            error: error.message
        });
    }
});

// ============================================
// PUT - Admin: Approve/Reject subscription
// ============================================
router.put('/admin/requests/:id', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { status, admin_response } = req.body;

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                message: 'Status must be approved or rejected'
            });
        }

        // Get the request
        const { data: request, error: fetchError } = await supabase
            .from('subscription_requests')
            .select('*, plan:plan_id(*)')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !request) {
            return res.status(404).json({
                message: 'Subscription request not found'
            });
        }

        // Update request
        const { data: updatedRequest, error } = await supabaseAdmin
            .from('subscription_requests')
            .update({
                status: status,
                admin_response: admin_response || null,
                resolved_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // If approved, update user's subscription
        if (status === 'approved') {
            await supabaseAdmin
                .from('users')
                .update({
                    subscription_plan_id: request.plan_id,
                    subscription_status: 'active'
                })
                .eq('id', request.user_id);
        } else {
            // If rejected, set back to free
            await supabaseAdmin
                .from('users')
                .update({ subscription_status: 'active' })
                .eq('id', request.user_id);
        }

        // Send message in admin chat
        if (request.admin_chat_id) {
            const messageContent = status === 'approved'
                ? `Your subscription to ${request.plan?.name} plan has been approved! ${admin_response || ''}`
                : `Your subscription request for ${request.plan?.name} plan has been rejected. ${admin_response || ''}`;

            await supabase
                .from('messages')
                .insert({
                    chat_id: request.admin_chat_id,
                    sender_id: req.user.id,
                    content: messageContent
                });
        }

        // Notify user
        const notificationTitle = status === 'approved' 
            ? 'Subscription Approved!' 
            : 'Subscription Rejected';
        
        const notificationMessage = status === 'approved'
            ? `Your upgrade to ${request.plan?.name} plan has been approved!`
            : `Your upgrade request for ${request.plan?.name} plan was rejected. ${admin_response || ''}`;

        await createNotification(
            request.user_id,
            'subscription_update',
            notificationTitle,
            notificationMessage,
            request.id,
            'subscription'
        );

        res.json({
            message: `Subscription ${status} successfully`,
            request: updatedRequest
        });
    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).json({
            message: 'Error updating subscription',
            error: error.message
        });
    }
});

// ============================================
// PUT - Admin: Update subscription plan
// ============================================
router.put('/admin/plans/:id', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const {
            name,
            price_rwf,
            max_products,
            badge_verified_seller,
            badge_verified_product,
            badge_verified_shop,
            badge_vip,
            is_active
        } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (price_rwf !== undefined) updates.price_rwf = price_rwf;
        if (max_products !== undefined) updates.max_products = max_products;
        if (badge_verified_seller !== undefined) updates.badge_verified_seller = badge_verified_seller;
        if (badge_verified_product !== undefined) updates.badge_verified_product = badge_verified_product;
        if (badge_verified_shop !== undefined) updates.badge_verified_shop = badge_verified_shop;
        if (badge_vip !== undefined) updates.badge_vip = badge_vip;
        if (is_active !== undefined) updates.is_active = is_active;

        const { data: plan, error } = await supabaseAdmin
            .from('subscription_plans')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            message: 'Plan updated successfully',
            plan: plan
        });
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({
            message: 'Error updating plan',
            error: error.message
        });
    }
});

// ============================================
// GET/PUT - Admin: Payment settings
// ============================================
router.get('/admin/payment-code', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { data: setting } = await supabase
            .from('payment_settings')
            .select('*')
            .eq('is_active', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        res.json({
            message: 'Payment code fetched successfully',
            payment_code: setting?.payment_code || null
        });
    } catch (error) {
        console.error('Error fetching payment code:', error);
        res.status(500).json({
            message: 'Error fetching payment code',
            error: error.message
        });
    }
});

router.put('/admin/payment-code', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { payment_code } = req.body;

        if (!payment_code) {
            return res.status(400).json({
                message: 'Payment code is required'
            });
        }

        // Deactivate all existing codes
        await supabaseAdmin
            .from('payment_settings')
            .update({ is_active: false })
            .eq('is_active', true);

        // Create new payment code
        const { data: setting, error } = await supabaseAdmin
            .from('payment_settings')
            .insert({
                payment_code: payment_code,
                updated_by: req.user.id,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            message: 'Payment code updated successfully',
            payment_code: setting.payment_code
        });
    } catch (error) {
        console.error('Error updating payment code:', error);
        res.status(500).json({
            message: 'Error updating payment code',
            error: error.message
        });
    }
});

module.exports = router;