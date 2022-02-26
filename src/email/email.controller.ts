import {
  Controller, Get, Param, Header,
} from '@nestjs/common';
import { ApiTags, ApiAcceptedResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { TemplateService } from '../util/template/template.service';
import { Templates } from '../templates/templates.enum';

@Controller('email')
export class EmailController {
  constructor(private readonly templateService: TemplateService) {}

  @ApiTags('email')
  @ApiOperation({ summary: 'Used for debugging. Renders a pug template as HTML' })
  @ApiParam({ name: 'templateName', type: String, description: 'The name of the template to show' })
  @ApiAcceptedResponse({ description: 'The Compiled HTML', type: String })
  @Header('content-type', 'text/html')
  @Get(':templateName')
  renderTemplate(@Param('templateName') templateName: Templates): string {
    return this.templateService.renderTemplate(templateName);
  }
}
