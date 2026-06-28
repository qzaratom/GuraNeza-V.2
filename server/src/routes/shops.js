const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const { createNotification } = require('../utils/notifications');

// ============================================
// POST - Create a shop (one per user)
// ============================================
router.post('/', authenticateUser, async (req, res) => {
    try {
        // Check if user already has a shop
        const { data: existingShop } = await supabase
            .from('shops')
            .select('id')
            .eq('owner_id', req.user.id)
            .single();

        if (existingShop) {
            return res.status(400).json({
                message: 'You already have a shop. Each user is limited to one shop.'
            });
        }

        const {
            shop_name,
            description,
            category,
            location,
            phone_numbers,
            email,
            poster_url
        } = req.body;

        // Validation
        if (!shop_name) {
            return res.status(400).json({
                message: 'Shop name is required'
            });
        }

        // Validate phone numbers
        if (phone_numbers && phone_numbers.length > 2) {
            return res.status(400).json({
                message: 'Maximum 2 phone numbers allowed'
            });
        }

        // Create shop
        const { data: shop, error } = await supabase
            .from('shops')
            .insert({
                owner_id: req.user.id,
                shop_name,
                description,
                category,
                location,
                phone_numbers: phone_numbers || [],
                email,
                poster_url,
                is_verified: false
            })
            .select()
            .single();

        if (error) throw error;

        // Update user's shop_id
        await supabaseAdmin
            .from('users')
            .update({ shop_id: shop.id })
            .eq('id', req.user.id);

        // Create notification
        await createNotification(
            req.user.id,
            'shop_created',
            'Shop Created',
            `Your shop "${shop_name}" has been created successfully`,
            shop.id,
            'shop'
        );

        res.status(201).json({
            message: 'Shop created successfully',
            shop: shop
        });
    } catch (error) {
        console.error('Error creating shop:', error);
        res.status(500).json({
            message: 'Error creating shop',
            error: error.message
        });
    }
});

// ============================================
// GET - Get all shops (public)
// ============================================
router.get('/', async (req, res) => {
    try {
        const { category, limit = 20, offset = 0 } = req.query;

        let query = supabase
            .from('shops')
            .select(`
                *,
                owner:users!shops_owner_id_fkey(
                    id,
                    display_name,
                    profile_picture_url,
                    subscription_plan:subscription_plan_id(
                        name,
                        badge_verified_shop,
                        badge_vip
                    )
                ),
                products:products(count)
            `, { count: 'exact' })
            .order('created_at', { ascending: false });

        // Apply filters
        if (category) {
            query = query.eq('category', category);
        }

        // Apply pagination
        query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        const { data: shops, error, count } = await query;

        if (error) throw error;

        res.json({
            message: 'Shops fetched successfully',
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            shops: shops
        });
    } catch (error) {
        console.error('Error fetching shops:', error);
        res.status(500).json({
            message: 'Error fetching shops',
            error: error.message
        });
    }
});

// ============================================
// GET - Get my shop
// ============================================
router.get('/my-shop', authenticateUser, async (req, res) => {
    try {
        const { data: shop, error } = await supabase
            .from('shops')
            .select(`
                *,
                products:products(*)
            `)
            .eq('owner_id', req.user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    message: 'You do not have a shop yet'
                });
            }
            throw error;
        }

        res.json({
            message: 'Your shop fetched successfully',
            shop: shop
        });
    } catch (error) {
        console.error('Error fetching your shop:', error);
        res.status(500).json({
            message: 'Error fetching your shop',
            error: error.message
        });
    }
});

// ============================================
// GET - Get shop by ID
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { data: shop, error } = await supabase
            .from('shops')
            .select(`
                *,
                owner:users!shops_owner_id_fkey(
                    id,
                    display_name,
                    profile_picture_url,
                    created_at,
                    subscription_plan:subscription_plan_id(
                        name,
                        badge_verified_shop,
                        badge_vip,
                        badge_verified_seller
                    )
                ),
                products:products(*)
            `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        if (!shop) {
            return res.status(404).json({
                message: 'Shop not found'
            });
        }

        res.json({
            message: 'Shop fetched successfully',
            shop: shop
        });
    } catch (error) {
        console.error('Error fetching shop:', error);
        res.status(500).json({
            message: 'Error fetching shop',
            error: error.message
        });
    }
});

