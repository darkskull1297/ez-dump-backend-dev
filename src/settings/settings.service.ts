import { Injectable } from '@nestjs/common';
import { SettingsRepo } from './settings.repository';
import { Settings } from './settings.model';
import { SettingsDTO } from './dto/setting.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly settingsRepo: SettingsRepo) {}

  async getSettings(): Promise<Settings[]> {
    return this.settingsRepo.getSettings();
  }

  async createSetting(data: SettingsDTO): Promise<Settings> {
    return this.settingsRepo.createSetting(data);
  }

  async updateSetting(settingId: string, data: SettingsDTO): Promise<Settings> {
    return this.settingsRepo.updateSetting(settingId, data);
  }

  async deleteSetting(settingId: string): Promise<boolean> {
    return this.settingsRepo.deleteSetting(settingId);
  }
}
