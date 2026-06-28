const cloudinary = require('../config/cloudinary');

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to the file or base64 string
 * @param {string} folder - Folder name in Cloudinary (e.g., 'profiles', 'products', 'shops')
 * @returns {object} - Upload result with url and public_id
 */
const uploadImage = async (filePath, folder = 'guraneza') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
            transformation: [
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });
        
        return {
            success: true,
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - The public_id of the image to delete
 * @returns {object} - Deletion result
 */
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return {
            success: true,
            result: result
        };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = { uploadImage, deleteImage };