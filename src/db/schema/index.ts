// Re-export auth tables from their new home so existing imports don't break
export { users, refreshTokens, authTokens } from "../../modules/auth/user.model";
