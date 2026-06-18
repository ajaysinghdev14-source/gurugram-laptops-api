import type { Request, Response, NextFunction } from 'express';
import { productService } from './product.service.js';

export class ProductController {
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      // In production, we'd also upload image to Cloudinary here if it was a file buffer
      const newProduct = await productService.createProduct(req.body);
      res.status(201).json({
        success: true,
        data: newProduct,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await productService.getAllProducts();
      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const product = await productService.getProductById(id);
      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const updatedProduct = await productService.updateProduct(id, req.body);
      res.status(200).json({
        success: true,
        data: updatedProduct,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await productService.deleteProduct(id);
      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
