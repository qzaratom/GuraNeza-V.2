const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { supabase, supabaseAdmin } = require('./src/config/supabase');
const multer = require('multer');
const path = require('path');
const { uploadImage } = require('./src/utils/cloudinaryUpload');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const storage = multer.memoryStorage();
const upload = multer({
    storage, limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (mime && ext) return cb(null, true);
        console.log('Rejected file:', file.originalname, file.mimetype);
        cb(new Error('Only images allowed (jpeg, jpg, png, gif, webp)'));
    }
});

async function getUserFromToken(req) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) { console.log('getUserFromToken: No token'); return null; }
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) { console.log('getUserFromToken: Auth error or no user'); return null; }
        const { data: profile, error: profileError } = await supabaseAdmin.from('users').select('*').eq('email', user.email).single();
        if (profileError) { console.log('getUserFromToken: Profile error:', profileError.message); return null; }
        console.log('getUserFromToken: Found user', profile.email, 'Role:', profile.role);
        return profile;
    } catch (e) { console.log('getUserFromToken: Exception:', e.message); return null; }
}

app.get('/', (req, res) => res.json({ message: 'GuraNeza API', status: 'running' }));

// ============================================
// AUTH ROUTES - MUST BE FIRST
// ============================================
app.use('/api/auth', require('./src/routes/auth'));

app.get('/api/auth/refresh/me', async (req, res) => {
    try { const user = await getUserFromToken(req); if (!user) return res.status(401).json({ message: 'Unauthorized' }); const { data: profile } = await supabaseAdmin.from('users').select('*, subscription_plan:subscription_plan_id(*)').eq('id', user.id).single(); res.json({ user: profile }); }
    catch (e) { res.status(500).json({ message: e.message }); }
});

// ============================================
// UPLOAD MULTIPLE IMAGES
// ============================================
app.post('/api/upload/multiple', (req, res, next) => {
    upload.array('images', 5)(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err.message);
            if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'File too large. Max 10MB.' });
            if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ message: 'Max 5 files allowed.' });
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    console.log('=== UPLOAD MULTIPLE ===');
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'No token' });
        const { data: { user } } = await supabase.auth.getUser(token);
        if (!user) return res.status(401).json({ message: 'Invalid token' });
        if (!req.files?.length) return res.status(400).json({ message: 'No images' });
        const results = await Promise.all(req.files.map(f => {
            const b64 = `data:${f.mimetype};base64,${f.buffer.toString('base64')}`;
            return uploadImage(b64, 'guraneza/products');
        }));
        const images = results.filter(r => r.success).map(r => ({ url: r.url, public_id: r.public_id }));
        res.json({ images });
    } catch (e) { res.status(500).json({ message: 'Upload failed: ' + e.message }); }
});

// ============================================
// UPLOAD SINGLE IMAGE
// ============================================
app.post('/api/upload/single', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err.message);
            if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'File too large. Max 10MB.' });
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    console.log('=== UPLOAD SINGLE ===');
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'No token' });
        const { data: { user } } = await supabase.auth.getUser(token);
        if (!user) return res.status(401).json({ message: 'Invalid token' });
        if (!req.file) return res.status(400).json({ message: 'No image' });
        console.log('File:', req.file.originalname, req.file.size, req.file.mimetype);
        const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await uploadImage(b64, req.body.folder || 'guraneza');
        if (!result.success) throw new Error(result.error || 'Upload failed');
        console.log('Uploaded:', result.url);
        res.json({ message: 'Uploaded', image: { url: result.url, public_id: result.public_id } });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// ============================================
