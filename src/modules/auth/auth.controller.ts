import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { ApiError } from '../../common/exceptions/api-error.js';

export class AuthController {
  public static createUserWithEmailAndPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const newUser = await AuthService.createUserWithEmailAndPassword(req.body);
      return ApiResponse.created(res, 'User registerd successfully', newUser);
    } catch (error) {
      next(error);
    }
  };

  public static loginWithEmailAndPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { user, tokens } = await AuthService.loginWithEmailAndPassword(req.body);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
      };

      // Set Access Token (15 minutes)
      res.cookie('accessToken', tokens.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
      // Set Refresh Token (7 days)
      res.cookie('refreshToken', tokens.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return ApiResponse.success(res, 'Login successful', { user });
    } catch (error) {
      next(error);
    }
  };

  public static refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Read token from COOKIES, not body!
      const oldRefreshToken = req.cookies.refreshToken;
      if (!oldRefreshToken) throw ApiError.unauthorized("No refresh token found in cookies");

      const tokens = await AuthService.refreshToken({ refreshToken: oldRefreshToken });

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
      };

      // 2. Set the NEW cookies
      res.cookie('accessToken', tokens.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie('refreshToken', tokens.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return ApiResponse.success(res, 'Token refreshed successfully', null);
    } catch (error) {
      next(error);
    }
  };

  public static logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = res.locals.user.id;
      await AuthService.logout(userId);

      // Clear the cookies to officially log the user out!
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return ApiResponse.success(res, 'Logged out successfully', null);
    } catch (error) {
      next(error);
    }
  };

  public static verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      if (!token) throw new Error("Token is required");
      await AuthService.verifyEmail(token);
      return ApiResponse.success(res, 'Email verified successfully', null);
    } catch (error) {
      next(error);
    }
  };

  public static forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      if (!email) throw new Error("Email is required");
      await AuthService.forgotPassword(email);
      return ApiResponse.success(res, 'If an account exists, a reset link was sent', null);
    } catch (error) {
      next(error);
    }
  };

  public static resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) throw new Error("Token and new password are required");
      await AuthService.resetPassword(token, newPassword);
      return ApiResponse.success(res, 'Password reset successfully', null);
    } catch (error) {
      next(error);
    }
  };
}