// ============================================
// PUT - Update shop
// ============================================
router.put('/:id', authenticateUser, async (req, res) => {
    try {
        // Check if shop exists and belongs to user
        const { data: existingShop, error: fetchError } = await supabase
            .from('shops')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !existingShop) {
            return res.status(404).json({
                message: 'Shop not found'
            });
        }

        if (existingShop.owner_id !== req.user.id) {
            return res.status(403).json({
                message: 'You can only update your own shop'
            });
        }

        const {
            shop_name,
            description,
            category,
            location,
            phone_numbers,
            email,
            poster_url
        } = req.body;

        // Build updates object
        const updates = {};
        if (shop_name) updates.shop_name = shop_name;
        if (description !== undefined) updates.description = description;
        if (category) updates.category = category;
        if (location !== undefined) updates.location = location;
        if (phone_numbers) {
            if (phone_numbers.length > 2) {
                return res.status(400).json({
                    message: 'Maximum 2 phone numbers allowed'
                });
            }
            updates.phone_numbers = phone_numbers;
        }
        if (email !== undefined) updates.email = email;
        if (poster_url) updates.poster_url = poster_url;

        const { data: updatedShop, error } = await supabase
            .from('shops')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // Create notification
        await createNotification(
            req.user.id,
            'shop_updated',
            'Shop Updated',
            `Your shop "${updatedShop.shop_name}" has been updated`,
            updatedShop.id,
            'shop'
        );

        res.json({
            message: 'Shop updated successfully',
            shop: updatedShop
        });
    } catch (error) {
        console.error('Error updating shop:', error);
        res.status(500).json({
            message: 'Error updating shop',
            error: error.message
        });
    }
});

// ============================================
// DELETE - Delete shop
// ============================================
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        // Check if shop exists and belongs to user
        const { data: shop, error: fetchError } = await supabase
            .from('shops')
            .select('owner_id, shop_name')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !shop) {
            return res.status(404).json({
                message: 'Shop not found'
            });
        }

        // Allow admin to delete any shop
        if (shop.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'You can only delete your own shop'
            });
        }

        // Update user's shop_id to null
        await supabaseAdmin
            .from('users')
            .update({ shop_id: null })
            .eq('id', shop.owner_id);

        // Delete shop (cascade will handle products with SET NULL)
        const { error } = await supabase
            .from('shops')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        // Create notification
        await createNotification(
            shop.owner_id,
            'shop_deleted',
            'Shop Deleted',
            `Your shop "${shop.shop_name}" has been deleted`
        );

        res.json({
            message: 'Shop deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting shop:', error);
        res.status(500).json({
            message: 'Error deleting shop',
            error: error.message
        });
    }
});

// ============================================
// GET - Get shop categories list
// ============================================
router.get('/categories/list', async (req, res) => {
    try {
        const { data: categories, error } = await supabase
            .from('shops')
            .select('category')
            .not('category', 'is', null);

        if (error) throw error;

        // Get unique categories with counts
        const categoryCount = {};
        categories.forEach(item => {
            if (item.category) {
                categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
            }
        });

        res.json({
            message: 'Shop categories fetched successfully',
            categories: Object.entries(categoryCount).map(([name, count]) => ({
                name,
                count
            }))
        });
    } catch (error) {
        console.error('Error fetching shop categories:', error);
        res.status(500).json({
            message: 'Error fetching shop categories',
            error: error.message
        });
    }
});

// ============================================
// PUT - Admin: Verify/unverify shop
// ============================================
router.put('/:id/verify', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { is_verified } = req.body;

        const { data: shop, error } = await supabaseAdmin
            .from('shops')
            .update({ is_verified: is_verified || false })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // Notify shop owner
        await createNotification(
            shop.owner_id,
            'shop_verification',
            'Shop Verification Updated',
            `Your shop "${shop.shop_name}" is now ${shop.is_verified ? 'verified' : 'unverified'}`,
            shop.id,
            'shop'
        );

        res.json({
            message: 'Shop verification updated successfully',
            shop: shop
        });
    } catch (error) {
        console.error('Error updating shop verification:', error);
        res.status(500).json({
            message: 'Error updating shop verification',
            error: error.message
        });
    }
});

module.exports = router;