// PRODUCTS
// ============================================
app.post('/api/products', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { name, description, price, stock_quantity, category, is_negotiable, images, product_type, shop_id } = req.body;
        if (!name || !price || !product_type) return res.status(400).json({ message: 'Name, price, type required' });
        let finalShopId = null;
        if (product_type === 'shop') {
            if (shop_id) finalShopId = shop_id;
            else if (user.shop_id) finalShopId = user.shop_id;
            else return res.status(400).json({ message: 'No shop found. Create a shop first.' });
        }
        const { data: product, error } = await supabaseAdmin.from('products').insert({
            seller_id: user.id, shop_id: finalShopId, product_type, name,
            description: description || '', price: parseFloat(price),
            stock_quantity: parseInt(stock_quantity) || 1, category: category || 'Other',
            is_negotiable: is_negotiable || false, images: images || [], status: 'active'
        }).select().single();
        if (error) return res.status(500).json({ message: error.message });
        res.status(201).json({ message: 'Product created!', product });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/products', async (req, res) => {
    try {
        const { limit = 50, offset = 0, category, sort_by, search, min_price, max_price, is_negotiable, product_type } = req.query;
        let query = supabaseAdmin.from('products').select('*', { count: 'exact' }).eq('status', 'active');
        if (category) query = query.eq('category', category);
        if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        if (min_price) query = query.gte('price', min_price);
        if (max_price) query = query.lte('price', max_price);
        if (is_negotiable) query = query.eq('is_negotiable', is_negotiable === 'true');
        if (product_type) query = query.eq('product_type', product_type);
        if (sort_by === 'price_asc') query = query.order('price', { ascending: true });
        else if (sort_by === 'price_desc') query = query.order('price', { ascending: false });
        else if (sort_by === 'oldest') query = query.order('created_at', { ascending: true });
        else query = query.order('created_at', { ascending: false });
        query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        const { data: products, error, count } = await query;
        if (error) throw error;
        const withSellers = [];
        if (products) {
            for (const p of products) {
                try {
                    const { data: seller } = await supabaseAdmin.from('users').select('id, display_name, profile_picture_url, location, subscription_plan:subscription_plan_id(*)').eq('id', p.seller_id).single();
                    withSellers.push({ ...p, seller: seller || null });
                } catch { withSellers.push({ ...p, seller: null }); }
            }
        }
        res.json({ message: 'OK', total: count, products: withSellers });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/products/categories/list', async (req, res) => {
    try { const { data: prods } = await supabaseAdmin.from('products').select('category').eq('status', 'active'); const counts = {}; (prods || []).forEach(p => { if (p.category) counts[p.category] = (counts[p.category] || 0) + 1; }); res.json({ categories: Object.entries(counts).map(([name, count]) => ({ name, count })) }); }
    catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/products/my/products', async (req, res) => {
    try { const user = await getUserFromToken(req); if (!user) return res.status(401).json({ message: 'Unauthorized' }); const { data } = await supabaseAdmin.from('products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }); res.json({ products: data || [] }); }
    catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/products/:id', async (req, res) => {
    try { const { data: product } = await supabaseAdmin.from('products').select('*').eq('id', req.params.id).single(); if (!product) return res.status(404).json({ message: 'Not found' }); const { data: seller } = await supabaseAdmin.from('users').select('id, display_name, profile_picture_url, location').eq('id', product.seller_id).single(); res.json({ product: { ...product, seller: seller || null } }); }
    catch (e) { res.status(500).json({ message: e.message }); }
});

app.put('/api/products/:id', async (req, res) => {
    try { const updates = {}; ['name','description','price','stock_quantity','category','is_negotiable','images','status','product_type'].forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; }); const { data: updated, error } = await supabaseAdmin.from('products').update(updates).eq('id', req.params.id).select().single(); if (error) return res.status(500).json({ message: error.message }); res.json({ message: 'Updated', product: updated }); }
    catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
    try { await supabaseAdmin.from('products').delete().eq('id', req.params.id); res.json({ message: 'Deleted' }); }
    catch (e) { res.status(500).json({ message: e.message }); }
});

