import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { StockEntryModule } from './stock-entry/stock-entry.module';
import { SalesModule } from './sales/sales.module';
import { StockEntriesController } from './stock-entry/stock-entry.controller';
import { SalesController } from './sales/sales.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UsersController } from './users/users.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [   
    ConfigModule.forRoot({
      isGlobal: true, // 👈 rend le ConfigService disponible partout
    }),
    JwtModule.register({}), // on remplace les valeurs dans le service avec sign()
    ProductsModule,
    StockEntryModule,
    SalesModule,
    UsersModule, 
    AuthModule
  ],
  controllers: [AppController, StockEntriesController, SalesController, UsersController],
  providers: [AppService],
})
export class AppModule {}  
