import type { CatalogConfig } from '../types/content';
import { formatEur } from './scaling';

export function buildCatalogWhatsappText(config: CatalogConfig): string {
  const lines = [
    `🎄 *${config.brandName || 'Menu de Natal — Panetones'}*`,
    config.tagline ? `_${config.tagline}_` : '',
    '',
    '*Opções Disponíveis por Encomenda:*',
  ];

  for (const p of config.products) {
    lines.push(`• *${p.name}* (${p.weightOrSize}) — *${formatEur(p.priceEur)}*`);
    if (p.description) lines.push(`  ${p.description}`);
    if (p.allergens) lines.push(`  _Alergénios: ${p.allergens}_`);
  }

  lines.push('');
  lines.push(`📍 *Entregas / Levantamento:* ${config.cityOrPickupZone}`);
  lines.push(`💳 *Reserva:* ${config.depositRule} (${config.mbWayPhone})`);
  if (config.orderDeadline) lines.push(`⏰ *Prazo:* ${config.orderDeadline}`);
  lines.push('');
  lines.push('Responda com o número/nome da opção para reservar a sua fornada!');
  return lines.filter((l) => l !== undefined).join('\n');
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(/\s+/);
  let line = '';
  let curY = y;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = words[i];
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, curY);
    curY += lineHeight;
  }
  return curY;
}

export async function exportCatalogAsPng(config: CatalogConfig): Promise<void> {
  const width = 1080;
  const height = Math.max(1380, 560 + config.products.length * 225);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background gradient wine -> burgundy
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#4a0d16');
  grad.addColorStop(1, '#27070d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Outer gold frame
  ctx.strokeStyle = '#e5a93b';
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  // Header brand logo if loaded cleanly
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('logo'));
      img.src = '/icons/logo-brand.png';
    });
    const ratio = img.width / img.height || 1.4;
    const drawH = 120;
    const drawW = drawH * ratio;
    ctx.drawImage(img, (width - drawW) / 2, 68, drawW, drawH);
  } catch {
    // Continue gracefully without image if unavailable
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd778';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CATÁLOGO OFICIAL DE NATAL · POR ENCOMENDA', width / 2, 224);

  ctx.fillStyle = '#fff5e6';
  ctx.font = '700 48px "Playfair Display", Georgia, serif';
  let y = wrapCanvasText(ctx, config.brandName || 'Panetones de Natal', width / 2, 282, width - 160, 56);

  ctx.fillStyle = '#f4dec0';
  ctx.font = '500 23px "Plus Jakarta Sans", sans-serif';
  y = wrapCanvasText(ctx, config.tagline || '', width / 2, y + 6, width - 190, 32);

  y += 28;
  for (const p of config.products) {
    // Cream card
    ctx.fillStyle = '#fffcf7';
    ctx.beginPath();
    ctx.roundRect(76, y, width - 152, 192, 20);
    ctx.fill();

    ctx.strokeStyle = '#e5a93b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Left text
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7b1928';
    ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${p.tier.toUpperCase()} · ${p.weightOrSize}`, 108, y + 40);

    ctx.fillStyle = '#27070d';
    ctx.font = '700 30px "Playfair Display", Georgia, serif';
    ctx.fillText(p.name, 108, y + 80);

    ctx.fillStyle = '#4a3538';
    ctx.font = '500 19px "Plus Jakarta Sans", sans-serif';
    wrapCanvasText(ctx, p.description, 108, y + 114, 610, 26);

    ctx.fillStyle = '#6f5155';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Alergénios: ${p.allergens}`, 108, y + 172);

    // Price badge
    ctx.fillStyle = '#e5a93b';
    ctx.beginPath();
    ctx.roundRect(width - 285, y + 48, 178, 92, 16);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#27070d';
    ctx.font = '800 34px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(formatEur(p.priceEur), width - 196, y + 106);

    y += 214;
  }

  // Footer info band
  ctx.fillStyle = 'rgba(229, 169, 59, 0.14)';
  ctx.beginPath();
  ctx.roundRect(76, y + 10, width - 152, 152, 18);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd778';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${config.depositRule} · MB WAY: ${config.mbWayPhone}`, width / 2, y + 58);

  ctx.fillStyle = '#fff5e6';
  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(config.cityOrPickupZone, width / 2, y + 96);
  ctx.fillStyle = '#f4dec0';
  ctx.fillText(config.orderDeadline, width / 2, y + 132);

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), 'image/png'));
  if (!blob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'menu-natal-panetones.png';
  a.click();
  URL.revokeObjectURL(a.href);
}
