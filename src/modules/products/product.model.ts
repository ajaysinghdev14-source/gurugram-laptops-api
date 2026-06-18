import { pgTable, uuid, varchar, boolean, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  brand: varchar('brand', { length: 100 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  subcategory: varchar('subcategory', { length: 100 }).notNull(),
  isRefurbished: boolean('is_refurbished').default(false).notNull(),
  
  images: jsonb('images').$type<string[]>().default([]).notNull(),
  
  basePrice: integer('base_price').notNull().default(0),
  originalBasePrice: integer('original_base_price').notNull().default(0),
  inStock: boolean('in_stock').default(true).notNull(),
  
  attributes: jsonb('attributes').$type<{key: string, value: string}[]>().default([]).notNull(),
  
  enableVariants: boolean('enable_variants').default(false).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 255 }).notNull(),
  ram: varchar('ram', { length: 50 }),
  storage: varchar('storage', { length: 50 }),
  
  price: integer('price').notNull().default(0),
  originalPrice: integer('original_price').notNull().default(0),
  inStock: boolean('in_stock').default(true).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));
