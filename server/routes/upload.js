import express from 'express';
import multer from 'multer';
import crypto from 'crypto';

// Rota de upload de imagens. Restricoes: apenas MIME de imagem, max 5MB,
// extensao gerada pelo servidor (nao usa a original), so autenticados.
// Recebe UPLOADS_DIR e authenticateToken via factory. Monta em /api/upload.
export function createUploadRouter({ authenticateToken, uploadsDir }) {
  const router = express.Router();

  const ALLOWED_UPLOAD_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
  const MIME_TO_EXT = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
      const ext = MIME_TO_EXT[file.mimetype] || '.bin';
      cb(null, 'anexo-' + uniqueSuffix + ext);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_UPLOAD_MIMES.has(file.mimetype)) {
        return cb(new Error('Tipo de arquivo nao permitido'));
      }
      cb(null, true);
    },
  });

  // POST /api/upload
  router.post('/', authenticateToken, (req, res) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        const msg =
          err.message === 'Tipo de arquivo nao permitido'
            ? 'Apenas imagens PNG, JPG, WebP ou GIF sao permitidas.'
            : err.code === 'LIMIT_FILE_SIZE'
              ? 'Arquivo excede 5MB.'
              : 'Falha no upload.';
        return res.status(400).json({ error: msg });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl });
    });
  });

  return router;
}
