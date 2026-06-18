import { db } from '../../common/config/db.js';
import { orders, orderItems } from './order.model.js';
import { cartItems } from '../cart/cart.model.js';
import { eq, desc } from 'drizzle-orm';

export class OrderRepository {
  async createOrderWithItems(
    userId: string,
    totalAmount: string,
    shippingAddress: any,
    items: Array<{
      productId: string;
      variantName: string | null;
      quantity: number;
      price: number;
    }>,
    cartIdToClear?: string,
  ) {
    return await db.transaction(async (tx) => {
      // 1. Create the order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          userId,
          totalAmount,
          shippingAddress,
          paymentMethod: 'COD',
          status: 'PENDING',
        })
        .returning();

      // 2. Create the order items
      if (items.length > 0) {
        const orderItemsToInsert = items.map((item) => ({
          orderId: newOrder!.id,
          productId: item.productId,
          variantName: item.variantName,
          quantity: item.quantity,
          price: item.price.toString(),
        }));
        await tx.insert(orderItems).values(orderItemsToInsert);
      }

      // 3. Clear the user's cart
      if (cartIdToClear) {
        await tx.delete(cartItems).where(eq(cartItems.cartId, cartIdToClear));
      }

      return newOrder;
    });
  }

  async getOrdersByUserId(userId: string) {
    return await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      with: {
        items: {
          with: {
            product: true,
          },
        },
        user: true,
      },
      orderBy: [desc(orders.createdAt)],
    });
  }

  async getAllOrders() {
    return await db.query.orders.findMany({
      with: {
        items: {
          with: {
            product: true,
          },
        },
        user: true,
      },
      orderBy: [desc(orders.createdAt)],
    });
  }

  async updateOrderStatus(orderId: string, status: string) {
    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return updated;
  }
}

export const orderRepository = new OrderRepository();
