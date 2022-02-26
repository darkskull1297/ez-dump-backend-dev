import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiAcceptedResponse,
} from '@nestjs/swagger';
import {
  Controller,
  UseGuards,
  Post,
  Body,
  Delete,
  Param,
  Get,
  Put,
} from '@nestjs/common';
import { UserRole } from '../../../user/user.model';
import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { SettingsService } from '../../settings.service';
import { SettingsDTO } from '../../dto/setting.dto';

@ApiTags('settings')
@UseGuards(AuthGuard(), HasRole(UserRole.ADMIN))
@ApiBearerAuth('authorization')
@ApiForbiddenResponse({
  description: 'Invalid Role',
  type: FailureStringResponse,
})
@Controller('admin/settings')
export class SettingsAdminController {
  constructor(private readonly settingsService: SettingsService) {}

  @ApiOperation({ summary: 'Get Settings' })
  @ApiAcceptedResponse({
    description: 'Get Settings',
    type: SettingsDTO,
  })
  @Get()
  async getSettings(): Promise<SettingsDTO[]> {
    const settings = await this.settingsService.getSettings();
    return settings.map(setting => SettingsDTO.fromModel(setting));
  }

  @ApiOperation({ summary: 'Add Setting' })
  @ApiAcceptedResponse({
    description: 'Create Setting',
    type: SettingsDTO,
  })
  @Post()
  async createSetting(@Body() data: SettingsDTO): Promise<SettingsDTO> {
    console.log('SETTING', data);
    const setting = await this.settingsService.createSetting(data);
    return SettingsDTO.fromModel(setting);
  }

  @ApiOperation({ summary: 'Update Setting' })
  @ApiAcceptedResponse({
    description: 'Update Setting',
    type: SettingsDTO,
  })
  @Put('/:id')
  async updateSetting(
    @Body() data: SettingsDTO,
      @Param('id') id: string,
  ): Promise<SettingsDTO> {
    const setting = await this.settingsService.updateSetting(id, data);
    return SettingsDTO.fromModel(setting);
  }

  @ApiOperation({ summary: 'Delete Setting' })
  @ApiAcceptedResponse({
    description: 'Delete Setting',
    type: SettingsDTO,
  })
  @Delete('/:id')
  async deleteSetting(@Param('id') id: string): Promise<boolean> {
    const response = await this.settingsService.deleteSetting(id);
    return response;
  }
}
