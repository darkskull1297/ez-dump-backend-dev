import { registerAs } from "@nestjs/config";

export default registerAs('template', () => ({
  folderDir: process.env.TEMPLATE_FOLDER_DIR || '../../../templates',
}));
