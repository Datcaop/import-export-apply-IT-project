import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify, SignJWT } from 'jose';
import type { AuthUser } from './auth.types.js';

@Injectable()
export class TokenService {
  private readonly key: Uint8Array;
  private readonly expiresIn: string;

  constructor(config: ConfigService) {
    this.key = new TextEncoder().encode(config.getOrThrow<string>('JWT_SECRET'));
    this.expiresIn = config.get<string>('JWT_EXPIRES_IN') ?? '8h';
  }

  sign(user: AuthUser): Promise<string> {
    return new SignJWT({ name: user.fullName, username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id.toString())
      .setIssuedAt()
      .setExpirationTime(this.expiresIn)
      .sign(this.key);
  }

  /** Trả người dùng trong token, hoặc null nếu token sai / hết hạn. */
  async verify(token: string): Promise<AuthUser | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, { algorithms: ['HS256'] });
      if (!payload.sub || !/^\d+$/.test(payload.sub)) return null;
      return {
        id: BigInt(payload.sub),
        username: typeof payload.username === 'string' ? payload.username : '',
        fullName: typeof payload.name === 'string' ? payload.name : '',
      };
    } catch {
      return null;
    }
  }
}
