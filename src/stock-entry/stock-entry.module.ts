import { Module } from '@nestjs/common';
import { StockEntriesService } from './stock-entry.service';
import { StockEntriesController } from './stock-entry.controller';
import { PrismaModule } from 'src/prisma.module';
import { PrismaService } from 'src/prisma.service';

@Module({
 imports: [PrismaModule],
  controllers: [StockEntriesController],
  providers: [StockEntriesService, PrismaService],
  exports: [StockEntriesService],
})
export class StockEntryModule {}
