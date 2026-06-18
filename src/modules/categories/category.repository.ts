import { db } from '../../common/config/db.js';
import { categories } from './category.model.js';
import { eq, desc } from 'drizzle-orm';

export class CategoryRepository {
  async createCategory(data: typeof categories.$inferInsert) {
    const [category] = await db.insert(categories).values(data).returning();
    return category;
  }

  async getAllCategories() {
    return await db.select().from(categories).orderBy(desc(categories.createdAt));
  }

  async deleteCategory(id: string) {
    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
    return deleted;
  }
}

export const categoryRepository = new CategoryRepository();
