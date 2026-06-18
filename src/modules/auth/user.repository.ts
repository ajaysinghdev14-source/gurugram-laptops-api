import { eq } from 'drizzle-orm';
import { db } from '../../common/config/db.js';
import { users } from './user.model.js';
import type { RegisterDto } from './dto/auth.dto.js';

export class UserRepository {
  public static async findUserByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : null;
  }

  public static async insertUser(
    data: RegisterDto & { password: string; emailVerificationToken?: string },
  ) {
    const [newUser] = await db
      .insert(users)
      .values({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        emailVerificationToken: data.emailVerificationToken,
      })
      .returning();

    return newUser;
  }

  public static async updateUser(id: string, updateData: any) {
    const [updateUser] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();

    return updateUser;
  }

  public static async findUserById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : null;
  }

  public static async findUserByVerificationToken(token: string) {
    const result = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    return result.length > 0 ? result[0] : null;
  }

  public static async findUserByResetToken(token: string) {
    const result = await db.select().from(users).where(eq(users.resetPasswordToken, token));
    return result.length > 0 ? result[0] : null;
  }

  public static async getAllUsers() {
    return await db.select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
      status: users.status,
      isEmailVerified: users.isEmailVerified,
      createdAt: users.createdAt,
    }).from(users);
  }
}
