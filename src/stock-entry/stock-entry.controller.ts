import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { StockEntriesService } from './stock-entry.service';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { UpdateStockEntryDto } from './dto/update-stock-entry.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Stock Entries')
@Controller('stock-entries')
export class StockEntriesController {
  constructor(private readonly stockEntriesService: StockEntriesService) {}

  @Post()
  @ApiBearerAuth()
  create(@Body() dto: CreateStockEntryDto) {
    return this.stockEntriesService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  findAll() {
    return this.stockEntriesService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.stockEntriesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdateStockEntryDto) {
    return this.stockEntriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.stockEntriesService.remove(id);
  }
}
