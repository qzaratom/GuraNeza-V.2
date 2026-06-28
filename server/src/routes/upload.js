const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateUser } = require('../middleware/auth');
const { uploadImage } = require('../utils/cloudinaryUpload');

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// POST - Upload multiple images
router.post('/multiple', authenticateUser, upload.array('images', 5), async (req, res) => {
    try {
        console.log('Upload request received. Files:', req.files?.length || 0);
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No images provided' });
        }

        const folder = req.body.folder || 'guraneza/products';
        const uploadPromises = req.files.map(file => {
            const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            return uploadImage(base64Image, folder);
        });

        const results = await Promise.all(uploadPromises);
        const images = results
            .filter(r => r.success)
            .map(r => ({ url: r.url, public_id: r.public_id }));

        console.log('Upload successful. Images:', images.length);

        res.json({
            message: 'Images uploaded successfully',
            images: images
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

// POST - Upload single image
router.post('/single', authenticateUser, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image provided' });
        }

        const folder = req.body.folder || 'guraneza';
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await uploadImage(base64Image, folder);

        if (!result.success) {
            throw new Error(result.error);
        }

        res.json({
            message: 'Image uploaded successfully',
            image: { url: result.url, public_id: result.public_id }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

module.exports = router;