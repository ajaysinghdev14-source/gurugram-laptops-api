import type { Request, Response, NextFunction } from 'express';
import { orderService } from './order.service.js';

export class OrderController {
  async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const { shippingAddress } = req.body;
      
      if (!shippingAddress) {
        res.status(400).json({ success: false, message: 'Shipping address is required' });
        return;
      }

      const order = await orderService.checkout(userId, shippingAddress);
      res.status(201).json({ success: true, data: order, message: 'Order placed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const orders = await orderService.getMyOrders(userId);
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  async getAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await orderService.getAllOrders();
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedOrder = await orderService.updateOrderStatus(id as string, status);
      res.status(200).json({ success: true, data: updatedOrder, message: 'Order status updated' });
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
