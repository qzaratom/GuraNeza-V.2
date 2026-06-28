const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

// ============================================
// POST - Create or get existing chat
// ============================================
router.post('/', authenticateUser, async (req, res) => {
    try {
        const { participant_id, chat_type, initial_message } = req.body;

        if (!participant_id) {
            return res.status(400).json({
                message: 'Participant ID is required'
            });
        }

        // Check if user is trying to chat with themselves
        if (participant_id === req.user.id) {
            return res.status(400).json({
                message: 'You cannot chat with yourself'
            });
        }

        // Check if participant exists
        const { data: participant, error: participantError } = await supabase
            .from('users')
            .select('id, display_name')
            .eq('id', participant_id)
            .single();

        if (participantError || !participant) {
            return res.status(404).json({
                message: 'Participant not found'
            });
        }

        // Check if chat already exists between these users
        const { data: existingChat } = await supabase
            .from('chats')
            .select('*')
            .or(`and(participant_1.eq.${req.user.id},participant_2.eq.${participant_id}),and(participant_1.eq.${participant_id},participant_2.eq.${req.user.id})`)
            .eq('chat_type', chat_type || 'user')
            .single();

        if (existingChat) {
            // Chat exists, return it with messages
            const { data: messages } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', existingChat.id)
                .order('created_at', { ascending: true });

            return res.json({
                message: 'Chat already exists',
                chat: existingChat,
                messages: messages || []
            });
        }

        // Create new chat
        const { data: chat, error } = await supabase
            .from('chats')
            .insert({
                participant_1: req.user.id,
                participant_2: participant_id,
                chat_type: chat_type || 'user',
                last_message: initial_message || null
            })
            .select()
            .single();

        if (error) throw error;

        // If initial message provided, save it
        if (initial_message) {
            await supabase
                .from('messages')
                .insert({
                    chat_id: chat.id,
                    sender_id: req.user.id,
                    content: initial_message
                });
        }

        // Notify the other participant
        await createNotification(
            participant_id,
            'new_chat',
            'New Message',
            `${req.user.display_name} started a conversation with you`,
            chat.id,
            'chat'
        );

        res.status(201).json({
            message: 'Chat created successfully',
            chat: chat
        });
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({
            message: 'Error creating chat',
            error: error.message
        });
    }
});

// ============================================
// GET - Get all my chats
// ============================================
router.get('/', authenticateUser, async (req, res) => {
    try {
        const { data: chats, error } = await supabase
            .from('chats')
            .select(`
                *,
                participant_1_user:users!chats_participant_1_fkey(
                    id,
                    display_name,
                    profile_picture_url,
                    last_seen
                ),
                participant_2_user:users!chats_participant_2_fkey(
                    id,
                    display_name,
                    profile_picture_url,
                    last_seen
                )
            `)
            .or(`participant_1.eq.${req.user.id},participant_2.eq.${req.user.id}`)
            .order('last_message_at', { ascending: false });

        if (error) throw error;

        // Get unread count for each chat
        const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('chat_id', chat.id)
                .eq('is_read', false)
                .neq('sender_id', req.user.id);

            // Determine the other participant
            const otherUser = chat.participant_1 === req.user.id 
                ? chat.participant_2_user 
                : chat.participant_1_user;

            return {
                ...chat,
                other_user: otherUser,
                unread_count: count || 0
            };
        }));

        res.json({
            message: 'Chats fetched successfully',
            count: chatsWithUnread.length,
            chats: chatsWithUnread
        });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({
            message: 'Error fetching chats',
            error: error.message
        });
    }
});

