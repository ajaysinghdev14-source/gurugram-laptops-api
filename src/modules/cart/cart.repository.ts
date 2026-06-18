import { db } from '../../common/config/db.js';
import { carts, cartItems } from './cart.model.js';
import { eq, and } from 'drizzle-orm';
import { products } from '../products/product.model.js';

export class CartRepository {
  async getCartByUserId(userId: string) {
    const cart = await db.query.carts.findFirst({
      where: eq(carts.userId, userId),
      with: {
        items: {
          with: {
            product: true,
          },
        },
      },
    });
    return cart;
  }

  async getOrCreateCart(userId: string) {
    let cart = await this.getCartByUserId(userId);
    if (!cart) {
      const [newCart] = await db.insert(carts).values({ userId }).returning();
      cart = { ...newCart, items: [] } as any;
    }
    return cart;
  }

  async addItemToCart(cartId: string, productId: string, quantity: number, variantName: string | null) {
    // Check if item already exists
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.productId, productId),
        variantName ? eq(cartItems.variantName, variantName) : eq(cartItems.variantName, '')
      )
    });

    if (existingItem) {
      const [updated] = await db.update(cartItems)
        .set({ quantity: existingItem.quantity + quantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updated;
    } else {
      const [newItem] = await db.insert(cartItems)
        .values({
          cartId,
          productId,
          quantity,
          variantName: variantName || '',
        })
        .returning();
      return newItem;
    }
  }

  async updateItemQuantity(cartItemId: string, quantity: number) {
    const [updated] = await db.update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, cartItemId))
      .returning();
    return updated;
  }

  async removeItem(cartItemId: string) {
    const [deleted] = await db.delete(cartItems)
      .where(eq(cartItems.id, cartItemId))
      .returning();
    return deleted;
  }

  async clearCart(cartId: string) {
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }
}

export const cartRepository = new CartRepository();
