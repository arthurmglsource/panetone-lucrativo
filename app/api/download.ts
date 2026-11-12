import fs from 'node:fs';
import path from 'node:path';
import { getMimeType, getSessionFromHeaders, resolveAppPaths } from '../server/authCore.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const isDev = process.env.NODE_ENV !== 'production';
  const session = getSessionFromHeaders(req.headers, isDev);
  if (!session) {
    return res.status(401).json({ error: 'Acesso negado. Inicie sessão para descarregar os materiais.' });
  }

  const rawFile = String((req.query && req.query.file) || '');
  const safeName = path.basename(rawFile);
  if (!safeName || safeName !== rawFile || safeName.includes('..')) {
    return res.status(400).json({ error: 'Ficheiro inválido.' });
  }

  const baseDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const { downloadsDir } = resolveAppPaths(baseDir);
  const fullPath = path.join(downloadsDir, safeName);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Material não encontrado.' });
  }

  res.setHeader('Content-Type', getMimeType(safeName));
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).send(fs.readFileSync(fullPath));
}
