import { db } from '../../common/config/db.js';
import { addresses } from './address.model.js';
import { eq, and, desc } from 'drizzle-orm';

export class AddressRepository {
  async getAddressesByUserId(userId: string) {
    return await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
  }

  async getAddressById(addressId: string, userId: string) {
    const [address] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));
    return address;
  }

  async getAddressByLabel(userId: string, label: string) {
    const [address] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.userId, userId), eq(addresses.label, label)));
    return address;
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
    return await db.transaction(async (tx) => {
      // If this is the default address, unset all other defaults first
      if (data.isDefault) {
        await tx
          .update(addresses)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)));
      }

      // Check if user has any addresses at all — first one is always default
      const existing = await tx
        .select({ id: addresses.id })
        .from(addresses)
        .where(eq(addresses.userId, userId))
        .limit(1);

      const isFirst = existing.length === 0;

      const [newAddress] = await tx
        .insert(addresses)
        .values({
          userId,
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          label: data.label || 'HOME',
          isDefault: isFirst ? true : (data.isDefault ?? false),
        })
        .returning();

      return newAddress;
    });
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
    return await db.transaction(async (tx) => {
      if (data.isDefault) {
        await tx
          .update(addresses)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)));
      }

      const [updated] = await tx
        .update(addresses)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
        .returning();

      return updated;
    });
  }

  async deleteAddress(addressId: string, userId: string) {
    return await db.transaction(async (tx) => {
      // Check if the address being deleted is the default
      const [toDelete] = await tx
        .select()
        .from(addresses)
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));

      if (!toDelete) return null;

      await tx.delete(addresses).where(eq(addresses.id, addressId));

      // If we deleted the default, promote the most recent remaining address
      if (toDelete.isDefault) {
        const [nextDefault] = await tx
          .select()
          .from(addresses)
          .where(eq(addresses.userId, userId))
          .orderBy(desc(addresses.createdAt))
          .limit(1);

        if (nextDefault) {
          await tx
            .update(addresses)
            .set({ isDefault: true, updatedAt: new Date() })
            .where(eq(addresses.id, nextDefault.id));
        }
      }

      return toDelete;
    });
  }

  async setDefaultAddress(addressId: string, userId: string) {
    return await db.transaction(async (tx) => {
      // Unset all defaults
      await tx
        .update(addresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)));

      // Set the new default
      const [updated] = await tx
        .update(addresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
        .returning();

      return updated;
    });
  }
}

export const addressRepository = new AddressRepository();
