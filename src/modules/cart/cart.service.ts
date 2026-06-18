import { cartRepository } from './cart.repository.js';
import { ApiError } from '../../common/exceptions/api-error.js';

export class CartService {
  async getCart(userId: string) {
    return await cartRepository.getOrCreateCart(userId);
  }

  async addItem(userId: string, data: { productId: string; quantity: number; variantName?: string }) {
    const cart = await cartRepository.getOrCreateCart(userId);
    return await cartRepository.addItemToCart(cart!.id, data.productId, data.quantity, data.variantName || null);
  }

  async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      return await cartRepository.removeItem(cartItemId);
    }
    // Verify item belongs to user
    const cart = await cartRepository.getCartByUserId(userId);
    if (!cart) throw ApiError.notFound('Cart not found');
    const item = cart.items.find((i: any) => i.id === cartItemId);
    if (!item) throw ApiError.notFound('Item not found in your cart');

    return await cartRepository.updateItemQuantity(cartItemId, quantity);
  }

  async removeItem(userId: string, cartItemId: string) {
    const cart = await cartRepository.getCartByUserId(userId);
    if (!cart) throw ApiError.notFound('Cart not found');
    const item = cart.items.find((i: any) => i.id === cartItemId);
    if (!item) throw ApiError.notFound('Item not found in your cart');

    return await cartRepository.removeItem(cartItemId);
  }

  async syncCart(userId: string, localItems: Array<{ productId: string; quantity: number; variantName?: string }>) {
    const cart = await cartRepository.getOrCreateCart(userId);
    for (const item of localItems) {
      await cartRepository.addItemToCart(cart!.id, item.productId, item.quantity, item.variantName || null);
    }
    return await cartRepository.getCartByUserId(userId);
  }
}

export const cartService = new CartService();
