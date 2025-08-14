import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { IUser } from 'src/users/interfaces/user.interface';
import { LoginDto, RegisterDto } from './dto';
import { CookieOptions, Response } from 'express';

const ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hora en segundos
// const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 días en segundos
const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

const HTTP_COOKIE_KEY = 'auth_token';
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none',
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private generateToken(userId: string, email: string, role = 'user') {
    try {
      const payload = { sub: userId, email, role };
      return { access_token: this.jwtService.sign(payload) };
    } catch (error) {
      console.error('Error generating token:', error);
      throw new InternalServerErrorException(
        'Error generating authentication credentials',
      );
    }
  }

  async register(dto: RegisterDto) {
    const user: IUser = await this.usersService.create(
      dto.email,
      dto.password,
      dto.role ?? 'user',
    );
    return this.generateToken(user._id, user.email, user.role);
  }

  async login(dto: LoginDto, res: Response) {
    const user: IUser | null = await this.usersService.findByEmail(dto.email);
    if (
      !user ||
      !(await this.usersService.validatePassword(dto.password, user.password))
    ) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.generateAuthResponse(user._id, user.email, user.role, res);
  }

  private generateAuthResponse(
    userId: string,
    email: string,
    role: string,
    res: any,
  ): { success: boolean; message: string } {
    try {
      const token = this.generateToken(userId, email, role);

      res.cookie(HTTP_COOKIE_KEY, token, {
        ...COOKIE_OPTIONS,
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
      });
    } catch (error) {
      console.log('Error generando cookie:', error);
      throw new InternalServerErrorException(
        'Error generating authentication credentials',
      );
    }
  }

  async verifySession(
    req: any,
    res: Response,
  ): Promise<{ authenticated: boolean; user?: any }> {
    try {
      const cookieValue = req.cookies[HTTP_COOKIE_KEY];
      // Puede ser un objeto { access_token: '...' } o un string
      const token = cookieValue.access_token ?? cookieValue;

      console.log('token => ', token);

      if (!token) {
        return { authenticated: false };
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      const expiresIn = payload.exp - Math.floor(Date.now() / 1000);

      if (expiresIn < 30 * 60) {
        const newToken = this.jwtService.sign({
          sub: userId,
          email: payload.email,
        });

        res.cookie(HTTP_COOKIE_KEY, newToken, {
          ...COOKIE_OPTIONS,
          maxAge: 24 * 60 * 60 * 1000, // 1 día
        });
      }
      return {
        authenticated: true,
        user: {
          email: payload.email,
        },
      };
    } catch (error) {
      console.log('Error verificando sesión:', error);
      return { authenticated: false };
    }
  }

  async refreshTokens(req: any, res: Response) {
    try {
      const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

      if (!refreshToken) {
        throw new UnauthorizedException('No refresh token provided');
      }

      let payload;
      try {
        payload = this.jwtService.verify(refreshToken);
      } catch (error) {
        console.log('Error verificando refresh token:', error);
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const userId = payload.sub;
      const email = payload.email;

      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      const accessPayload = { sub: userId, email, type: 'access' };
      const newAccessToken = this.jwtService.sign(accessPayload, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
      });

      res.cookie(ACCESS_TOKEN_COOKIE, newAccessToken, {
        ...COOKIE_OPTIONS,
        maxAge: ACCESS_TOKEN_EXPIRY * 1000,
      });

      return {
        success: true,
        message: 'Token refreshed successfully',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        res.clearCookie(ACCESS_TOKEN_COOKIE, COOKIE_OPTIONS);
        res.clearCookie(REFRESH_TOKEN_COOKIE, COOKIE_OPTIONS);
        throw error;
      }
      throw new InternalServerErrorException('Error refreshing token');
    }
  }

  logout(res: any) {
    try {
      const tokenExists = Boolean(res.req.cookies?.[HTTP_COOKIE_KEY]);

      res.clearCookie(HTTP_COOKIE_KEY, COOKIE_OPTIONS);

      return tokenExists
        ? { success: true, message: 'Session successfully closed.' }
        : { success: false, message: 'No active session found.' };
    } catch (error) {
      console.error('Error during logout:', error);
      throw new InternalServerErrorException('Error during logout process');
    }
  }
}
