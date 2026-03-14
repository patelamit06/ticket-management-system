import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  EventSalesDetailsResponse,
  ReportsService,
  SalesReportResponse,
} from './reports.service';

type User = { id: string; role: string };

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales/events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sales totals per event' })
  @ApiResponse({ status: 200, description: 'Sales report' })
  getEventSales(@Req() req: Request & { user: User }): Promise<SalesReportResponse> {
    return this.reportsService.getEventSalesReport(
      req.user.id,
      req.user.role === 'super_admin',
    );
  }

  @Get('sales/events/:eventId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get buyer details for sold tickets of a published event' })
  @ApiResponse({ status: 200, description: 'Event sales detail report' })
  getEventSalesDetails(
    @Param('eventId') eventId: string,
    @Req() req: Request & { user: User },
  ): Promise<EventSalesDetailsResponse> {
    return this.reportsService.getEventSalesDetails(
      eventId,
      req.user.id,
      req.user.role === 'super_admin',
    );
  }
}
