import {
  Injectable,
  Logger,
  OnModuleInit,
  HttpException,
  Inject,
} from '@nestjs/common';
import pug from 'pug';
import { join } from 'path';
import fs from 'fs';
import { ConfigType } from '@nestjs/config';
import templateConfig from '../../config/template.config';
import { Templates } from '../../templates/templates.enum';

@Injectable()
export class TemplateService implements OnModuleInit {
  private readonly logger = new Logger('TemplateService', true);

  private compiledTemplates: Record<Templates, pug.compileTemplate> = {} as any;

  constructor(
    @Inject(templateConfig.KEY) private readonly templateConf: ConfigType<typeof templateConfig>,
  ) {}

  async onModuleInit(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.log(
        `Searching for pug templates in route '${join(
          __dirname,
          this.templateConf.folderDir,
        )}'...`,
      );
      fs.readdir(
        join(__dirname, this.templateConf.folderDir),
        (err, files) => {
          if (err) {
            this.logger.error('Unable to read templates directory', err.stack);
            return reject();
          }
          const pugFiles = files.filter(file => file.endsWith('.pug'));
          const count = pugFiles.length;
          this.logger.log(`Found ${count} template(s)`);

          if (count > 0) {
            this.logger.log('Compiling templates...');
            pugFiles.forEach(file => {
              try {
                this.compiledTemplates[
                  file.substr(0, file.length - 4)
                ] = pug.compileFile(
                  join(
                    __dirname,
                    this.templateConf.folderDir,
                    file,
                  ),
                );
                this.logger.log(`Compiled ${file}`);
              } catch (e) {
                this.logger.error(`Error on compiling ${file}`, e.toString());
              }
            });
          }
          this.logger.log('Completed Template Compilation');
          return resolve();
        },
      );
    });
  }

  templateToHTML(template: Templates, props: any): string {
    return this.compiledTemplates[template](props);
  }

  renderTemplate(template: Templates): string {
    if (!this.compiledTemplates[template]) {
      throw new HttpException('Template not found', 404);
    }
    return pug.renderFile(
      join(
        __dirname,
        this.templateConf.folderDir,
        `${template}.pug`,
      ),
    );
  }
}
