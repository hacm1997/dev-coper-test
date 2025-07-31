import { Controller, Post, Body, Get, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto, RegisterDto } from './dto';
import { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'User sign up' })
  @ApiResponse({
    status: 201,
    description: 'access_token: token',
    schema: {
      example: {
        access_token: 'access_token_value',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Server error' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login request' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 500, description: 'Error del servidor' })
  login(@Body() dto: LoginDto, @Res() res: Response) {
    return this.authService.login(dto, res);
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify user session' })
  @ApiResponse({
    status: 200,
    description: 'response with user data if session is valid',
    schema: {
      example: {
        authenticated: true,
        user: {
          email: 'example@email.com',
        },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Server error' })
  async verifySession(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.verifySession(req, res);
    return res.status(200).json(result);
  }
}