// ============================================
// SHOPS
// ============================================
app.get('/api/shops', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const { data: shops, error, count } = await supabaseAdmin.from('shops').select('*, owner:owner_id(id, display_name, profile_picture_url, subscription_plan:subscription_plan_id(*))').order('created_at', { ascending: false }).range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        if (error) throw error;
        res.json({ message: 'Shops fetched', shops: shops || [], total: count });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/shops/my-shop', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { data: shop } = await supabaseAdmin.from('shops').select('*').eq('owner_id', user.id).single();
        if (!shop) return res.json({ shop: null, products: [] });
        const { data: products } = await supabaseAdmin.from('products').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false });
        let finalProducts = products || [];
        if (finalProducts.length === 0) {
            const { data: altProducts } = await supabaseAdmin.from('products').select('*').eq('seller_id', user.id).eq('product_type', 'shop').order('created_at', { ascending: false });
            if (altProducts?.length > 0) {
                for (const p of altProducts) { if (!p.shop_id) await supabaseAdmin.from('products').update({ shop_id: shop.id }).eq('id', p.id); }
                const { data: fixed } = await supabaseAdmin.from('products').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false });
                finalProducts = fixed || [];
            }
        }
        res.json({ shop, products: finalProducts });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/shops/:id', async (req, res) => {
    try {
        const { data: shop } = await supabaseAdmin.from('shops').select('*, owner:owner_id(id, display_name, profile_picture_url, subscription_plan:subscription_plan_id(*))').eq('id', req.params.id).single();
        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        const { data: products } = await supabaseAdmin.from('products').select('*').eq('shop_id', shop.id).eq('status', 'active').order('created_at', { ascending: false });
        res.json({ shop, products: products || [] });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/shops', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { shop_name, description, category, location, phone_numbers, email, poster_url } = req.body;
        if (!shop_name) return res.status(400).json({ message: 'Shop name required' });
        const { data: existing } = await supabaseAdmin.from('shops').select('id').eq('owner_id', user.id).single();
        if (existing) return res.status(400).json({ message: 'You already have a shop' });
        const { data: shop, error } = await supabaseAdmin.from('shops').insert({ owner_id: user.id, shop_name, description, category, location, phone_numbers: phone_numbers || [], email, poster_url }).select().single();
        if (error) throw error;
        await supabaseAdmin.from('users').update({ shop_id: shop.id }).eq('id', user.id);
        res.status(201).json({ message: 'Shop created', shop });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put('/api/shops/:id', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { data: shop } = await supabaseAdmin.from('shops').select('owner_id').eq('id', req.params.id).single();
        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        if (shop.owner_id !== user.id && user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
        const updates = {}; ['shop_name','description','category','location','phone_numbers','email','poster_url'].forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
        const { data: updated } = await supabaseAdmin.from('shops').update(updates).eq('id', req.params.id).select().single();
        res.json({ message: 'Shop updated', shop: updated });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete('/api/shops/:id', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { data: shop } = await supabaseAdmin.from('shops').select('owner_id').eq('id', req.params.id).single();
        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        if (shop.owner_id !== user.id && user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
        await supabaseAdmin.from('shops').delete().eq('id', req.params.id);
        res.json({ message: 'Shop deleted' });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// ============================================
// UNREAD COUNTS
// ============================================
app.get('/api/chats/unread-count', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.json({ unread_count: 0 });
        const { data: { user } } = await supabase.auth.getUser(token);
        if (!user) return res.json({ unread_count: 0 });
        const { data: userProfile } = await supabaseAdmin.from('users').select('id').eq('email', user.email).single();
        if (!userProfile) return res.json({ unread_count: 0 });
        const { data: chats } = await supabaseAdmin.from('chats').select('id').or(`participant_1.eq.${userProfile.id},participant_2.eq.${userProfile.id}`);
        if (!chats || chats.length === 0) return res.json({ unread_count: 0 });
        const chatIds = chats.map(c => c.id);
        const { count } = await supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }).in('chat_id', chatIds).eq('is_read', false).neq('sender_id', userProfile.id);
        res.json({ unread_count: count || 0 });
    } catch (e) { res.json({ unread_count: 0 }); }
});

app.get('/api/notifications/unread-count', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.json({ unread_count: 0 });
        const { data: { user } } = await supabase.auth.getUser(token);
        if (!user) return res.json({ unread_count: 0 });
        const { data: userProfile } = await supabaseAdmin.from('users').select('id').eq('email', user.email).single();
        if (!userProfile) return res.json({ unread_count: 0 });
        const { count } = await supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userProfile.id).eq('is_read', false);
        res.json({ unread_count: count || 0 });
    } catch (e) { res.json({ unread_count: 0 }); }
});

// ============================================
// SUBSCRIPTIONS - PLANS
// ============================================
app.get('/api/subscriptions/plans', async (req, res) => {
    try { const { data: plans } = await supabaseAdmin.from('subscription_plans').select('*').order('price_rwf', { ascending: true }); res.json({ message: 'Plans fetched', plans: plans || [] }); }
    catch (e) { res.status(500).json({ message: e.message }); }
});

