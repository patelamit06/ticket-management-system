import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CountryDto {
  code: string;
  label: string;
}

@Injectable()
export class CountriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** List active countries for signup (phone dial code dropdown), sorted by sortOrder then name. */
  async getCountries(): Promise<CountryDto[]> {
    const rows = await this.prisma.country.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((r) => ({
      code: r.dialCode,
      label: `${r.name} ${r.dialCode}`,
    }));
  }

  /** List countries for browse/locale (ISO code + label). Only rows with isoCode set. */
  async getBrowseCountries(): Promise<CountryDto[]> {
    const rows = await this.prisma.country.findMany({
      where: { isActive: true, isoCode: { not: null } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((r) => ({
      code: r.isoCode!,
      label: r.name,
    }));
  }
}
