import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from './env.js';

import * as usersSchema from '../../modules/auth/user.model.js';
import * as categoriesSchema from '../../modules/categories/category.model.js';
import * as productsSchema from '../../modules/products/product.model.js';
import * as cartsSchema from '../../modules/cart/cart.model.js';
import * as ordersSchema from '../../modules/orders/order.model.js';
import * as addressesSchema from '../../modules/addresses/address.model.js';

// We use a Connection Pool so multiple requests don't block each other
const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
});

const schema = {
  ...usersSchema,
  ...categoriesSchema,
  ...productsSchema,
  ...cartsSchema,
  ...ordersSchema,
  ...addressesSchema,
};

// This `db` object is what we will import in our Services to write queries!
export const db = drizzle(pool, { schema });

// A helper function to verify the connection when the server starts
export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL Database!');
    client.release();
  } catch (error) {
    console.error('Failed to connect to the Database', error);
    process.exit(1); // Exit with failure
  }
};
