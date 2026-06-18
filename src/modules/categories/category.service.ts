import { categoryRepository } from './category.repository.js';
import { ApiError } from '../../common/exceptions/api-error.js';

export class CategoryService {
  async createCategory(data: { name: string }) {
    if (!data.name) {
      throw ApiError.badRequest('Category name is required');
    }

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    try {
      return await categoryRepository.createCategory({ name: data.name, slug });
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation in Postgres
        throw ApiError.badRequest('Category already exists');
      }
      throw error;
    }
  }

  async getAllCategories() {
    return await categoryRepository.getAllCategories();
  }

  async deleteCategory(id: string) {
    const deleted = await categoryRepository.deleteCategory(id);
    if (!deleted) {
      throw ApiError.notFound('Category not found');
    }
    return true;
  }
}

export const categoryService = new CategoryService();
