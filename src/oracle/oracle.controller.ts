import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OracleService } from './oracle.service';
import { CreateOracleDto } from './dto/create-oracle.dto';
import { UpdateOracleDto } from './dto/update-oracle.dto';

@Controller('oracle')
export class OracleController {
  constructor(private readonly oracleService: OracleService) {}

  @Post()
  create(@Body() createOracleDto: CreateOracleDto) {
    return this.oracleService.create(createOracleDto);
  }

  @Get()
  findAll() {
    return this.oracleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.oracleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOracleDto: UpdateOracleDto) {
    return this.oracleService.update(+id, updateOracleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.oracleService.remove(+id);
  }
}
