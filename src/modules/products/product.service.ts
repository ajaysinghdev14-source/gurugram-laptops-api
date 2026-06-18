import { productRepository } from './product.repository.js';
import { ApiError } from '../../common/exceptions/api-error.js';

export class ProductService {
  async createProduct(data: any) {
    // Basic validation
    if (!data.title || !data.brand || !data.category) {
      throw ApiError.badRequest('Title, brand, and category are required');
    }

    // Map incoming payload to DB schema
    const productData = {
      title: data.title,
      brand: data.brand,
      category: data.category,
      subcategory: data.subcategory || '',
      isRefurbished: data.isRefurbished || false,
      images: data.images || [],
      basePrice: data.basePrice || 0,
      originalBasePrice: data.originalBasePrice || 0,
      inStock: data.inStock !== false,
      attributes: data.attributes || [],
      enableVariants: data.enableVariants || false,
    };

    const variantsData = data.variants || [];

    // Ensure variants have prices if variants are enabled
    if (productData.enableVariants && variantsData.length === 0) {
      throw ApiError.badRequest('At least one variant is required when variants are enabled');
    }

    const result = await productRepository.createProduct(productData, variantsData);
    return result;
  }

  async getAllProducts() {
    return await productRepository.getAllProducts();
  }

  async getProductById(id: string) {
    const product = await productRepository.getProductById(id);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }
    return product;
  }

  async updateProduct(id: string, data: any) {
    if (!data.title || !data.brand || !data.category) {
      throw ApiError.badRequest('Title, brand, and category are required');
    }

    const productData = {
      title: data.title,
      brand: data.brand,
      category: data.category,
      subcategory: data.subcategory || '',
      isRefurbished: data.isRefurbished || false,
      images: data.images || [],
      basePrice: data.basePrice || 0,
      originalBasePrice: data.originalBasePrice || 0,
      inStock: data.inStock !== false,
      attributes: data.attributes || [],
      enableVariants: data.enableVariants !== false,
    };

    const variantsData = data.variants || [];

    if (productData.enableVariants && variantsData.length === 0) {
      throw ApiError.badRequest('At least one variant is required when variants are enabled');
    }

    return await productRepository.updateProduct(id, productData, variantsData);
  }

  async deleteProduct(id: string) {
    const product = await productRepository.getProductById(id);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }
    await productRepository.deleteProduct(id);
    return true;
  }
}

export const productService = new ProductService();
