import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';

/**
 * Upload a file buffer to Cloudinary via upload stream.
 * @param {Buffer} buffer - file buffer from multer memoryStorage
 * @param {object} options - cloudinary upload options
 * @returns {Promise<object>} cloudinary upload result
 */
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    // Convert buffer to readable stream and pipe into cloudinary
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Delete a file from Cloudinary by public_id.
 * @param {string} publicId
 * @param {string} [resourceType="image"]
 */
export const deleteFromCloudinary = async (
  publicId,
  resourceType = 'image',
) => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};
