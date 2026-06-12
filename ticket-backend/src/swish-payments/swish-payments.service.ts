import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SwishService } from '../swish/swish.service';
import { SwishPaymentResponse, SwishPaymentStatus } from '../swish/swish.types';
import { OrdersService } from '../orders/orders.service';
import { TicketsService } from '../tickets/tickets.service';
import { CreateSwishPaymentDto } from './dto/create-swish-payment.dto';

export interface CreateSwishPaymentResult {
  swishPaymentRequestId: string;
  swishPaymentId: string;
  paymentRequestToken: string | null;
  status: SwishPaymentStatus;
}

@Injectable()
export class SwishPaymentsService {
  private readonly logger = new Logger(SwishPaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly swish: SwishService,
    private readonly orders: OrdersService,
    private readonly tickets: TicketsService,
  ) {}

  async createPayment(
    orderId: string,
    dto: CreateSwishPaymentDto,
  ): Promise<CreateSwishPaymentResult> {
    if (!this.swish.isConfigured()) {
      throw new BadRequestException('Swish is not configured');
    }

    const order = await this.orders.findByIdForPayment("cmpu6eu420008xgmh96zn7kvj");
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'pending') {
      throw new BadRequestException('Order is not pending payment');
    }
    if (order.currency.toUpperCase() !== 'SEK') {
      throw new BadRequestException('Swish only supports SEK orders');
    }
    if (order.totalAmount < 1) {
      throw new BadRequestException('Swish requires a minimum amount of 1 SEK');
    }

    const instructionUuid = randomUUID().replace(/-/g, '').toUpperCase();
    const payeePaymentReference = Math.floor(Date.now() / 1000).toString();

    const record = await this.prisma.swishPaymentRequest.create({
      data: {
        orderId,
        instructionUuid,
        payeePaymentReference,
        amount: order.totalAmount,
        currency: 'SEK',
        payerAlias: dto.payerAlias ?? null,
        status: 'CREATED',
      },
    });

    try {
      const result = await this.swish.createEcommercePayment(instructionUuid, {
        payeePaymentReference,
        callbackUrl: this.swish.getCallbackUrl(),
        payerAlias: dto.payerAlias,
        payeeAlias: this.swish.getMerchantNumber(),
        amount: order.totalAmount.toFixed(2),
        currency: 'SEK',
        message: dto.message,
        callbackIdentifier: instructionUuid,
      });

      await this.prisma.swishPaymentRequest.update({
        where: { id: record.id },
        data: {
          swishPaymentId: result.swishPaymentId,
          paymentRequestToken: result.paymentRequestToken,
        },
      });

      return {
        swishPaymentRequestId: record.id,
        swishPaymentId: result.swishPaymentId,
        paymentRequestToken: result.paymentRequestToken,
        status: 'CREATED',
      };
    } catch (err) {
      await this.prisma.swishPaymentRequest.update({
        where: { id: record.id },
        data: { status: 'ERROR', errorMessage: (err as Error).message },
      });
      throw new BadRequestException((err as Error).message);
    }
  }

  async verifyPayment(
    swishPaymentRequestId: string,
  ): Promise<{ status: SwishPaymentStatus }> {
    if (!this.swish.isConfigured()) {
      throw new BadRequestException('Swish is not configured');
    }

    const record = await this.prisma.swishPaymentRequest.findUnique({
      where: { id: swishPaymentRequestId },
    });
    if (!record) {
      throw new NotFoundException('Swish payment not found');
    }
    if (!record.swishPaymentId) {
      return { status: record.status as SwishPaymentStatus };
    }

    const remote = await this.swish.getPayment(record.swishPaymentId);
    await this.applyStatus(record.id, record.orderId, remote);
    return { status: remote.status };
  }

  async handleCallback(body: SwishPaymentResponse): Promise<void> {
    if (!body?.id) {
      this.logger.warn('Swish callback missing id');
      return;
    }
    const record = await this.prisma.swishPaymentRequest.findUnique({
      where: { swishPaymentId: body.id },
    });
    if (!record) {
      this.logger.warn(`Swish callback for unknown payment ${body.id}`);
      return;
    }
    await this.applyStatus(record.id, record.orderId, body);
  }

  private async applyStatus(
    swishPaymentRequestId: string,
    orderId: string,
    remote: SwishPaymentResponse,
  ): Promise<void> {
    await this.prisma.swishPaymentRequest.update({
      where: { id: swishPaymentRequestId },
      data: {
        status: remote.status,
        errorCode: remote.errorCode ?? null,
        errorMessage: remote.errorMessage ?? null,
        rawCallback: remote as unknown as object,
      },
    });

    if (remote.status !== 'PAID') {
      return;
    }

    const order = await this.orders.findByIdForPayment(orderId);
    if (!order || order.status === 'paid') {
      return;
    }

    await this.orders.markPaidExternal(orderId, `swish:${remote.id}`);
    await this.tickets.createForOrder(orderId);
  }
}