app.put('/api/subscriptions/admin/plans/:id', async (req, res) => {
    try { const user = await getUserFromToken(req); if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' }); const updates = {}; ['name','price_rwf','max_products','badge_verified_seller','badge_verified_product','badge_verified_shop','badge_vip','is_active'].forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; }); const { data: updated } = await supabaseAdmin.from('subscription_plans').update(updates).eq('id', req.params.id).select().single(); res.json({ message: 'Plan updated', plan: updated }); }
    catch (e) { res.status(500).json({ message: e.message }); }
});

// ============================================
// SUBSCRIPTIONS - UPGRADE
// ============================================
app.post('/api/subscriptions/upgrade', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { plan_id } = req.body;
        if (!plan_id) return res.status(400).json({ message: 'Plan ID required' });
        const { data: existingReq } = await supabaseAdmin.from('subscription_requests').select('*').eq('user_id', user.id).eq('status', 'pending').maybeSingle();
        if (existingReq) return res.status(400).json({ message: 'You already have a pending request' });
        const { data: plan } = await supabaseAdmin.from('subscription_plans').select('*').eq('id', plan_id).single();
        if (!plan) return res.status(400).json({ message: 'Plan not found' });
        const { data: paymentSetting } = await supabaseAdmin.from('payment_settings').select('payment_code').eq('is_active', true).order('updated_at', { ascending: false }).limit(1).maybeSingle();
        const paymentCode = paymentSetting?.payment_code || 'Not set';
        const { data: request, error } = await supabaseAdmin.from('subscription_requests').insert({ user_id: user.id, plan_id, status: 'pending', payment_code: paymentCode }).select().single();
        if (error) return res.status(500).json({ message: 'Error creating request' });
        const { data: admins } = await supabaseAdmin.from('users').select('id, display_name').eq('role', 'admin');
        if (admins && admins.length > 0) {
            const adminUser = admins[0];
            const { data: chat, error: chatError } = await supabaseAdmin.from('chats').insert({ participant_1: user.id, participant_2: adminUser.id, chat_type: 'subscription', last_message: `Subscription request: ${plan.name} plan (${plan.price_rwf} RWF)`, last_message_at: new Date().toISOString() }).select().single();
            if (chat && !chatError) {
                await supabaseAdmin.from('subscription_requests').update({ admin_chat_id: chat.id }).eq('id', request.id);
                await supabaseAdmin.from('messages').insert({ chat_id: chat.id, sender_id: user.id, content: `Hi! I would like to upgrade to the ${plan.name} plan (${plan.price_rwf} RWF).\n\nPayment code: ${paymentCode}` });
                await supabaseAdmin.from('messages').insert({ chat_id: chat.id, sender_id: adminUser.id, content: `Thank you for your subscription request! We have received your request for the ${plan.name} plan.\n\nPlease complete payment using the code: ${paymentCode}\n\nWe will process your request within 24 hours after payment confirmation.` });
                await supabaseAdmin.from('chats').update({ last_message: `We will process your request within 24 hours.`, last_message_at: new Date().toISOString() }).eq('id', chat.id);
            }
        }
        if (admins) { for (const admin of admins) { await supabaseAdmin.from('notifications').insert({ user_id: admin.id, type: 'subscription_request', title: 'New Subscription Request', message: `${user.display_name || 'A user'} wants to upgrade to ${plan.name} plan`, reference_id: request.id, reference_type: 'subscription' }); } }
        await supabaseAdmin.from('notifications').insert({ user_id: user.id, type: 'subscription_requested', title: 'Upgrade Request Sent', message: `Your request to upgrade to ${plan.name} plan has been sent. Check your chats!`, reference_id: request.id, reference_type: 'subscription' });
        res.status(201).json({ message: 'Upgrade request sent!', request });
    } catch (e) { console.error('Upgrade error:', e); res.status(500).json({ message: 'Error', error: e.message }); }
});

// ============================================
// SUBSCRIPTIONS - ADMIN REQUESTS
// ============================================
app.get('/api/subscriptions/admin/requests', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const { status } = req.query;
        let query = supabaseAdmin.from('subscription_requests').select('*').order('requested_at', { ascending: false });
        if (status) query = query.eq('status', status);
        const { data: requests, error } = await query;
        if (error) return res.json({ requests: [] });
        const requestsWithDetails = [];
        if (requests) { for (const req of requests) { const { data: userData } = await supabaseAdmin.from('users').select('id, display_name, email').eq('id', req.user_id).single(); const { data: planData } = await supabaseAdmin.from('subscription_plans').select('*').eq('id', req.plan_id).single(); requestsWithDetails.push({ ...req, user: userData || null, plan: planData || null }); } }
        res.json({ requests: requestsWithDetails });
    } catch (e) { res.json({ requests: [] }); }
});

app.get('/api/subscriptions/my-requests', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { data: requests, error } = await supabaseAdmin.from('subscription_requests').select('*').eq('user_id', user.id).order('requested_at', { ascending: false });
        if (error) return res.json({ requests: [] });
        const requestsWithPlans = [];
        if (requests) { for (const req of requests) { let plan = null; if (req.plan_id) { const { data: planData } = await supabaseAdmin.from('subscription_plans').select('*').eq('id', req.plan_id).single(); plan = planData; } requestsWithPlans.push({ ...req, plan }); } }
        res.json({ requests: requestsWithPlans });
    } catch (e) { res.json({ requests: [] }); }
});

