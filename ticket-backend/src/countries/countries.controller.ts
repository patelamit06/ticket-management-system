import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CountriesService, CountryDto } from './countries.service';

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get('browse')
  @ApiOperation({ summary: 'List countries for browse/locale (ISO codes)' })
  @ApiResponse({ status: 200, description: 'List of { code, label } for locale selector' })
  getBrowseCountries(): Promise<CountryDto[]> {
    return this.countriesService.getBrowseCountries();
  }

  @Get()
  @ApiOperation({ summary: 'List supported countries (phone dial codes for signup)' })
  @ApiResponse({ status: 200, description: 'List of { code, label } for dropdown' })
  getCountries(): Promise<CountryDto[]> {
    return this.countriesService.getCountries();
  }
}
