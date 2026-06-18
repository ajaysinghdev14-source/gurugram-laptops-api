import bcrypt from 'bcryptjs';

export class PasswordUtil {
  public static async hash(password: string): Promise<string> {
    const SALT_ROUNDS = 10;
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  public static async compare(plainText: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }
}
