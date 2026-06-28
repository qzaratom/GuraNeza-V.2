const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

// ============================================
// POST - Add item to cart
// ============================================
router.post('/', authenticateUser, async (req, res) => {
    try {
        const { product_id, quantity } = req.body;

        if (!product_id) {
            return res.status(400).json({
                message: 'Product ID is required'
            });
        }

        // Check if product exists and is active
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, name, price, stock_quantity, status, seller_id')
            .eq('id', product_id)
            .single();

        if (productError || !product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        if (product.status !== 'active') {
            return res.status(400).json({
                message: 'This product is no longer available'
            });
        }

        // Check if user is trying to add their own product
        if (product.seller_id === req.user.id) {
            return res.status(400).json({
                message: 'You cannot add your own product to cart'
            });
        }

        // Check if already in cart
        const { data: existingItem } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('product_id', product_id)
            .single();

        if (existingItem) {
            // Update quantity instead
            const newQuantity = existingItem.quantity + (quantity || 1);
            
            if (newQuantity > product.stock_quantity) {
                return res.status(400).json({
                    message: `Only ${product.stock_quantity} items available in stock`
                });
            }

            const { data: updatedItem, error } = await supabase
                .from('cart_items')
                .update({ quantity: newQuantity })
                .eq('id', existingItem.id)
                .select()
                .single();

            if (error) throw error;

            return res.json({
                message: 'Cart updated successfully',
                cart_item: updatedItem
            });
        }

        // Check stock
        if (quantity && quantity > product.stock_quantity) {
            return res.status(400).json({
                message: `Only ${product.stock_quantity} items available in stock`
            });
        }

        // Add to cart
        const { data: cartItem, error } = await supabase
            .from('cart_items')
            .insert({
                user_id: req.user.id,
                product_id: product_id,
                quantity: quantity || 1
            })
            .select()
            .single();

        if (error) throw error;

        // Create notification
        await createNotification(
            req.user.id,
            'cart_added',
            'Added to Cart',
            `${product.name} has been added to your cart`,
            product_id,
            'product'
        );

        res.status(201).json({
            message: 'Item added to cart successfully',
            cart_item: cartItem
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            message: 'Error adding to cart',
            error: error.message
        });
    }
});

// ============================================
// GET - Get my cart with product details
// ============================================
router.get('/', authenticateUser, async (req, res) => {
    try {
        const { data: cartItems, error } = await supabase
            .from('cart_items')
            .select(`
                *,
                product:products(
                    id,
                    name,
                    price,
                    images,
                    stock_quantity,
                    status,
                    seller:users(
                        id,
                        display_name,
                        profile_picture_url
                    )
                )
            `)
            .eq('user_id', req.user.id)
            .order('added_at', { ascending: false });

        if (error) throw error;

        // Calculate totals
        const summary = {
            items: cartItems || [],
            total_items: 0,
            total_amount: 0
        };

        if (cartItems) {
            cartItems.forEach(item => {
                if (item.product && item.product.status === 'active') {
                    summary.total_items += item.quantity;
                    summary.total_amount += item.product.price * item.quantity;
                }
            });
        }

        res.json({
            message: 'Cart fetched successfully',
            cart: summary
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({
            message: 'Error fetching cart',
            error: error.message
        });
    }
});

// ============================================
// PUT - Update cart item quantity
// ============================================
router.put('/:id', authenticateUser, async (req, res) => {
    try {
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                message: 'Quantity must be at least 1'
            });
        }

        // Check if cart item exists and belongs to user
        const { data: cartItem, error: fetchError } = await supabase
            .from('cart_items')
            .select('*, product:products(stock_quantity, name)')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (fetchError || !cartItem) {
            return res.status(404).json({
                message: 'Cart item not found'
            });
        }

        // Check stock
        if (cartItem.product && quantity > cartItem.product.stock_quantity) {
            return res.status(400).json({
                message: `Only ${cartItem.product.stock_quantity} items available in stock`
            });
        }

        const { data: updatedItem, error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            message: 'Cart item updated successfully',
            cart_item: updatedItem
        });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({
            message: 'Error updating cart item',
            error: error.message
        });
    }
});

// ============================================
// DELETE - Remove item from cart
// ============================================
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const { data: cartItem, error: fetchError } = await supabase
            .from('cart_items')
            .select('id, product:products(name)')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (fetchError || !cartItem) {
            return res.status(404).json({
                message: 'Cart item not found'
            });
        }

        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;

        // Create notification
        await createNotification(
            req.user.id,
            'cart_removed',
            'Removed from Cart',
            `${cartItem.product?.name || 'Item'} has been removed from your cart`
        );

        res.json({
            message: 'Item removed from cart successfully'
        });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({
            message: 'Error removing cart item',
            error: error.message
        });
    }
});

// ============================================
// DELETE - Clear entire cart
// ============================================
router.delete('/', authenticateUser, async (req, res) => {
    try {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', req.user.id);

        if (error) throw error;

        // Create notification
        await createNotification(
            req.user.id,
            'cart_cleared',
            'Cart Cleared',
            'All items have been removed from your cart'
        );

        res.json({
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            message: 'Error clearing cart',
            error: error.message
        });
    }
});

module.exports = router;