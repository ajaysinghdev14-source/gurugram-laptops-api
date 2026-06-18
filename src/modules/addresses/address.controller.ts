import type { Request, Response, NextFunction } from 'express';
import { addressService } from './address.service.js';

export class AddressController {
  async getAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const addresses = await addressService.getAddresses(userId);
      res.status(200).json({ success: true, data: addresses });
    } catch (error) {
      next(error);
    }
  }

  async createAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const address = await addressService.createAddress(userId, req.body);
      res.status(201).json({ success: true, data: address, message: 'Address added successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const { id } = req.params;
      const address = await addressService.updateAddress(id as string, userId, req.body);
      res.status(200).json({ success: true, data: address, message: 'Address updated' });
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const { id } = req.params;
      await addressService.deleteAddress(id as string, userId);
      res.status(200).json({ success: true, message: 'Address deleted' });
    } catch (error) {
      next(error);
    }
  }

  async setDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const { id } = req.params;
      const address = await addressService.setDefaultAddress(id as string, userId);
      res.status(200).json({ success: true, data: address, message: 'Default address updated' });
    } catch (error) {
      next(error);
    }
  }
}

export const addressController = new AddressController();
