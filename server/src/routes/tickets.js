const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const { createNotification } = require('../utils/notifications');

// ============================================
// POST - Create a help ticket
// ============================================
router.post('/', authenticateUser, async (req, res) => {
    try {
        const { topic, message } = req.body;

        if (!topic || !message) {
            return res.status(400).json({
                message: 'Topic and message are required'
            });
        }

        // Create ticket
        const { data: ticket, error } = await supabase
            .from('help_tickets')
            .insert({
                user_id: req.user.id,
                topic: topic,
                message: message,
                status: 'open'
            })
            .select()
            .single();

        if (error) throw error;

        // Create admin chat for this ticket
        const { data: chat } = await supabase
            .from('chats')
            .insert({
                chat_type: 'help',
                participant_1: req.user.id,
                participant_2: null,
                last_message: `Help Ticket: ${topic} - ${message.substring(0, 100)}`
            })
            .select()
            .single();

        // Update ticket with chat_id
        if (chat) {
            await supabase
                .from('help_tickets')
                .update({ admin_chat_id: chat.id })
                .eq('id', ticket.id);

            // Auto-send message in chat
            await supabase
                .from('messages')
                .insert({
                    chat_id: chat.id,
                    sender_id: req.user.id,
                    content: `[Help Ticket - ${topic}]\n${message}`
                });
        }

        // Notify all admins
        const { data: admins } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'admin');

        if (admins) {
            for (const admin of admins) {
                await createNotification(
                    admin.id,
                    'help_ticket',
                    'New Help Ticket',
                    `${req.user.display_name} submitted a ticket: ${topic}`,
                    ticket.id,
                    'help_ticket'
                );
            }
        }

        // Notify user
        await createNotification(
            req.user.id,
            'help_ticket_created',
            'Ticket Submitted',
            `Your help ticket "${topic}" has been submitted. We'll get back to you soon.`,
            ticket.id,
            'help_ticket'
        );

        res.status(201).json({
            message: 'Help ticket created successfully',
            ticket: ticket
        });
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({
            message: 'Error creating help ticket',
            error: error.message
        });
    }
});

// ============================================
// GET - Get my tickets
// ============================================
router.get('/my-tickets', authenticateUser, async (req, res) => {
    try {
        const { status, limit = 20, offset = 0 } = req.query;

        let query = supabase
            .from('help_tickets')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        if (status) {
            query = query.eq('status', status);
        }

        const { data: tickets, error, count } = await query;

        if (error) throw error;

        res.json({
            message: 'Your tickets fetched successfully',
            total: count,
            tickets: tickets || []
        });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({
            message: 'Error fetching tickets',
            error: error.message
        });
    }
});

// ============================================
// GET - Get single ticket
// ============================================
router.get('/:id', authenticateUser, async (req, res) => {
    try {
        const { data: ticket, error } = await supabase
            .from('help_tickets')
            .select(`
                *,
                user:user_id(
                    id,
                    display_name,
                    email,
                    profile_picture_url
                )
            `)
            .eq('id', req.params.id)
            .single();

        if (error || !ticket) {
            return res.status(404).json({
                message: 'Ticket not found'
            });
        }

        // Check if user owns ticket or is admin
        if (ticket.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'You can only view your own tickets'
            });
        }

        res.json({
            message: 'Ticket fetched successfully',
            ticket: ticket
        });
    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({
            message: 'Error fetching ticket',
            error: error.message
        });
    }
});

