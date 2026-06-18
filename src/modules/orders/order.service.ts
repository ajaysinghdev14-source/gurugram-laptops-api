import { orderRepository } from './order.repository.js';
import { cartRepository } from '../cart/cart.repository.js';
import { UserRepository } from '../auth/user.repository.js';
import { EmailUtil } from '../../common/utils/email.util.js';
import { PdfUtil } from '../../common/utils/pdf.util.js';
import { ApiError } from '../../common/exceptions/api-error.js';

export class OrderService {
  async checkout(userId: string, shippingAddress: any) {
    // 1. Get the user's cart
    const cart = await cartRepository.getCartByUserId(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw ApiError.badRequest('Cart is empty');
    }

    // 2. Calculate the total and construct order items
    let totalAmount = 0;
    const orderItemsToInsert: Array<{ productId: string; variantName: string | null; quantity: number; price: number }> = [];

    for (const item of cart.items) {
      if (!item.product) {
        throw ApiError.badRequest(`Product not found for cart item: ${item.id}`);
      }

      let unitPrice = Number(item.product.basePrice);

      if (item.variantName && (item.product as any).variants && Array.isArray((item.product as any).variants)) {
        const variant = (item.product as any).variants.find((v: any) => v.name === item.variantName);
        if (variant && variant.price) {
          unitPrice = Number(variant.price);
        }
      }

      totalAmount += unitPrice * item.quantity;
      
      orderItemsToInsert.push({
        productId: item.productId,
        variantName: item.variantName,
        quantity: item.quantity,
        price: unitPrice,
      });
    }

    // 3. Create the order and clear the cart in a transaction
    const order = await orderRepository.createOrderWithItems(
      userId,
      totalAmount.toFixed(2),
      shippingAddress,
      orderItemsToInsert,
      cart.id
    );

    // 4. Send Order Confirmation Email asynchronously
    try {
      const user = await UserRepository.findUserById(userId);
      if (user && user.email) {
        // Prepare items array for email
        const emailItems = cart.items.map(item => ({
          productName: item.product?.title || 'Unknown Product',
          variantName: item.variantName,
          quantity: item.quantity,
          price: orderItemsToInsert.find(oi => oi.productId === item.productId && oi.variantName === item.variantName)?.price || 0
        }));

        // Generate PDF Invoice
        const pdfBuffer = await PdfUtil.generateOrderInvoice(
          user.fullName || 'Valued Customer',
          order?.id || '',
          order?.totalAmount || '0',
          shippingAddress,
          emailItems
        );

        // Send email (don't await to avoid blocking response)
        EmailUtil.sendOrderConfirmationEmail(
          user.email,
          user.fullName || 'Valued Customer',
          order?.id || '',
          order?.totalAmount || '0',
          shippingAddress,
          emailItems,
          pdfBuffer
        ).catch(console.error);
      }
    } catch (error) {
      console.error('Failed to trigger order confirmation email:', error);
    }

    return order;
  }

  async getMyOrders(userId: string) {
    return await orderRepository.getOrdersByUserId(userId);
  }

  async getAllOrders() {
    return await orderRepository.getAllOrders();
  }

  async updateOrderStatus(orderId: string, status: string) {
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest('Invalid status');
    }
    return await orderRepository.updateOrderStatus(orderId, status);
  }
}

export const orderService = new OrderService();
