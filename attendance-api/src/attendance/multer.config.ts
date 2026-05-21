import { diskStorage } from 'multer';
import { extname } from 'path';

// This is only temporary , further implementation would be better if we use s3 directly or other blob storage
export const multerConfig = (prefix: string) => ({
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${prefix}-${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
});
