import express, { type Application } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgon from 'morgan';
import { healthRoutes } from '../modules/health/health.routes.js';
import { ApiError } from '../common/exceptions/api-error.js';
import { globalErrorHandler } from '../common/middlewares/error-handler.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { adminRoutes } from '../modules/admin/admin.routes.js';
import { productRoutes } from '../modules/products/product.routes.js';
import { uploadRoutes } from '../modules/upload/upload.routes.js';
import { categoryRoutes } from '../modules/categories/category.routes.js';
import { cartRoutes } from '../modules/cart/cart.routes.js';
import { orderRoutes } from '../modules/orders/order.routes.js';
import { addressRoutes } from '../modules/addresses/address.routes.js';

export const buildApp = (): Application => {
  const app = express();

  app.use(
    cors({
      origin: ['http://localhost:3000'],
      credentials: true,
    }),
  );

  app.use(cookieParser());
  app.use(express.json());
  app.use(morgon('dev'));

  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/products', productRoutes);
  app.use('/api/v1/upload', uploadRoutes);
  app.use('/api/v1/categories', categoryRoutes);
  app.use('/api/v1/cart', cartRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/addresses', addressRoutes);

  app.use((req, res, next) => {
    next(ApiError.notFound(`Route not found: ${req.originalUrl}`));
  });

  app.use(globalErrorHandler);

  return app;
};
