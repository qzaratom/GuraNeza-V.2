const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

// ============================================
// IMPORTANT: Specific routes MUST come before parameterized routes
// ============================================

// GET - Categories list
router.get('/categories/list', async (req, res) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('category')
            .eq('status', 'active');

        if (error) throw error;

        const counts = {};
        (products || []).forEach(p => {
            if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
        });

        res.json({
            message: 'Categories fetched',
            categories: Object.entries(counts).map(([name, count]) => ({ name, count }))
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error', error: error.message });
    }
});

// GET - My products (authenticated)
router.get('/my/products', authenticateUser, async (req, res) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('seller_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            message: 'Your products fetched',
            count: (products || []).length,
            products: products || []
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error', error: error.message });
    }
});

// ============================================
// POST - Create a new product
// ============================================
router.post('/', authenticateUser, async (req, res) => {
    console.log('========================================');
    console.log('CREATE PRODUCT REQUEST RECEIVED');
    console.log('User:', req.user?.email);
    console.log('Body:', req.body);
    console.log('========================================');
    
    try {
        const {
            name,
            description,
            price,
            stock_quantity,
            category,
            is_negotiable,
            images,
            product_type,
            shop_id
        } = req.body;

        if (!name || !price || !product_type) {
            return res.status(400).json({
                message: 'Name, price, and product_type are required'
            });
        }

        if (!['individual', 'shop'].includes(product_type)) {
            return res.status(400).json({
                message: 'product_type must be individual or shop'
            });
        }

        if (product_type === 'shop') {
            if (!shop_id) {
                return res.status(400).json({ message: 'shop_id is required for shop products' });
            }

            const { data: shop } = await supabase
                .from('shops')
                .select('id, owner_id')
                .eq('id', shop_id)
                .single();

            if (!shop || shop.owner_id !== req.user.id) {
                return res.status(403).json({ message: 'You do not own this shop' });
            }
        }

        const productData = {
            seller_id: req.user.id,
            shop_id: product_type === 'shop' ? shop_id : null,
            product_type: product_type,
            name: name,
            description: description || '',
            price: parseFloat(price),
            stock_quantity: parseInt(stock_quantity) || 1,
            category: category || 'Other',
            is_negotiable: is_negotiable || false,
            images: images || [],
            status: 'active'
        };

        console.log('Inserting product:', productData);

        const { data: product, error } = await supabaseAdmin
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return res.status(500).json({
                message: 'Database error creating product',
                error: error.message
            });
        }

        console.log('Product created successfully:', product.id);

        // Update user's product count
        await supabaseAdmin
            .from('users')
            .update({ products_count: (req.user.products_count || 0) + 1 })
            .eq('id', req.user.id);

        // Create notification
        try {
            await createNotification(
                req.user.id,
                'new_product',
                'Product Listed',
                `Your product "${name}" has been listed successfully`,
                product.id,
                'product'
            );
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }

        console.log('========================================');
        res.status(201).json({
            message: 'Product created successfully',
            product: product
        });

    } catch (error) {
        console.error('CREATE PRODUCT ERROR:', error);
        res.status(500).json({
            message: 'Error creating product',
            error: error.message
        });
    }
});

// ============================================
// GET - Get all products (public with filters)
// ============================================
router.get('/', async (req, res) => {
    try {
        const {
            category,
            min_price,
            max_price,
            product_type,
            search,
            sort_by,
            limit = 20,
            offset = 0
        } = req.query;

        let query = supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('status', 'active');

        if (category) query = query.eq('category', category);
        if (min_price) query = query.gte('price', min_price);
        if (max_price) query = query.lte('price', max_price);
        if (product_type) query = query.eq('product_type', product_type);
        if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

        if (sort_by === 'price_asc') {
            query = query.order('price', { ascending: true });
        } else if (sort_by === 'price_desc') {
            query = query.order('price', { ascending: false });
        } else if (sort_by === 'oldest') {
            query = query.order('created_at', { ascending: true });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        const { data: products, error, count } = await query;

        if (error) throw error;

        const productsWithSellers = [];
        if (products) {
            for (const product of products) {
                try {
                    const { data: seller } = await supabase
                        .from('users')
                        .select('id, display_name, profile_picture_url')
                        .eq('id', product.seller_id)
                        .single();
                    
                    productsWithSellers.push({ ...product, seller: seller || null });
                } catch (e) {
                    productsWithSellers.push({ ...product, seller: null });
                }
            }
        }

        res.json({
            message: 'Products fetched successfully',
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            products: productsWithSellers
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

// ============================================
// GET - Get single product by ID (MUST BE LAST GET ROUTE)
// ============================================
router.get('/:id', async (req, res) => {
    try {
        // Skip if :id is not a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(req.params.id)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }

        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const { data: seller } = await supabase
            .from('users')
            .select('id, display_name, profile_picture_url, location')
            .eq('id', product.seller_id)
            .single();

        let shop = null;
        if (product.shop_id) {
            const { data: shopData } = await supabase
                .from('shops')
                .select('*')
                .eq('id', product.shop_id)
                .single();
            shop = shopData;
        }

        res.json({
            message: 'Product fetched successfully',
            product: { ...product, seller: seller || null, shop }
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
});

// ============================================
// PUT - Update product
// ============================================
router.put('/:id', authenticateUser, async (req, res) => {
    try {
        const { data: existing } = await supabase
            .from('products')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (!existing) return res.status(404).json({ message: 'Product not found' });
        if (existing.seller_id !== req.user.id) return res.status(403).json({ message: 'Not your product' });

        const updates = {};
        const fields = ['name', 'description', 'price', 'stock_quantity', 'category', 'is_negotiable', 'images', 'status'];
        fields.forEach(f => {
            if (req.body[f] !== undefined) updates[f] = req.body[f];
        });

        const { data: updated, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Product updated', product: updated });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error', error: error.message });
    }
});

// ============================================
// DELETE - Delete product
// ============================================
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const { data: product } = await supabase
            .from('products')
            .select('seller_id')
            .eq('id', req.params.id)
            .single();

        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Product deleted' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error', error: error.message });
    }
});

module.exports = router;