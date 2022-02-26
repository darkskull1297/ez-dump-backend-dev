import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { exists, readFile } from 'fs';

@Injectable()
export class AppService {
  private version: string;

  async getVersion(): Promise<string> {
    if (this.version) {
      return this.version;
    }
    this.version = await this.getVersionFromPackageJson();
    return this.version;
  }

  private async getVersionFromPackageJson(): Promise<string> {
    return new Promise((resolve, reject) => {
      const pathToPackageJson = join(__dirname, '../../package.json');
      exists(pathToPackageJson, fileExists => {
        if (fileExists) {
          readFile(pathToPackageJson, 'utf8', (err, data) => {
            if (err) {
              reject(err);
            }
            const packageJson = JSON.parse(data);
            resolve(`v${packageJson.version}`);
          });
        } else {
          resolve('Version Not Found');
        }
      });
    });
  }
}
