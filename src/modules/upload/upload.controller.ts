import type { Request, Response, NextFunction } from 'express';
import { cloudinary } from '../../common/config/cloudinary.js';
import { ApiError } from '../../common/exceptions/api-error.js';

export class UploadController {
  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No image file provided');
      }

      // Convert buffer to base64 data URI for Cloudinary upload
      const base64 = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${base64}`;

      // Upload to Cloudinary into a dedicated "products" folder
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'products',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' }, // Max size
          { quality: 'auto', fetch_format: 'auto' },    // Auto-optimize format & quality
        ],
      });

      res.status(200).json({
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
