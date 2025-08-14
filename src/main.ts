import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const corsOptions: CorsOptions = {
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  };

  const config = new DocumentBuilder()
    .setTitle('Catálogo de Productos')
    .setDescription('API para gestión de productos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.use(cookieParser());
  app.enableCors(corsOptions);

  const port = parseInt(process.env.PORT);
  await app.listen(port);
  console.log(`App running on: http://localhost:${port}`);
}
bootstrap();
