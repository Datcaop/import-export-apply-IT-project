import { hash, verify } from '@node-rs/argon2';

export const hashPassword = (plain: string) => hash(plain);

export async function verifyPassword(passwordHash: string, plain: string): Promise<boolean> {
  try {
    return await verify(passwordHash, plain);
  } catch {
    return false;
  }
}
