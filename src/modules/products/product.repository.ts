import { db } from '../../common/config/db.js';
import { products, productVariants } from './product.model.js';
import { eq, desc } from 'drizzle-orm';

export class ProductRepository {
  async createProduct(productData: typeof products.$inferInsert, variantsData: typeof productVariants.$inferInsert[]) {
    return await db.transaction(async (tx) => {
      // 1. Insert base product
      const [newProduct] = await tx.insert(products).values(productData).returning();

      // 2. Insert variants if any
      let createdVariants: typeof productVariants.$inferSelect[] = [];
      if (productData.enableVariants && variantsData && variantsData.length > 0) {
        const variantsToInsert = variantsData.map(v => ({
          ...v,
          productId: newProduct!.id,
        }));
        createdVariants = await tx.insert(productVariants).values(variantsToInsert).returning();
      }

      return {
        ...newProduct,
        variants: createdVariants,
      };
    });
  }

  async getAllProducts() {
    const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));
    // For admin list, we might just need base products. For shop, maybe we need variants too.
    return allProducts;
  }

  async getProductById(id: string) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) return null;

    let variants: typeof productVariants.$inferSelect[] = [];
    if (product.enableVariants) {
      variants = await db.select().from(productVariants).where(eq(productVariants.productId, id));
    }

    return {
      ...product,
      variants,
    };
  }

  async updateProduct(id: string, productData: Partial<typeof products.$inferInsert>, variantsData: typeof productVariants.$inferInsert[]) {
    return await db.transaction(async (tx) => {
      // 1. Update base product
      const [updatedProduct] = await tx.update(products)
        .set({ ...productData, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();

      if (!updatedProduct) {
        throw new Error("Product not found");
      }

      // 2. Delete existing variants
      await tx.delete(productVariants).where(eq(productVariants.productId, id));

      // 3. Insert new variants if any
      let createdVariants: typeof productVariants.$inferSelect[] = [];
      if (productData.enableVariants !== false && variantsData && variantsData.length > 0) {
        const variantsToInsert = variantsData.map(v => ({
          ...v,
          productId: id,
        }));
        createdVariants = await tx.insert(productVariants).values(variantsToInsert).returning();
      }

      return {
        ...updatedProduct,
        variants: createdVariants,
      };
    });
  }

  async deleteProduct(id: string) {
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
    return deleted;
  }
}

export const productRepository = new ProductRepository();
