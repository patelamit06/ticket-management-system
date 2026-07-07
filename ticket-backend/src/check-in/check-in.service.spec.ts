import { ConflictException, NotFoundException } from '@nestjs/common';
import { CheckInService } from './check-in.service';

type MockPrisma = {
  ticket: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    updateMany: jest.Mock;
    count: jest.Mock;
  };
  $transaction: jest.Mock;
};

const orderItemContext = {
  order: { guestName: 'Jane Doe', guestEmail: 'jane@example.com' },
  ticketType: { name: 'VIP', event: { name: 'Summer Fest' } },
};

function makePrisma(): MockPrisma {
  const prisma: MockPrisma = {
    ticket: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  // Interactive transaction: run the callback against the same mock.
  prisma.$transaction.mockImplementation((fn: (tx: MockPrisma) => unknown) => fn(prisma));
  return prisma;
}

function makeService(prisma: MockPrisma) {
  return new CheckInService(prisma as never);
}

describe('CheckInService', () => {
  describe('scan', () => {
    it('throws 404 for an unknown code', async () => {
      const prisma = makePrisma();
      prisma.ticket.findUnique.mockResolvedValue(null);
      await expect(makeService(prisma).scan('nope')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('checks in a single-ticket item immediately with a usedAt:null guard', async () => {
      const prisma = makePrisma();
      prisma.ticket.findUnique.mockResolvedValue({
        id: 't1',
        usedAt: null,
        orderItem: { ...orderItemContext, tickets: [{ id: 't1', usedAt: null }] },
      });
      prisma.ticket.updateMany.mockResolvedValue({ count: 1 });

      const result = await makeService(prisma).scan('code1');

      expect(prisma.ticket.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 't1', usedAt: null } }),
      );
      expect(result).toMatchObject({
        status: 'checkedIn',
        success: true,
        checkedIn: 1,
        groupTotal: 1,
        remaining: 0,
        ticketTypeName: 'VIP',
      });
    });

    it('throws 409 for a used single-ticket item', async () => {
      const prisma = makePrisma();
      const usedAt = new Date('2026-07-07T09:30:00Z');
      prisma.ticket.findUnique.mockResolvedValue({
        id: 't1',
        usedAt,
        orderItem: { ...orderItemContext, tickets: [{ id: 't1', usedAt }] },
      });
      await expect(makeService(prisma).scan('code1')).rejects.toThrow(
        `Ticket already used at ${usedAt.toISOString()}`,
      );
    });

    it('throws 409 when the concurrent guard finds the ticket already used', async () => {
      const prisma = makePrisma();
      prisma.ticket.findUnique.mockResolvedValue({
        id: 't1',
        usedAt: null,
        orderItem: { ...orderItemContext, tickets: [{ id: 't1', usedAt: null }] },
      });
      prisma.ticket.updateMany.mockResolvedValue({ count: 0 });
      await expect(makeService(prisma).scan('code1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('returns the group summary without mutating for a partially used group', async () => {
      const prisma = makePrisma();
      const usedAt = new Date('2026-07-07T09:30:00Z');
      prisma.ticket.findUnique.mockResolvedValue({
        id: 't1',
        usedAt,
        orderItem: {
          ...orderItemContext,
          tickets: [
            { id: 't1', usedAt },
            { id: 't2', usedAt: null },
            { id: 't3', usedAt: null },
          ],
        },
      });

      const result = await makeService(prisma).scan('code1');

      expect(prisma.ticket.updateMany).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        status: 'group',
        groupTotal: 3,
        alreadyCheckedIn: 1,
        remaining: 2,
        scannedTicketUsedAt: usedAt.toISOString(),
      });
    });

    it('reports scannedTicketUsedAt as null when the scanned group ticket is unused', async () => {
      const prisma = makePrisma();
      prisma.ticket.findUnique.mockResolvedValue({
        id: 't1',
        usedAt: null,
        orderItem: {
          ...orderItemContext,
          tickets: [
            { id: 't1', usedAt: null },
            { id: 't2', usedAt: null },
          ],
        },
      });

      const result = await makeService(prisma).scan('code1');
      expect(result).toMatchObject({ status: 'group', remaining: 2, scannedTicketUsedAt: null });
    });

    it('throws 409 when every ticket in the group is used', async () => {
      const prisma = makePrisma();
      const usedAt = new Date();
      prisma.ticket.findUnique.mockResolvedValue({
        id: 't1',
        usedAt,
        orderItem: {
          ...orderItemContext,
          tickets: [
            { id: 't1', usedAt },
            { id: 't2', usedAt },
            { id: 't3', usedAt },
          ],
        },
      });
      await expect(makeService(prisma).scan('code1')).rejects.toThrow(
        'All 3 tickets in this group were already checked in',
      );
    });
  });

  describe('confirmGroup', () => {
    it('throws 404 for an unknown code', async () => {
      const prisma = makePrisma();
      prisma.ticket.findUnique.mockResolvedValue(null);
      await expect(makeService(prisma).confirmGroup('nope', 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('checks in the scanned ticket first, then siblings, up to count', async () => {
      const prisma = makePrisma();
      prisma.ticket.findUnique.mockResolvedValue({
        id: 't2',
        usedAt: null,
        orderItemId: 'oi1',
        orderItem: orderItemContext,
      });
      prisma.ticket.findMany.mockResolvedValue([{ id: 't1' }, { id: 't2' }, { id: 't3' }]);
      prisma.ticket.updateMany.mockResolvedValue({ count: 2 });
      prisma.ticket.count
        .mockResolvedValueOnce(3) // groupTotal
        .mockResolvedValueOnce(1); // still unused

      const result = await makeService(prisma).confirmGroup('code2', 2);

      expect(prisma.ticket.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['t2', 't1'] }, usedAt: null },
        }),
      );
      expect(result).toMatchObject({
        status: 'checkedIn',
        checkedIn: 2,
        groupTotal: 3,
        alreadyCheckedIn: 2,
        remaining: 1,
      });
    });

    it('throws 409 when count exceeds the remaining tickets', async () => {
      const prisma = makePrisma();
      prisma.ticket.findUnique.mockResolvedValue({
        id: 't1',
        usedAt: null,
        orderItemId: 'oi1',
        orderItem: orderItemContext,
      });
      prisma.ticket.findMany.mockResolvedValue([{ id: 't1' }]);
      await expect(makeService(prisma).confirmGroup('code1', 2)).rejects.toThrow(
        'Only 1 ticket(s) remaining in this group',
      );
      expect(prisma.ticket.updateMany).not.toHaveBeenCalled();
    });

    it('throws 409 when a concurrent scanner claims some rows first', async () => {
      const prisma = makePrisma();
      prisma.ticket.findUnique.mockResolvedValue({
        id: 't1',
        usedAt: null,
        orderItemId: 'oi1',
        orderItem: orderItemContext,
      });
      prisma.ticket.findMany.mockResolvedValue([{ id: 't1' }, { id: 't2' }]);
      prisma.ticket.updateMany.mockResolvedValue({ count: 1 });
      await expect(makeService(prisma).confirmGroup('code1', 2)).rejects.toThrow(
        'Tickets were checked in concurrently — please rescan',
      );
    });
  });
});