// ============================================
// GET - Get single chat with messages
// ============================================
router.get('/:id', authenticateUser, async (req, res) => {
    try {
        // Check if user is participant
        const { data: chat, error: chatError } = await supabase
            .from('chats')
            .select(`
                *,
                participant_1_user:users!chats_participant_1_fkey(
                    id,
                    display_name,
                    profile_picture_url,
                    last_seen
                ),
                participant_2_user:users!chats_participant_2_fkey(
                    id,
                    display_name,
                    profile_picture_url,
                    last_seen
                )
            `)
            .eq('id', req.params.id)
            .single();

        if (chatError || !chat) {
            return res.status(404).json({
                message: 'Chat not found'
            });
        }

        // Verify user is participant
        if (chat.participant_1 !== req.user.id && chat.participant_2 !== req.user.id) {
            return res.status(403).json({
                message: 'You are not a participant in this chat'
            });
        }

        // Get messages
        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        // Mark messages as read
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('chat_id', chat.id)
            .neq('sender_id', req.user.id)
            .eq('is_read', false);

        const otherUser = chat.participant_1 === req.user.id 
            ? chat.participant_2_user 
            : chat.participant_1_user;

        res.json({
            message: 'Chat fetched successfully',
            chat: {
                ...chat,
                other_user: otherUser
            },
            messages: messages || []
        });
    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({
            message: 'Error fetching chat',
            error: error.message
        });
    }
});

// ============================================
// POST - Send message in chat
// ============================================
router.post('/:id/messages', authenticateUser, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                message: 'Message content is required'
            });
        }

        // Check if chat exists and user is participant
        const { data: chat, error: chatError } = await supabase
            .from('chats')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (chatError || !chat) {
            return res.status(404).json({
                message: 'Chat not found'
            });
        }

        if (chat.participant_1 !== req.user.id && chat.participant_2 !== req.user.id) {
            return res.status(403).json({
                message: 'You are not a participant in this chat'
            });
        }

        // Send message
        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                chat_id: chat.id,
                sender_id: req.user.id,
                content: content
            })
            .select()
            .single();

        if (error) throw error;

        // Update chat's last message
        await supabase
            .from('chats')
            .update({
                last_message: content,
                last_message_at: new Date().toISOString()
            })
            .eq('id', chat.id);

        // Notify the other participant
        const otherUserId = chat.participant_1 === req.user.id 
            ? chat.participant_2 
            : chat.participant_1;

        await createNotification(
            otherUserId,
            'new_message',
            'New Message',
            `${req.user.display_name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            chat.id,
            'chat'
        );

        res.status(201).json({
            message: 'Message sent successfully',
            chat_message: message
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            message: 'Error sending message',
            error: error.message
        });
    }
});

// ============================================
// DELETE - Delete chat
// ============================================
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const { data: chat, error: fetchError } = await supabase
            .from('chats')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !chat) {
            return res.status(404).json({
                message: 'Chat not found'
            });
        }

        if (chat.participant_1 !== req.user.id && chat.participant_2 !== req.user.id) {
            return res.status(403).json({
                message: 'You are not a participant in this chat'
            });
        }

        // Delete all messages first
        await supabase
            .from('messages')
            .delete()
            .eq('chat_id', chat.id);

        // Delete chat
        const { error } = await supabase
            .from('chats')
            .delete()
            .eq('id', chat.id);

        if (error) throw error;

        // Notify other participant
        const otherUserId = chat.participant_1 === req.user.id 
            ? chat.participant_2 
            : chat.participant_1;

        await createNotification(
            otherUserId,
            'chat_deleted',
            'Chat Deleted',
            `${req.user.display_name} deleted the conversation`,
            null,
            'chat'
        );

        res.json({
            message: 'Chat deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({
            message: 'Error deleting chat',
            error: error.message
        });
    }
});

// ============================================
// PUT - Update last seen (typing indicator)
// ============================================
router.put('/:id/read', authenticateUser, async (req, res) => {
    try {
        // Mark all messages in chat as read
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('chat_id', req.params.id)
            .neq('sender_id', req.user.id)
            .eq('is_read', false);

        if (error) throw error;

        res.json({
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({
            message: 'Error marking messages as read',
            error: error.message
        });
    }
});

module.exports = router;