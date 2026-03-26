import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckInService } from './check-in.service';

type User = { id: string; role: string };

class ScanDto {
  @IsString()
  @MinLength(1)
  uniqueCode!: string;
}

@ApiTags('check-in')
@Controller('check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Get('event/:eventId/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get check-in stats for an event (organizer only)' })
  @ApiResponse({ status: 200, description: 'Check-in stats' })
  getEventStats(
    @Req() req: Request & { user: User },
    @Param('eventId') eventId: string,
  ) {
    return this.checkInService.getEventStats(eventId, req.user.id);
  }

  @Post('scan')
  @HttpCode(200)
  @ApiOperation({ summary: 'Validate and check in a ticket by its unique code' })
  @ApiResponse({ status: 200, description: 'Checked in successfully' })
  @ApiResponse({ status: 404, description: 'Invalid ticket code' })
  @ApiResponse({ status: 409, description: 'Ticket already used' })
  scan(@Body() dto: ScanDto) {
    return this.checkInService.scan(dto.uniqueCode);
  }
}