app.delete('/api/subscriptions/admin/requests/:id', async (req, res) => {
    try { const user = await getUserFromToken(req); if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' }); const { error } = await supabaseAdmin.from('subscription_requests').delete().eq('id', req.params.id); if (error) return res.status(500).json({ message: error.message }); res.json({ message: 'Request deleted' }); }
    catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

// ============================================
// PAYMENT CODE MANAGEMENT
// ============================================
app.get('/api/subscriptions/admin/payment-code', async (req, res) => {
    try { const token = req.headers.authorization?.split(' ')[1]; if (!token) return res.json({ payment_code: '' }); const { data: setting } = await supabaseAdmin.from('payment_settings').select('payment_code').eq('is_active', true).order('updated_at', { ascending: false }).limit(1).maybeSingle(); res.json({ payment_code: setting?.payment_code || '' }); }
    catch (e) { res.json({ payment_code: '' }); }
});

app.put('/api/subscriptions/admin/payment-code', async (req, res) => {
    try { const user = await getUserFromToken(req); if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' }); const { payment_code } = req.body; if (!payment_code) return res.status(400).json({ message: 'Payment code required' }); await supabaseAdmin.from('payment_settings').update({ is_active: false }).eq('is_active', true); const { data: setting } = await supabaseAdmin.from('payment_settings').insert({ payment_code, updated_by: user.id, is_active: true }).select().single(); res.json({ message: 'Payment code updated', payment_code: setting.payment_code }); }
    catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.put('/api/subscriptions/admin/requests/:id', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const { status, admin_response } = req.body;
        if (!status || !['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Valid status required' });
        const { data: request } = await supabaseAdmin.from('subscription_requests').select('*').eq('id', req.params.id).single();
        if (!request) return res.status(404).json({ message: 'Request not found' });
        const { data: plan } = await supabaseAdmin.from('subscription_plans').select('*').eq('id', request.plan_id).single();
        const { data: updated, error } = await supabaseAdmin.from('subscription_requests').update({ status, admin_response: admin_response || null, resolved_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
        if (error) return res.status(500).json({ message: 'Error updating request' });
        if (status === 'approved') {
            await supabaseAdmin.from('users').update({ subscription_plan_id: request.plan_id, subscription_status: 'active' }).eq('id', request.user_id);
            await supabaseAdmin.from('notifications').insert({ user_id: request.user_id, type: 'subscription_approved', title: 'Subscription Approved!', message: `Your upgrade to ${plan?.name || 'new'} plan has been approved!`, reference_id: request.id, reference_type: 'subscription' });
        } else {
            await supabaseAdmin.from('notifications').insert({ user_id: request.user_id, type: 'subscription_rejected', title: 'Subscription Update', message: admin_response || 'Your request was not approved.', reference_id: request.id, reference_type: 'subscription' });
        }
        res.json({ message: `Request ${status}`, request: updated });
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

// ============================================
// USERS - Admin list
// ============================================
app.get('/api/users', async (req, res) => {
    try { const user = await getUserFromToken(req); if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' }); const { data: users } = await supabaseAdmin.from('users').select('*, subscription_plan:subscription_plan_id(*)').order('created_at', { ascending: false }); res.json({ users: users || [] }); }
    catch (e) { res.status(500).json({ message: e.message }); }
});

app.put('/api/users/:id/role', async (req, res) => {
    try { const user = await getUserFromToken(req); if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' }); const { role } = req.body; const { data: updated } = await supabaseAdmin.from('users').update({ role }).eq('id', req.params.id).select().single(); res.json({ user: updated }); }
    catch (e) { res.status(500).json({ message: e.message }); }
});

// ============================================
// GET USER BY ID (for seller info)
// ============================================
app.get('/api/users/:id', async (req, res) => {
    try {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(req.params.id)) return res.status(400).json({ message: 'Invalid user ID' });
        const { data: user, error } = await supabaseAdmin.from('users').select('id, display_name, email, phone_numbers, location, bio, profile_picture_url, poster_url, role, created_at, last_seen, subscription_plan:subscription_plan_id(id, name, price_rwf, max_products, badge_verified_seller, badge_verified_product, badge_verified_shop, badge_vip)').eq('id', req.params.id).single();
        if (error || !user) return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

// ============================================
// USER PROFILE ROUTES
// ============================================
app.get('/api/users/profile', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { data: profile, error } = await supabaseAdmin.from('users').select('*, subscription_plan:subscription_plan_id(*)').eq('id', user.id).single();
        if (error) return res.status(500).json({ message: 'Error', error: error.message });
        res.json({ user: profile });
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.put('/api/users/profile', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        if (user.role === 'admin' && req.body.user_id) {
            const { user_id, display_name, email, subscription_plan_id, subscription_status, is_blocked } = req.body;
            const updates = {};
            if (display_name !== undefined) updates.display_name = display_name;
            if (email !== undefined) updates.email = email;
            if (subscription_plan_id !== undefined) updates.subscription_plan_id = subscription_plan_id || null;
            if (subscription_status !== undefined) updates.subscription_status = subscription_status;
            if (is_blocked !== undefined) updates.is_blocked = is_blocked;
            const { error } = await supabaseAdmin.from('users').update(updates).eq('id', user_id);
            if (error) return res.status(500).json({ message: error.message });
            return res.json({ message: 'User updated by admin' });
        }
        const { display_name, phone_numbers, location, bio } = req.body;
        const updates = {};
        if (display_name !== undefined) updates.display_name = display_name;
        if (phone_numbers !== undefined) updates.phone_numbers = phone_numbers;
        if (location !== undefined) updates.location = location;
        if (bio !== undefined) updates.bio = bio;
        const { data: updated, error } = await supabaseAdmin.from('users').update(updates).eq('id', user.id).select('*, subscription_plan:subscription_plan_id(*)').single();
        if (error) return res.status(500).json({ message: error.message });
        res.json({ message: 'Profile updated', user: updated });
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.put('/api/users/profile-picture', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { profile_picture_url } = req.body;
        if (!profile_picture_url) return res.status(400).json({ message: 'URL required' });
        const { data: updated, error } = await supabaseAdmin.from('users').update({ profile_picture_url }).eq('id', user.id).select().single();
        if (error) return res.status(500).json({ message: error.message });
        res.json({ message: 'Picture updated', user: updated });
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.put('/api/users/poster', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { poster_url } = req.body;
        if (!poster_url) return res.status(400).json({ message: 'URL required' });
        const { data: updated, error } = await supabaseAdmin.from('users').update({ poster_url }).eq('id', user.id).select().single();
        if (error) return res.status(500).json({ message: error.message });
        res.json({ message: 'Poster updated', user: updated });
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

// ============================================
// CHATS
// ============================================
app.post('/api/chats', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { participant_id, chat_type, initial_message } = req.body;
        if (!participant_id) return res.status(400).json({ message: 'Participant ID required' });
        if (participant_id === user.id) return res.status(400).json({ message: 'Cannot chat with yourself' });
        const { data: existingChat } = await supabaseAdmin.from('chats').select('*').or(`and(participant_1.eq.${user.id},participant_2.eq.${participant_id}),and(participant_1.eq.${participant_id},participant_2.eq.${user.id})`).eq('chat_type', chat_type || 'user').single();
        let chat = existingChat;
        if (!chat) { const { data: newChat, error } = await supabaseAdmin.from('chats').insert({ participant_1: user.id, participant_2: participant_id, chat_type: chat_type || 'user', last_message: initial_message?.substring(0, 100) || null, last_message_at: new Date().toISOString() }).select().single(); if (error) throw error; chat = newChat; }
        if (initial_message && chat) { await supabaseAdmin.from('messages').insert({ chat_id: chat.id, sender_id: user.id, content: initial_message }); await supabaseAdmin.from('chats').update({ last_message: initial_message.substring(0, 100), last_message_at: new Date().toISOString() }).eq('id', chat.id); }
        res.json({ message: 'Chat ready', chat });
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/chats', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { data: chats, error } = await supabaseAdmin.from('chats').select('*').or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`).order('last_message_at', { ascending: false });
        if (error) throw error;
        const chatsWithUsers = [];
        for (const chat of (chats || [])) { const otherUserId = chat.participant_1 === user.id ? chat.participant_2 : chat.participant_1; const { data: otherUser } = await supabaseAdmin.from('users').select('id, display_name, profile_picture_url, last_seen').eq('id', otherUserId).single(); const { count } = await supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }).eq('chat_id', chat.id).eq('is_read', false).neq('sender_id', user.id); chatsWithUsers.push({ ...chat, other_user: otherUser || null, unread_count: count || 0 }); }
        res.json({ chats: chatsWithUsers });
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/chats/:id', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { data: chat, error } = await supabaseAdmin.from('chats').select('*').eq('id', req.params.id).single();
        if (error || !chat) return res.status(404).json({ message: 'Chat not found' });
        if (chat.participant_1 !== user.id && chat.participant_2 !== user.id) return res.status(403).json({ message: 'Not authorized' });
        const { data: messages } = await supabaseAdmin.from('messages').select('*').eq('chat_id', chat.id).order('created_at', { ascending: true });
        const otherUserId = chat.participant_1 === user.id ? chat.participant_2 : chat.participant_1;
        const { data: otherUser } = await supabaseAdmin.from('users').select('id, display_name, profile_picture_url, last_seen, location, bio, phone_numbers, email').eq('id', otherUserId).single();
        await supabaseAdmin.from('messages').update({ is_read: true }).eq('chat_id', chat.id).neq('sender_id', user.id).eq('is_read', false);
        res.json({ chat: { ...chat, other_user: otherUser || null }, messages: messages || [] });
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.post('/api/chats/:id/messages', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: 'Message content required' });
        const { data: chat } = await supabaseAdmin.from('chats').select('*').eq('id', req.params.id).single();
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        if (chat.participant_1 !== user.id && chat.participant_2 !== user.id) return res.status(403).json({ message: 'Not authorized' });
        const { data: message, error } = await supabaseAdmin.from('messages').insert({ chat_id: chat.id, sender_id: user.id, content: content }).select().single();
        if (error) throw error;
        await supabaseAdmin.from('chats').update({ last_message: content.substring(0, 100), last_message_at: new Date().toISOString() }).eq('id', chat.id);
        res.status(201).json({ message: 'Sent', chat_message: message });
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

// ============================================
// HELP TICKETS
// ============================================
app.post('/api/tickets', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { topic, message } = req.body;
        if (!topic || !message) return res.status(400).json({ message: 'Topic and message required' });
        const { data: ticket } = await supabaseAdmin.from('help_tickets').insert({ user_id: user.id, topic, message, status: 'open' }).select().single();
        const { data: admins } = await supabaseAdmin.from('users').select('id').eq('role', 'admin');
        if (admins) { for (const admin of admins) { await supabaseAdmin.from('notifications').insert({ user_id: admin.id, type: 'new_ticket', title: 'New Help Ticket', message: `${user.display_name} submitted: ${topic}`, reference_id: ticket.id, reference_type: 'ticket' }); } }
        res.status(201).json({ message: 'Ticket created', ticket });
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/tickets/my-tickets', async (req, res) => {
    try { const user = await getUserFromToken(req); if (!user) return res.status(401).json({ message: 'Unauthorized' }); const { data: tickets } = await supabaseAdmin.from('help_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); res.json({ tickets: tickets || [] }); }
    catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/tickets/admin/all', async (req, res) => {
    try {
        const adminUser = await getUserFromToken(req);
        if (!adminUser || adminUser.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const { data: tickets, error } = await supabaseAdmin.from('help_tickets').select('*').order('created_at', { ascending: false });
        if (error) return res.json({ tickets: [] });
        const ticketsWithUsers = [];
        if (tickets) { for (const ticket of tickets) { try { const { data: ticketUser } = await supabaseAdmin.from('users').select('id, display_name, email').eq('id', ticket.user_id).single(); ticketsWithUsers.push({ ...ticket, user: ticketUser || { id: ticket.user_id, display_name: 'Unknown', email: '' } }); } catch { ticketsWithUsers.push({ ...ticket, user: { id: ticket.user_id, display_name: 'Unknown', email: '' } }); } } }
        res.json({ tickets: ticketsWithUsers });
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.put('/api/tickets/:id/status', async (req, res) => {
    try { const user = await getUserFromToken(req); if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' }); const { status, admin_response } = req.body; const updates = { status }; if (admin_response) updates.admin_response = admin_response; if (status === 'resolved' || status === 'closed') updates.resolved_at = new Date().toISOString(); const { data: ticket } = await supabaseAdmin.from('help_tickets').update(updates).eq('id', req.params.id).select().single(); res.json({ message: 'Updated', ticket }); }
    catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

// ============================================
// NOTIFICATIONS
// ============================================
app.get('/api/notifications', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const { limit = 50, offset = 0 } = req.query;
        const { data: notifications, error, count } = await supabaseAdmin.from('notifications').select('*', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        if (error) throw error;
        res.json({ notifications: notifications || [], total: count, unread_count: (notifications || []).filter(n => !n.is_read).length });
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.put('/api/notifications/:id/read', async (req, res) => {
    try { const user = await getUserFromToken(req); if (!user) return res.status(401).json({ message: 'Unauthorized' }); const { error } = await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', req.params.id).eq('user_id', user.id); if (error) return res.status(500).json({ message: error.message }); res.json({ message: 'Marked as read' }); }
    catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.put('/api/notifications/read-all', async (req, res) => {
    try { const user = await getUserFromToken(req); if (!user) return res.status(401).json({ message: 'Unauthorized' }); await supabaseAdmin.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false); res.json({ message: 'All marked as read' }); }
    catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.delete('/api/notifications/:id', async (req, res) => {
    try { const user = await getUserFromToken(req); if (!user) return res.status(401).json({ message: 'Unauthorized' }); await supabaseAdmin.from('notifications').delete().eq('id', req.params.id).eq('user_id', user.id); res.json({ message: 'Deleted' }); }
    catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.delete('/api/notifications', async (req, res) => {
    try { const user = await getUserFromToken(req); if (!user) return res.status(401).json({ message: 'Unauthorized' }); await supabaseAdmin.from('notifications').delete().eq('user_id', user.id); res.json({ message: 'All deleted' }); }
    catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

// ============================================
// CART ROUTES
// ============================================
app.post('/api/cart', async (req, res) => {
    try {
        console.log('=== CART ADD ===');
        const token = req.headers.authorization?.split(' ')[1];
        console.log('Token:', token ? 'present' : 'missing');
        if (!token) return res.status(401).json({ message: 'Please log in' });
        
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !authUser) { console.log('Auth error:', authError?.message); return res.status(401).json({ message: 'Invalid token' }); }
        
        const { data: profile } = await supabaseAdmin.from('users').select('id, display_name').eq('email', authUser.email).single();
        if (!profile) return res.status(401).json({ message: 'User not found' });
        console.log('User:', profile.display_name);
        
        const { product_id, quantity } = req.body;
        console.log('Product ID:', product_id, 'Qty:', quantity);
        if (!product_id) return res.status(400).json({ message: 'Product ID required' });
        
        const { data: product } = await supabaseAdmin.from('products').select('id, name, seller_id, stock_quantity, status').eq('id', product_id).single();
        if (!product) return res.status(404).json({ message: 'Product not found' });
        console.log('Product:', product.name, 'Stock:', product.stock_quantity);
        
        if (product.status !== 'active') return res.status(400).json({ message: 'Not available' });
        if (product.seller_id === profile.id) return res.status(400).json({ message: 'Cannot add your own product' });
        
        const qty = quantity || 1;
        if (qty > product.stock_quantity) return res.status(400).json({ message: `Only ${product.stock_quantity} available` });
        
        const { data: existing } = await supabaseAdmin.from('cart_items').select('*').eq('user_id', profile.id).eq('product_id', product_id).maybeSingle();
        if (existing) { const newQty = existing.quantity + qty; if (newQty > product.stock_quantity) return res.status(400).json({ message: `Only ${product.stock_quantity} available` }); await supabaseAdmin.from('cart_items').update({ quantity: newQty }).eq('id', existing.id); }
        else { await supabaseAdmin.from('cart_items').insert({ user_id: profile.id, product_id, quantity: qty }); }
        
        console.log('✅ Cart: Added!');
        res.json({ message: 'Added to cart!' });
    } catch (e) { console.error('❌ Cart error:', e); res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/cart', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Please log in' });
        const { data: { user: authUser } } = await supabase.auth.getUser(token);
        if (!authUser) return res.status(401).json({ message: 'Invalid token' });
        const { data: profile } = await supabaseAdmin.from('users').select('id').eq('email', authUser.email).single();
        if (!profile) return res.status(401).json({ message: 'User not found' });
        const { data: items } = await supabaseAdmin.from('cart_items').select('*').eq('user_id', profile.id).order('added_at', { ascending: false });
        const itemsWithProducts = [];
        if (items) { for (const item of items) { const { data: product } = await supabaseAdmin.from('products').select('id, name, price, images, stock_quantity, status, seller_id').eq('id', item.product_id).single(); let seller = null; if (product?.seller_id) { const { data: s } = await supabaseAdmin.from('users').select('id, display_name').eq('id', product.seller_id).single(); seller = s; } itemsWithProducts.push({ ...item, product: product ? { ...product, seller } : null }); } }
        res.json({ cart_items: itemsWithProducts });
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.put('/api/cart/:id', async (req, res) => {
    try { const token = req.headers.authorization?.split(' ')[1]; if (!token) return res.status(401).json({ message: 'Please log in' }); const { data: { user: authUser } } = await supabase.auth.getUser(token); if (!authUser) return res.status(401).json({ message: 'Invalid token' }); const { data: profile } = await supabaseAdmin.from('users').select('id').eq('email', authUser.email).single(); if (!profile) return res.status(401).json({ message: 'User not found' }); const { quantity } = req.body; await supabaseAdmin.from('cart_items').update({ quantity }).eq('id', req.params.id).eq('user_id', profile.id); res.json({ message: 'Updated' }); }
    catch (e) { res.status(500).json({ message: 'Error' }); }
});

app.delete('/api/cart/:id', async (req, res) => {
    try { const token = req.headers.authorization?.split(' ')[1]; if (!token) return res.status(401).json({ message: 'Please log in' }); const { data: { user: authUser } } = await supabase.auth.getUser(token); if (!authUser) return res.status(401).json({ message: 'Invalid token' }); const { data: profile } = await supabaseAdmin.from('users').select('id').eq('email', authUser.email).single(); if (!profile) return res.status(401).json({ message: 'User not found' }); await supabaseAdmin.from('cart_items').delete().eq('id', req.params.id).eq('user_id', profile.id); res.json({ message: 'Removed' }); }
    catch (e) { res.status(500).json({ message: 'Error' }); }
});

app.delete('/api/cart', async (req, res) => {
    try { const token = req.headers.authorization?.split(' ')[1]; if (!token) return res.status(401).json({ message: 'Please log in' }); const { data: { user: authUser } } = await supabase.auth.getUser(token); if (!authUser) return res.status(401).json({ message: 'Invalid token' }); const { data: profile } = await supabaseAdmin.from('users').select('id').eq('email', authUser.email).single(); if (!profile) return res.status(401).json({ message: 'User not found' }); await supabaseAdmin.from('cart_items').delete().eq('user_id', profile.id); res.json({ message: 'Cart cleared' }); }
    catch (e) { res.status(500).json({ message: 'Error' }); }
});

// ============================================
// PUBLIC STATS (no auth required)
// ============================================
app.get('/api/public/stats', async (req, res) => {
    try {
        const [usersRes, productsRes, shopsRes] = await Promise.all([
            supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            supabaseAdmin.from('shops').select('id', { count: 'exact', head: true })
        ]);
        
        res.json({
            success: true,
            stats: {
                users: usersRes.count || 0,
                products: productsRes.count || 0,
                shops: shopsRes.count || 0
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => { console.error('Server error:', err.message); res.status(500).json({ message: err.message || 'Internal server error' }); });

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));