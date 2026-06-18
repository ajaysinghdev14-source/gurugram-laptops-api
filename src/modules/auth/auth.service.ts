import { ApiError } from '../../common/exceptions/api-error.js';
import type { LoginDto, RefreshTokenDto, RegisterDto } from './dto/auth.dto.js';
import { UserRepository } from './user.repository.js';
import { PasswordUtil } from '../../common/utils/password.util.js';
import { JwtUtil } from '../../common/utils/jwt.util.js';
import crypto from 'crypto';
import { EmailUtil } from '../../common/utils/email.util.js';

export class AuthService {
  public static async createUserWithEmailAndPassword(data: RegisterDto) {
    const existingUser = await UserRepository.findUserByEmail(data.email);

    if (existingUser) {
      throw new ApiError(400, 'A user with this email already exists');
    }

    const hashedPassword = await PasswordUtil.hash(data.password);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await UserRepository.insertUser({
      ...data,
      password: hashedPassword,
      emailVerificationToken,
    });

    // Send the verification email in the background
    EmailUtil.sendVerificationEmail(data.email, emailVerificationToken).catch(console.error);

    return {
      id: newUser?.id,
      fullName: newUser?.fullName,
      email: newUser?.email,
      createdAt: newUser?.createdAt,
    };
  }

  public static async loginWithEmailAndPassword(data: LoginDto) {
    const user = await UserRepository.findUserByEmail(data.email);
    if (!user || !user.password) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status === 'BANNED') {
      throw new ApiError(403, 'Your account has been banned. Please contact support.');
    }

    const isPasswordValid = await PasswordUtil.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const accessToken = JwtUtil.generateAccessToken(user.id, user.role || 'USER');
    const refreshToken = JwtUtil.generateRefreshToken(user.id, user.role || 'USER');

    await UserRepository.updateUser(user.id, { refreshToken, updatedAt: new Date() });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  public static async refreshToken(data: RefreshTokenDto) {
    let decoded;
    try {
      decoded = JwtUtil.verifyRefreshToken(data.refreshToken);
    } catch (error) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // find the user
    const user = await UserRepository.findUserById(decoded.userId);

    // security check: does the token match the database
    if (!user || user.refreshToken !== data.refreshToken) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Generate new tokens (This is called Refresh Token Rotation)
    const newAccessToken = JwtUtil.generateAccessToken(user.id, user.role || 'USER');
    const newRefreshToken = JwtUtil.generateRefreshToken(user.id, user.role || 'USER');

    // save the new token in the DB
    await UserRepository.updateUser(user.id, {
      refreshToken: newRefreshToken,
      updatedAt: new Date(),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  public static async logout(userId: string) {
    // We just wipe the refresh token from the database!
    await UserRepository.updateUser(userId, {
      refreshToken: null,
      updatedAt: new Date(),
    });

    return true;
  }

  public static async verifyEmail(token: string) {
    const user = await UserRepository.findUserByVerificationToken(token);
    if (!user) throw new ApiError(400, 'Invalid or expired verification token');

    await UserRepository.updateUser(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null, // Clear the token so it can't be reused
      updatedAt: new Date(),
    });

    return true;
  }

  public static async forgotPassword(email: string) {
    const user = await UserRepository.findUserByEmail(email);
    if (!user) {
      // For security, don't reveal if a user exists or not. Just return silently.
      return true;
    }

    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await UserRepository.updateUser(user.id, {
      resetPasswordToken,
      resetPasswordTokenExpires,
      updatedAt: new Date(),
    });

    // Send the email
    EmailUtil.sendPasswordResetEmail(email, resetPasswordToken).catch(console.error);
    return true;
  }

  public static async resetPassword(token: string, newPassword: string) {
    const user = await UserRepository.findUserByResetToken(token);
    
    // Check if token exists and hasn't expired
    if (!user || !user.resetPasswordTokenExpires || user.resetPasswordTokenExpires < new Date()) {
      throw new ApiError(400, 'Invalid or expired password reset token');
    }

    const hashedPassword = await PasswordUtil.hash(newPassword);

    await UserRepository.updateUser(user.id, {
      password: hashedPassword,
      resetPasswordToken: null, // Clear token
      resetPasswordTokenExpires: null,
      updatedAt: new Date(),
    });

    return true;
  }
}
