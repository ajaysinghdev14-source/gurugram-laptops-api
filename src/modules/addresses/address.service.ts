import { addressRepository } from './address.repository.js';
import { ApiError } from '../../common/exceptions/api-error.js';

export class AddressService {
  async getAddresses(userId: string) {
    return await addressRepository.getAddressesByUserId(userId);
  }

  async createAddress(
    userId: string,
    data: {
      fullName: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      label?: string;
      isDefault?: boolean;
    }
  ) {
    if (data.label) {
      const existingWithLabel = await addressRepository.getAddressByLabel(userId, data.label);
      if (existingWithLabel) {
        throw ApiError.badRequest(`You already have an address saved as ${data.label}. Please use a different label.`);
      }
    }

    return await addressRepository.createAddress(userId, data);
  }

  async updateAddress(
    addressId: string,
    userId: string,
    data: {
      fullName?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      label?: string;
      isDefault?: boolean;
    }
  ) {
    const existing = await addressRepository.getAddressById(addressId, userId);
    if (!existing) {
      throw ApiError.notFound('Address not found');
    }

    if (data.label && data.label !== existing.label) {
      const existingWithLabel = await addressRepository.getAddressByLabel(userId, data.label);
      if (existingWithLabel) {
        throw ApiError.badRequest(`You already have an address saved as ${data.label}. Please use a different label.`);
      }
    }

    return await addressRepository.updateAddress(addressId, userId, data);
  }

  async deleteAddress(addressId: string, userId: string) {
    const deleted = await addressRepository.deleteAddress(addressId, userId);
    if (!deleted) {
      throw ApiError.notFound('Address not found');
    }
    return deleted;
  }

  async setDefaultAddress(addressId: string, userId: string) {
    const existing = await addressRepository.getAddressById(addressId, userId);
    if (!existing) {
      throw ApiError.notFound('Address not found');
    }
    return await addressRepository.setDefaultAddress(addressId, userId);
  }
}

export const addressService = new AddressService();
