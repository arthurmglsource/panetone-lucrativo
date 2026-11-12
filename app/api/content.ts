import fs from 'node:fs';
import { getSessionFromHeaders, resolveAppPaths } from '../server/authCore.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const isDev = process.env.NODE_ENV !== 'production';
  const session = getSessionFromHeaders(req.headers, isDev);
  if (!session) {
    return res.status(401).json({ error: 'Autenticação necessária para aceder aos conteúdos do produto.' });
  }

  const baseDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const { dataPath } = resolveAppPaths(baseDir);
  if (!fs.existsSync(dataPath)) {
    return res.status(500).json({ error: 'Conteúdo protegido ainda não sincronizado.' });
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).send(fs.readFileSync(dataPath, 'utf-8'));
}
