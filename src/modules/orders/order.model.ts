import { pgTable, uuid, varchar, integer, timestamp, jsonb, decimal } from 'drizzle-orm/pg-core';
import { users } from '../auth/user.model.js';
import { products } from '../products/product.model.js';
import { relations } from 'drizzle-orm';

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }), // Kept on user deletion for record keeping
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('COD'),
  shippingAddress: jsonb('shipping_address').notNull(), // { fullName, address, city, state, zipCode, phone }
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }), // Set null if product deleted, keep record
  variantName: varchar('variant_name', { length: 255 }), 
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // snapshot price at time of purchase
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
