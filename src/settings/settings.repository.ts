import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseRepository } from '../common/base.repository';
import { Settings } from './settings.model';
import { SettingsDTO } from './dto/setting.dto';

@Injectable()
export class SettingsRepo extends BaseRepository<Settings>(Settings) {
  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepo: Repository<Settings>,
  ) {
    super(settingsRepo);
  }

  async getSettings(): Promise<Settings[]> {
    return this.settingsRepo.createQueryBuilder('settings').getMany();
  }

  async createSetting(data: SettingsDTO): Promise<Settings> {
    const setting = new Settings();
    setting.setting = data.setting;
    setting.value = data.value;
    return this.settingsRepo.save(setting);
  }

  async updateSetting(settingId: string, data: SettingsDTO): Promise<Settings> {
    const setting = await this.settingsRepo.findOne({ id: settingId });
    setting.setting = data.setting;
    setting.value = data.value;

    await this.settingsRepo.save(setting);
    return this.settingsRepo.findOne({ id: settingId });
  }

  async deleteSetting(settingId: string): Promise<boolean> {
    const setting = await this.settingsRepo.findOne({ id: settingId });

    await this.settingsRepo.remove(setting);

    return true;
  }
}