// ============================================
// PUT - User: Update ticket (add more info)
// ============================================
router.put('/:id', authenticateUser, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                message: 'Message is required'
            });
        }

        // Check if ticket exists and belongs to user
        const { data: ticket, error: fetchError } = await supabase
            .from('help_tickets')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (fetchError || !ticket) {
            return res.status(404).json({
                message: 'Ticket not found'
            });
        }

        if (ticket.status === 'closed') {
            return res.status(400).json({
                message: 'Cannot update a closed ticket'
            });
        }

        // Add message to chat
        if (ticket.admin_chat_id) {
            await supabase
                .from('messages')
                .insert({
                    chat_id: ticket.admin_chat_id,
                    sender_id: req.user.id,
                    content: message
                });

            // Update chat last message
            await supabase
                .from('chats')
                .update({
                    last_message: message,
                    last_message_at: new Date().toISOString()
                })
                .eq('id', ticket.admin_chat_id);
        }

        // If ticket was resolved, reopen it
        if (ticket.status === 'resolved') {
            await supabase
                .from('help_tickets')
                .update({ status: 'in_progress' })
                .eq('id', ticket.id);
        }

        res.json({
            message: 'Ticket updated successfully'
        });
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({
            message: 'Error updating ticket',
            error: error.message
        });
    }
});

// ============================================
// GET - Admin: Get all tickets
// ============================================
router.get('/admin/all', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let query = supabase
            .from('help_tickets')
            .select(`
                *,
                user:user_id(
                    id,
                    display_name,
                    email,
                    phone_numbers,
                    profile_picture_url
                )
            `)
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        if (status) {
            query = query.eq('status', status);
        }

        const { data: tickets, error, count } = await query;

        if (error) throw error;

        res.json({
            message: 'All tickets fetched successfully',
            total: count,
            tickets: tickets || []
        });
    } catch (error) {
        console.error('Error fetching all tickets:', error);
        res.status(500).json({
            message: 'Error fetching tickets',
            error: error.message
        });
    }
});

// ============================================
// PUT - Admin: Respond to ticket
// ============================================
router.put('/admin/:id/respond', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { admin_response, status } = req.body;

        // Get the ticket
        const { data: ticket, error: fetchError } = await supabase
            .from('help_tickets')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !ticket) {
            return res.status(404).json({
                message: 'Ticket not found'
            });
        }

        // Update ticket
        const updates = {};
        if (admin_response) updates.admin_response = admin_response;
        if (status) {
            if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
                return res.status(400).json({
                    message: 'Invalid status'
                });
            }
            updates.status = status;
            
            if (status === 'resolved' || status === 'closed') {
                updates.resolved_at = new Date().toISOString();
            }
        }

        const { data: updatedTicket, error } = await supabaseAdmin
            .from('help_tickets')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // Send message in chat
        if (ticket.admin_chat_id && admin_response) {
            await supabase
                .from('messages')
                .insert({
                    chat_id: ticket.admin_chat_id,
                    sender_id: req.user.id,
                    content: admin_response
                });

            // Update chat last message
            await supabase
                .from('chats')
                .update({
                    last_message: admin_response,
                    last_message_at: new Date().toISOString()
                })
                .eq('id', ticket.admin_chat_id);
        }

        // Notify user
        const statusMessages = {
            'in_progress': 'Your ticket is being reviewed',
            'resolved': 'Your ticket has been resolved',
            'closed': 'Your ticket has been closed'
        };

        const notificationMessage = status && statusMessages[status] 
            ? `${statusMessages[status]}. ${admin_response || ''}`
            : admin_response || 'Admin has responded to your ticket';

        await createNotification(
            ticket.user_id,
            'help_ticket_response',
            'Ticket Update',
            notificationMessage,
            ticket.id,
            'help_ticket'
        );

        res.json({
            message: 'Ticket updated successfully',
            ticket: updatedTicket
        });
    } catch (error) {
        console.error('Error responding to ticket:', error);
        res.status(500).json({
            message: 'Error responding to ticket',
            error: error.message
        });
    }
});

// ============================================
// DELETE - Delete ticket (user can delete their own)
// ============================================
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const { data: ticket, error: fetchError } = await supabase
            .from('help_tickets')
            .select('id, user_id')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !ticket) {
            return res.status(404).json({
                message: 'Ticket not found'
            });
        }

        if (ticket.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'You can only delete your own tickets'
            });
        }

        const { error } = await supabase
            .from('help_tickets')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({
            message: 'Ticket deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).json({
            message: 'Error deleting ticket',
            error: error.message
        });
    }
});

module.exports = router;