#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(APP_ROOT, '..');
const SRC_PRODUCT = path.join(REPO_ROOT, 'panetones-que-rendem');
const DIST_PRODUCT = path.join(REPO_ROOT, 'produto-digital');
const PROTECTED_DATA_DIR = path.join(APP_ROOT, 'protected-data');
const PROTECTED_DL_DIR = path.join(APP_ROOT, 'protected-downloads');

fs.mkdirSync(PROTECTED_DATA_DIR, { recursive: true });
fs.mkdirSync(PROTECTED_DL_DIR, { recursive: true });

if (!fs.existsSync(SRC_PRODUCT) || !fs.existsSync(DIST_PRODUCT)) {
  const existingData = path.join(PROTECTED_DATA_DIR, 'content.json');
  if (fs.existsSync(existingData)) {
    console.log('[sync-content] Diretórios fonte externos ausentes neste ambiente; a reutilizar protected-data/content.json pré-sincronizado.');
    process.exit(0);
  }
  console.error('[sync-content] Erro: pastas panetones-que-rendem / produto-digital não encontradas e protected-data/content.json inexistente.');
  process.exit(1);
}

function cleanMd(text) {
  return text
    .replace(/\\([*_`])/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function getCategoryMeta(id) {
  if (id <= 4) {
    return {
      category: 'massas-base',
      categoryLabel: 'Bloco A · Massas Base',
      image: '/media/panetone-classico.jpg',
      packageType: '500g',
      isFilled: false,
      defaultPrice: 11.5,
    };
  }
  if (id <= 10) {
    return {
      category: 'classicos-frutados',
      categoryLabel: 'Bloco B · Clássicos & Frutados',
      image: '/media/panetone-classico.jpg',
      packageType: '500g',
      isFilled: false,
      defaultPrice: 12.0,
    };
  }
  if (id <= 18) {
    return {
      category: 'recheados-premium',
      categoryLabel: 'Bloco C · Chocotones & Recheados',
      image: '/media/chocotone-recheado.jpg',
      packageType: '500g',
      isFilled: true,
      defaultPrice: 15.0,
    };
  }
  if (id <= 24) {
    return {
      category: 'mini-panetones',
      categoryLabel: 'Bloco D · Mini Panetones',
      image: '/media/mini-e-copo.jpg',
      packageType: 'mini',
      isFilled: id === 21 || id === 22 || id === 23,
      defaultPrice: 4.5,
    };
  }
  return {
    category: 'panetone-no-copo',
    categoryLabel: 'Bloco E · Panetone no Copo',
    image: '/media/mini-e-copo.jpg',
    packageType: 'copo',
    isFilled: true,
    defaultPrice: 5.0,
  };
}

function normalizeIngredientKey(name) {
  const lower = name.toLowerCase();
  if (lower.includes('farinha de trigo') || lower.includes('farinha forte')) return 'farinha-forca';
  if (lower.includes('manteiga sem sal')) return 'manteiga-sem-sal';
  if (lower.includes('açúcar') || lower.includes('acucar')) return 'acucar-fino';
  if (lower.includes('gema') || lower.includes('ovos')) return 'gemas-ovos';
  if (lower.includes('leite condensado')) return 'leite-condensado';
  if (lower.includes('natas')) return 'natas-35';
  if (lower.includes('leite em pó') || lower.includes('leite em po')) return 'leite-em-po';
  if (lower.includes('chocolate branco')) return 'chocolate-branco';
  if (lower.includes('chocolate negro') || lower.includes('chocolate de leite') || lower.includes('chocolate picado')) return 'chocolate-pastelaria';
  if (lower.includes('pepitas')) return 'pepitas-chocolate';
  if (lower.includes('cacau em pó')) return 'cacau-po';
  if (lower.includes('creme de avelã') || lower.includes('creme de avela')) return 'creme-avela';
  if (lower.includes('doce de leite')) return 'doce-de-leite';
  if (lower.includes('maracujá') || lower.includes('maracuja')) return 'polpa-maracuja';
  if (lower.includes('fermento de padeiro') || lower.includes('fermento fresco')) return 'fermento-padeiro';
  if (lower.includes('leite meio-gordo') || lower.includes('leite frio')) return 'leite-meio-gordo';
  if (lower.includes('mel')) return 'mel';
  if (lower.includes('frutas cristalizadas')) return 'frutas-cristalizadas';
  if (lower.includes('passas') || lower.includes('sultanas')) return 'passas-sultanas';
  if (lower.includes('flor de sal')) return 'flor-de-sal';
  if (lower.includes('sal')) return 'sal-fino';
  if (lower.includes('baunilha')) return 'extrato-baunilha';
  if (lower.includes('avelã') || lower.includes('avela')) return 'avelas';
  if (lower.includes('noz')) return 'nozes';
  if (lower.includes('amêndoa') || lower.includes('amendoa')) return 'amendoas';
  return lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
}

function detectShoppingCategory(group, name) {
  const txt = `${group} ${name}`.toLowerCase();
  if (txt.includes('forma') || txt.includes('copo') || txt.includes('tampa') || txt.includes('embalag') || txt.includes('saco')) {
    return 'embalagem';
  }
  if (
    txt.includes('recheio') ||
    txt.includes('cobertura') ||
    txt.includes('ganache') ||
    txt.includes('creme') ||
    txt.includes('mousse') ||
    txt.includes('compota') ||
    txt.includes('leite condensado') ||
    txt.includes('natas') ||
    txt.includes('toffee') ||
    txt.includes('doce de leite') ||
    txt.includes('maracuj')
  ) {
    return 'recheio';
  }
  return 'massa';
}

function parseIngredientLine(rawLine, group, idx) {
  const clean = cleanMd(rawLine.replace(/^[-*]\s+/, ''));
  const baseMatch = clean.match(/Receita\s+(0?[13])\b/i);
  const referencesBaseRecipe = baseMatch ? Number(baseMatch[1]) : undefined;

  // Extract leading quantity + unit e.g., "500 g de farinha..." or "180 ml de leite..." or "2 ovos..."
  const m = clean.match(/^(?:~)?(\d+(?:[.,]\d+)?)\s*(?:a\s*\d+(?:[.,]\d+)?)?\s*(kg|g|ml|l|L|ovos?|unidades?|unid\.?|latas?|colheres?(?:\s+de\s+(?:sopa|chá))?|gemas?|paquetes?|copos?)\b(.*)$/i);
  let quantity = null;
  let unit = '';
  let name = clean;

  if (m) {
    quantity = Number(m[1].replace(',', '.'));
    unit = m[2];
    let rest = (m[3] || '').trim();
    rest = rest.replace(/^\([^)]+\)\s*/, '').replace(/^de\s+/i, '').trim();
    if (rest) {
      name = rest.charAt(0).toUpperCase() + rest.slice(1);
    }
  }

  return {
    id: `ing-${idx}`,
    raw: clean,
    group,
    name: name || clean,
    normalizedKey: referencesBaseRecipe ? `massa-base-r0${referencesBaseRecipe}` : normalizeIngredientKey(clean),
    shoppingCategory: detectShoppingCategory(group, clean),
    quantity,
    unit,
    referencesBaseRecipe,
  };
}

function extractSuggestedMinutes(text) {
  const found = [];
  const hmRe = /(\d+(?:[.,]\d+)?)\s*(?:h|horas?)(?:\s*(\d{1,2}))?\b/gi;
  let m;
  while ((m = hmRe.exec(text)) !== null) {
    const hrs = Number(m[1].replace(',', '.'));
    const mins = m[2] ? Number(m[2]) : 0;
    const total = Math.round(hrs * 60 + mins);
    if (total > 0 && total <= 720 && !found.includes(total)) found.push(total);
  }
  const minRe = /(\d+)\s*(?:a|–|-)?\s*(?:\d+\s*)?min\b/gi;
  while ((m = minRe.exec(text)) !== null) {
    const val = Number(m[1]);
    if (val > 0 && val <= 360 && !found.includes(val)) found.push(val);
  }
  return found.slice(0, 3);
}

function parseRecipe(filePath) {
  const md = fs.readFileSync(filePath, 'utf-8');
  const lines = md.split(/\r?\n/);

  const h1 = lines.find((l) => l.startsWith('# ')) || '# Receita';
  const idMatch = path.basename(filePath).match(/^(\d{2})-/);
  const id = idMatch ? Number(idMatch[1]) : 0;
  const title = cleanMd(h1.replace(/^#\s*Receita\s+\d+\s*[—-]\s*/i, ''));
  const shortTitle = title.replace(/\s*\([^)]+\)\s*/g, '').trim();
  const meta = getCategoryMeta(id);

  const summaryLine = lines.find((l) => l.trim().startsWith('>')) || '';
  const blockSubtitle = cleanMd(summaryLine.replace(/^>\s*/, '').replace(/^\*\*[^:]+:\*\*\s*/i, ''));

  const sections = {};
  let currentSec = 'root';
  for (const line of lines) {
    const hm = line.match(/^##\s+(.+)$/);
    if (hm) {
      currentSec = hm[1].trim();
      sections[currentSec] = [];
    } else {
      sections[currentSec] = sections[currentSec] || [];
      sections[currentSec].push(line);
    }
  }

  const getKv = (secLines, keyPart) => {
    for (const l of secLines || []) {
      const clean = cleanMd(l.replace(/^[-*]\s+/, ''));
      const m = clean.match(/^([^:]+):\s*(.+)$/);
      if (m && m[1].toLowerCase().includes(keyPart.toLowerCase())) {
        return m[2].trim();
      }
    }
    return '';
  };

  const ficha = sections['Ficha Técnica Resumida'] || [];
  const yieldText = getKv(ficha, 'Rendimento') || '2 unidades de 500 g';
  const difficulty = getKv(ficha, 'Dificuldade') || 'Média';
  const activeTime = getKv(ficha, 'Tempo ativo') || '~45 min';
  const totalTime = getKv(ficha, 'Tempo total') || '~5 h';
  const ovenTemp = getKv(ficha, 'Temperatura') || '165 °C';

  let baseYieldUnits = 2;
  const ym = yieldText.match(/(\d+)/);
  if (ym) baseYieldUnits = Number(ym[1]);
  const unitTypeLabel =
    meta.packageType === 'copo' ? 'copos (220 ml)' : meta.packageType === 'mini' ? 'minis (~120–170 g)' : 'unid. (500 g+)';

  const utensils = (sections['Utensílios Necessários'] || [])
    .filter((l) => l.trim().startsWith('-') || l.trim().startsWith('*'))
    .map((l) => cleanMd(l.replace(/^[-*]\s+/, '')));

  const ingLines = sections['Ingredientes (Exatos em Gramas e Mililitros)'] || [];
  const ingredients = [];
  let currentGroup = 'Ingredientes Base';
  let baseMassRecipeId;
  for (const l of ingLines) {
    const s = l.trim();
    if (!s) continue;
    if (s.startsWith('**') && s.endsWith(':**')) {
      currentGroup = cleanMd(s).replace(/:$/, '');
    } else if (s.startsWith('**') && s.includes(':**')) {
      currentGroup = cleanMd(s.split(':**')[0]);
    } else if (s.startsWith('-') || s.startsWith('*')) {
      const parsed = parseIngredientLine(s, currentGroup, ingredients.length + 1);
      if (parsed.referencesBaseRecipe && !baseMassRecipeId) {
        baseMassRecipeId = parsed.referencesBaseRecipe;
      }
      ingredients.push(parsed);
    }
  }

  const prepLines = sections['Preparação Numerada Passo a Passo'] || [];
  const steps = [];
  let buf = '';
  const flushStep = () => {
    if (!buf.trim()) return;
    const stepMatch = buf.trim().match(/^(\d+)\.\s*(.+)$/);
    if (stepMatch) {
      const num = Number(stepMatch[1]);
      const fullText = cleanMd(stepMatch[2]);
      const colonIdx = fullText.indexOf(':');
      const stepTitle = colonIdx > 0 && colonIdx < 65 ? fullText.slice(0, colonIdx).trim() : `Passo ${num}`;
      const bodyText = colonIdx > 0 && colonIdx < 65 ? fullText.slice(colonIdx + 1).trim() : fullText;
      steps.push({
        number: num,
        title: stepTitle,
        text: bodyText,
        suggestedMinutes: extractSuggestedMinutes(fullText),
      });
    }
    buf = '';
  };

  for (const l of prepLines) {
    const s = l.trim();
    if (!s) {
      flushStep();
      continue;
    }
    if (/^\d+\.\s+/.test(s)) {
      flushStep();
      buf = s;
    } else if (buf) {
      buf += ' ' + s;
    }
  }
  flushStep();

  const consSec =
    sections['Recheios, Conservação e Alergénios'] ||
    sections['Conservação, Segurança e Alergénios'] ||
    [];
  const errSec = sections['Erros Comuns e Validação Física'] || [];

  return {
    id,
    slug: path.basename(filePath, '.md'),
    title,
    shortTitle,
    category: meta.category,
    categoryLabel: meta.categoryLabel,
    blockSubtitle,
    image: meta.image,
    yieldText,
    baseYieldUnits,
    unitTypeLabel,
    packageType: meta.packageType,
    isFilled: meta.isFilled,
    difficulty,
    activeTime,
    totalTime,
    ovenTemp,
    utensils,
    ingredients,
    steps,
    conservation: {
      application: getKv(consSec, 'Aplicação') || getKv(consSec, 'Conservação Obrigatória') || blockSubtitle,
      shelfLife: getKv(consSec, 'Conservação') || getKv(consSec, 'Validade') || 'Consultar Nota de Validação.',
      allergens: getKv(consSec, 'Alergénios') || 'Contém GLÚTEN (trigo), OVOS e LEITE.',
      safetyNote: getKv(consSec, 'Nota de Segurança') || getKv(consSec, 'Nota') || undefined,
    },
    errorsAndTesting: {
      commonErrors: getKv(errSec, 'Erros comuns') || getKv(errSec, 'Erros mais frequentes') || '',
      testingNotice: getKv(errSec, 'Aviso de teste') || 'Efetue sempre teste prévio de cozedura e textura na sua cozinha.',
    },
    defaultReferencePriceEur: meta.defaultPrice,
    baseMassRecipeId,
  };
}

function parseModules() {
  const modDir = path.join(SRC_PRODUCT, '01-ebook-principal');
  const modFiles = fs
    .readdirSync(modDir)
    .filter((f) => /^modulo-\d{2}-.+\.md$/.test(f))
    .sort();

  return modFiles.map((fname, idx) => {
    const md = fs.readFileSync(path.join(modDir, fname), 'utf-8');
    const lines = md.split(/\r?\n/);
    const h1 = lines.find((l) => l.startsWith('# ')) || `# Módulo ${idx + 1}`;
    const title = cleanMd(h1.replace(/^#\s*/, ''));
    const objLine = lines.find((l) => l.includes('Objetivo do módulo:')) || '';
    const objective = cleanMd(objLine.replace(/^>\s*/, '').replace(/^\*\*Objetivo do módulo:\*\*\s*/i, ''));

    const sections = [];
    let curHeading = 'Visão Geral';
    let curBuf = [];
    let inActionChecklist = false;
    const actionChecklist = [];

    for (const line of lines) {
      if (line.startsWith('# ')) continue;
      if (line.startsWith('## ')) {
        if (curBuf.length) {
          const text = curBuf.join('\n').trim();
          if (text && curHeading !== 'Visão Geral') {
            sections.push({ heading: curHeading, bodyMarkdown: text });
          }
        }
        curHeading = cleanMd(line.replace(/^##\s+/, ''));
        inActionChecklist = curHeading.toLowerCase().includes('resumo de ação');
        curBuf = [];
      } else {
        if (inActionChecklist) {
          const cm = line.trim().match(/^[-*]\s+(?:\[ \]\s*)?(.+)$/);
          if (cm) actionChecklist.push(cleanMd(cm[1]));
        } else {
          curBuf.push(line);
        }
      }
    }
    if (curBuf.length && !inActionChecklist) {
      const text = curBuf.join('\n').trim();
      if (text) sections.push({ heading: curHeading, bodyMarkdown: text });
    }

    return {
      id: `mod-0${idx + 1}`,
      number: idx + 1,
      title,
      objective,
      actionChecklist,
      sections,
      rawMarkdown: md,
    };
  });
}

function parseSevenDaysAndChecklist() {
  const md = fs.readFileSync(path.join(SRC_PRODUCT, '01-ebook-principal', '07-primeiros-7-dias-e-checklist.md'), 'utf-8');
  const sevenDaysPlan = [];
  const startupChecklist = [];

  for (const line of md.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('| **Dia ')) {
      const cols = trimmed.split('|').map((c) => cleanMd(c)).filter(Boolean);
      if (cols.length >= 4) {
        sevenDaysPlan.push({
          day: cols[0],
          focus: cols[1],
          actions: cols[2],
          outcome: cols[3],
        });
      }
    }
    if (trimmed.startsWith('- [ ] ')) {
      startupChecklist.push(cleanMd(trimmed.replace(/^- \[ \]\s+/, '')));
    }
  }
  return { sevenDaysPlan, startupChecklist };
}

function parseFaq() {
  const md = fs.readFileSync(path.join(SRC_PRODUCT, '01-ebook-principal', '08-glossario-e-faq.md'), 'utf-8');
  const faqPart = md.split(/## Parte II/i)[1] || '';
  const items = [];
  let q = '';
  let a = [];
  for (const line of faqPart.split(/\r?\n/)) {
    const hm = line.match(/^###\s+\d+\.\s+(.+)$/);
    if (hm) {
      if (q) items.push({ question: cleanMd(q), answer: cleanMd(a.join(' ')) });
      q = hm[1];
      a = [];
    } else if (line.trim() && !line.startsWith('---')) {
      a.push(line.trim());
    }
  }
  if (q) items.push({ question: cleanMd(q), answer: cleanMd(a.join(' ')) });
  return items;
}

function parseSuppliers() {
  const md = fs.readFileSync(path.join(SRC_PRODUCT, '06-bonus-guia-fornecedores', 'bonus-03-guia-fornecedores-portugal.md'), 'utf-8');
  const suppliers = [];
  let curCategory = 'Geral';

  for (const line of md.split(/\r?\n/)) {
    const h3 = line.match(/^###\s+Categoria\s+[A-Z]\s+[—-]\s+(.+)$/);
    if (h3) {
      curCategory = cleanMd(h3[1]);
      continue;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith('| **')) {
      const cols = trimmed.split('|').map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 5) {
        const urls = [];
        const urlMatches = cols[3].match(/https?:\/\/[^\s`)]+/g);
        if (urlMatches) urls.push(...urlMatches);
        suppliers.push({
          category: curCategory,
          name: cleanMd(cols[0]),
          accessType: cleanMd(cols[1]),
          products: cleanMd(cols[2]),
          urls,
          verifiedAt: cleanMd(cols[4]),
        });
      }
    }
  }
  return suppliers;
}

function parseWhatsappScripts() {
  const md = fs.readFileSync(path.join(SRC_PRODUCT, '02-kit-divulgacao', 'kit-divulgacao-natal-textos.md'), 'utf-8');
  const scripts = [];
  const lines = md.split(/\r?\n/);

  let category = 'WhatsApp';
  let currentTitle = '';
  let quoteBuf = [];

  const flush = () => {
    if (currentTitle && quoteBuf.length) {
      scripts.push({
        id: `wa-${scripts.length + 1}`,
        category,
        title: cleanMd(currentTitle),
        text: quoteBuf.join('\n').trim(),
      });
    }
    quoteBuf = [];
  };

  for (const line of lines) {
    const h2 = line.match(/^##\s+\d+\.\s+(.+)$/);
    if (h2) {
      flush();
      category = cleanMd(h2[1]);
      currentTitle = '';
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      flush();
      currentTitle = cleanMd(h3[1]);
      continue;
    }
    const bulletLabel = line.match(/^-\s+\*\*([^*]+):\*\*\s*$/);
    if (bulletLabel) {
      flush();
      currentTitle = cleanMd(bulletLabel[1]);
      continue;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) {
      const content = cleanMd(trimmed.replace(/^>\s*/, '').replace(/^"|"$/g, ''));
      if (content && !content.startsWith('Idioma:') && !content.startsWith('Copie,') && !content.startsWith('Dica de utilização:')) {
        quoteBuf.push(content);
      }
    } else if (quoteBuf.length && trimmed === '') {
      flush();
    }
  }
  flush();
  return scripts;
}

function parseReferenceBatches() {
  const md = fs.readFileSync(path.join(SRC_PRODUCT, '04-bonus-lista-compras', 'bonus-01-lista-compras-10-30-50.md'), 'utf-8');
  const tableRows = [];
  let sectionCat = 'massa';
  let inMainSection = false;

  for (const line of md.split(/\r?\n/)) {
    if (line.includes('## 1. Lista Escalável Principal')) inMainSection = true;
    if (line.includes('## 2.')) inMainSection = false;
    if (!inMainSection) continue;
    if (line.includes('### A.')) sectionCat = 'massa';
    if (line.includes('### B.')) sectionCat = 'recheio';
    if (line.includes('### C.') || line.includes('### D.')) sectionCat = 'embalagem';

    const t = line.trim();
    if (t.startsWith('| `[ ]`')) {
      const cols = t.split('|').map((c) => cleanMd(c)).filter(Boolean);
      if (cols.length >= 5) {
        tableRows.push({
          cat: sectionCat,
          name: cols[1],
          q10: cols[2],
          q30: cols[3],
          q50: cols[4],
        });
      }
    }
  }

  return [
    {
      batchSize: 10,
      label: 'Lote Inicial · 10 Unidades (Mix 3 Faixas)',
      composition: '4 Grandes (500 g) + 4 Minis (120 g) + 2 No Copo (220 ml)',
      items: tableRows.map((r) => ({ name: r.name, category: r.cat, quantityText: r.q10 })),
    },
    {
      batchSize: 30,
      label: 'Lote Fim de Semana · 30 Unidades (Módulo 06)',
      composition: '16 Grandes (8 Clássicos + 8 Recheados) + 8 Minis + 6 No Copo',
      items: tableRows.map((r) => ({ name: r.name, category: r.cat, quantityText: r.q30 })),
    },
    {
      batchSize: 50,
      label: 'Lote Alto Volume · 50 Unidades (Natal)',
      composition: '26 Grandes (12 Clássicos + 14 Recheados) + 14 Minis + 10 No Copo',
      items: tableRows.map((r) => ({ name: r.name, category: r.cat, quantityText: r.q50 })),
    },
  ];
}

function getWeekendSchedule() {
  return [
    { id: 'wk-1', day: 'Quinta', phase: 'preparacao', timeSlot: '20:00 – 20:20', title: 'Confirmar sinais MB WAY e fechar lotes', detail: 'Conferir o Caderno de Encomendas e gerar Lista de Compras.' },
    { id: 'wk-2', day: 'Sexta', phase: 'preparacao', timeSlot: '09:30 – 11:00', title: 'Compras & Higienização da bancada', detail: 'Comprar farinha de força, manteiga, ovos, natas e conferir embalagens.' },
    { id: 'wk-3', day: 'Sexta', phase: 'preparacao', timeSlot: '14:30 – 15:30', title: 'Pesar secos dos 4 lotes em kits', detail: 'Separar farinhas, açúcares, mel e sal em recipientes etiquetados.' },
    { id: 'wk-4', day: 'Sexta', phase: 'preparacao', timeSlot: '15:30 – 17:30', title: 'Cozinhar recheios, ganaches e hidratar frutas', detail: 'Preparar na véspera para atingir ponto firme no frio (<= 5 °C).' },
    { id: 'wk-5', day: 'Sábado', phase: 'fermentacao', timeSlot: '07:30 – 12:15', title: 'Amassaduras e 2.ª fermentação (Lotes 1 a 4)', detail: 'Escalonar 4 lotes de ~2,45 kg para respeitar a batedeira e o forno doméstico.' },
    { id: 'wk-6', day: 'Sábado', phase: 'cozedura', timeSlot: '12:30 – 17:00', title: 'Fornadas sequenciais (165 °C → 92–94 °C) e Tombamento', detail: 'Pendurar de cabeça para baixo 8–12 h durante a noite.' },
    { id: 'wk-7', day: 'Domingo', phase: 'embalamento', timeSlot: '08:30 – 12:15', title: 'Escavar, rechear, montar copos e etiquetar', detail: 'Aplicar rotulagem com alergénios em destaque e conferir valores em falta.' },
    { id: 'wk-8', day: 'Domingo', phase: 'embalamento', timeSlot: '14:30 – 18:30', title: 'Janela de levantamentos e rota de entregas', detail: 'Receber os restantes 50 % e marcar pedidos como Entregues.' },
  ];
}

function syncProtectedDownloads() {
  const catalog = [
    { id: 'dl-comece-aqui', src: '00-comece-aqui-guia-rapido.pdf', title: 'Guia Rápido — Comece Aqui (0–15 min)', description: 'Mapa inicial passo a passo e regras rápidas para começar hoje.', category: 'guias', format: 'PDF' },
    { id: 'dl-ebook-completo', src: 'ebooks/01-ebook-completo-panetones-que-rendem.pdf', title: 'E-book Integral Completo (99 págs.)', description: 'Índice navegável, 6 módulos do método, 7 dias, FAQ e todas as 30 receitas.', category: 'guias', format: 'PDF' },
    { id: 'dl-caderno-receitas', src: 'ebooks/02-caderno-30-fichas-receitas.pdf', title: 'Caderno de Bancada — 30 Fichas (62 págs.)', description: 'Versão otimizada para imprimir ou consultar junto ao forno.', category: 'guias', format: 'PDF' },
    { id: 'dl-bonus-01', src: 'bonus/bonus-01-lista-compras-10-30-50.pdf', title: 'Bónus 01 — Lista de Compras 10 / 30 / 50 Unid.', description: 'Listas escaláveis separadas por massa, recheios e embalagens.', category: 'bonus', format: 'PDF' },
    { id: 'dl-bonus-02', src: 'bonus/bonus-02-caderno-encomendas.pdf', title: 'Bónus 02 — Caderno de Encomendas (A4 Paisagem)', description: 'Folhas imprimíveis de gestão de encomendas e sinais MB WAY.', category: 'bonus', format: 'PDF' },
    { id: 'dl-bonus-03', src: 'bonus/bonus-03-guia-fornecedores-portugal.pdf', title: 'Bónus 03 — Guia de Fornecedores em Portugal', description: 'Lojas, cash & carry e fornecedores de embalagens com links ativos.', category: 'bonus', format: 'PDF' },
    { id: 'dl-guia-wa', src: 'materiais/guia-mensagens-whatsapp.pdf', title: 'Kit de Divulgação — Textos e Scripts WhatsApp', description: 'Estados de 7 dias, respostas a objeções e scripts de venda.', category: 'materiais', format: 'PDF' },
    { id: 'dl-caderno-op', src: 'materiais/caderno-operacional-custos-calendario-rotulagem.pdf', title: 'Caderno Operacional, Calendário & Rotulagem ASAE', description: 'Fórmulas de custos em €, calendário 2026 e regras legais UE 1169/2011.', category: 'materiais', format: 'PDF' },
    { id: 'dl-catalogo', src: 'materiais/catalogo-natal-personalizavel.pdf', title: 'Catálogo de Natal — Menu 3 Produtos (PDF A4)', description: 'Menu visual nas 3 faixas de preço do método.', category: 'materiais', format: 'PDF' },
    { id: 'dl-etiquetas', src: 'materiais/etiquetas-marca-propria-a4.pdf', title: 'Etiquetas Marca Própria + Contrarótulo (A4)', description: 'Tags De/Para, cintas, selos invioláveis e tabela nutricional/alergénios.', category: 'materiais', format: 'PDF' },
    { id: 'dl-kit-card-pdf', src: 'materiais/kit-divulgacao-natal/card-whatsapp-abertura.pdf', title: 'Cartão Abertura WhatsApp (PDF 9:16)', description: 'Cartão vetorial pronto a partilhar ou imprimir.', category: 'materiais', format: 'PDF' },
    { id: 'dl-kit-feed-pdf', src: 'materiais/kit-divulgacao-natal/post-feed-sabores.pdf', title: 'Post 5 Sabores Principais (PDF 1:1)', description: 'Folheto quadrado pronto para redes sociais ou WhatsApp.', category: 'materiais', format: 'PDF' },
    { id: 'dl-png-card', src: 'imagens/card-whatsapp-abertura.png', title: 'Cartão Abertura de Encomendas (Stories / Estado 9:16)', description: 'Imagem PNG pronta a partilhar no WhatsApp e Instagram.', category: 'imagens', format: 'PNG' },
    { id: 'dl-png-feed', src: 'imagens/post-feed-sabores.png', title: 'Post 5 Sabores Principais (Feed 1:1)', description: 'Imagem quadrada em alta resolução.', category: 'imagens', format: 'PNG' },
    { id: 'dl-png-menu', src: 'imagens/menu-natal-3-produtos.png', title: 'Imagem Menu de Natal 3 Faixas', description: 'Pronta a enviar em PDF ou imagem no chat.', category: 'imagens', format: 'PNG' },
    { id: 'dl-csv-calc', src: 'editaveis/calculadora-custos-e-precos-editavel.csv', title: 'Calculadora de Custos e Lucro (.csv)', description: 'Folha Excel / LibreOffice / Google Sheets com fórmulas em €.', category: 'editaveis', format: 'CSV' },
    { id: 'dl-csv-enc', src: 'editaveis/caderno-encomendas-editavel.csv', title: 'Caderno de Encomendas Editável (.csv)', description: 'Folha com cálculo automático de sinais 50 % e saldo restante.', category: 'editaveis', format: 'CSV' },
    { id: 'dl-csv-cal', src: 'editaveis/calendario-producao-entregas-editavel.csv', title: 'Calendário de Produção e Entregas 2026 (.csv)', description: 'Lotes sazonais de Natal e controlo automático de vagas restantes.', category: 'editaveis', format: 'CSV' },
    { id: 'dl-csv-lista', src: 'editaveis/lista-compras-editavel-10-30-50.csv', title: 'Lista de Compras 10/30/50 Editável (.csv)', description: 'Campos de preço unitário e orçamento automático.', category: 'editaveis', format: 'CSV' },
    { id: 'dl-csv-forn', src: 'editaveis/comparador-fornecedores-editavel.csv', title: 'Comparador de Fornecedores (.csv)', description: 'Compara preço por kg/unidade incluindo portes e IVA.', category: 'editaveis', format: 'CSV' },
    { id: 'dl-html-etq', src: 'editaveis/etiquetas-editaveis-a4.html', title: 'Editor HTML de Etiquetas A4 no Browser', description: 'Personalize o nome da sua marca, contactos e ingredientes antes de imprimir.', category: 'editaveis', format: 'HTML' },
    { id: 'dl-html-menu', src: 'editaveis/menu-natal-3-produtos-editavel.html', title: 'Editor HTML Menu de Natal (3 Produtos)', description: 'Edite os preços e exporte o catálogo do navegador.', category: 'editaveis', format: 'HTML' },
    { id: 'dl-html-card', src: 'editaveis/card-whatsapp-abertura-editavel.html', title: 'Editor HTML Cartão WhatsApp (9:16)', description: 'Personalize a mensagem de abertura de encomendas e exporte do navegador.', category: 'editaveis', format: 'HTML' },
    { id: 'dl-html-feed', src: 'editaveis/post-feed-sabores-editavel.html', title: 'Editor HTML Post Sabores (1:1)', description: 'Personalize os sabores e destaque a sua marca antes de exportar.', category: 'editaveis', format: 'HTML' },
  ];

  // Clear old downloads cleanly
  for (const existing of fs.readdirSync(PROTECTED_DL_DIR)) {
    fs.unlinkSync(path.join(PROTECTED_DL_DIR, existing));
  }

  const assets = [];
  for (const item of catalog) {
    const srcPath = path.join(DIST_PRODUCT, item.src);
    if (!fs.existsSync(srcPath)) {
      console.warn(`Aviso: ficheiro em falta para sincronização: ${srcPath}`);
      continue;
    }
    const flatName = path.basename(item.src);
    const destPath = path.join(PROTECTED_DL_DIR, flatName);
    fs.copyFileSync(srcPath, destPath);
    const bytes = fs.statSync(destPath).size;
    const sizeLabel = bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
    assets.push({
      id: item.id,
      fileKey: flatName,
      title: item.title,
      description: item.description,
      category: item.category,
      format: item.format,
      sizeLabel,
      fileName: flatName,
    });
  }
  return assets;
}

function main() {
  const recDir = path.join(SRC_PRODUCT, '01-ebook-principal', 'receitas');
  const recFiles = fs
    .readdirSync(recDir)
    .filter((f) => /^\d{2}-.+\.md$/.test(f))
    .sort();

  const recipes = recFiles.map((f) => parseRecipe(path.join(recDir, f)));
  const modules = parseModules();
  const { sevenDaysPlan, startupChecklist } = parseSevenDaysAndChecklist();
  const faqItems = parseFaq();
  const suppliers = parseSuppliers();
  const whatsappScripts = parseWhatsappScripts();
  const referenceBatches = parseReferenceBatches();
  const weekendSchedule = getWeekendSchedule();
  const downloads = syncProtectedDownloads();

  const payload = {
    generatedAt: new Date().toISOString(),
    isDemoMode: false,
    brand: {
      name: 'Panetones que Rendem',
      edition: 'Natal 2026 · Portugal (PT-PT)',
      currency: 'EUR',
      characterNote: 'Inês Martins é uma personagem ilustrativa da marca. Valores e prazos são orientativos e exigem calibração física.',
    },
    recipes,
    modules,
    sevenDaysPlan,
    startupChecklist,
    faqItems,
    suppliers,
    whatsappScripts,
    referenceBatches,
    weekendSchedule,
    downloads,
  };

  // Versão segura para Demonstração / QA: apenas 2 receitas de amostra, 1 módulo e zero downloads pagos expostos
  const demoPayload = {
    generatedAt: payload.generatedAt,
    isDemoMode: true,
    brand: payload.brand,
    recipes: recipes.filter((r) => r.id === 1 || r.id === 25),
    modules: modules.slice(0, 1),
    sevenDaysPlan: sevenDaysPlan.slice(0, 2),
    startupChecklist: startupChecklist.slice(0, 4),
    faqItems: faqItems.slice(0, 2),
    suppliers: suppliers.slice(0, 3),
    whatsappScripts: whatsappScripts.slice(0, 3),
    referenceBatches,
    weekendSchedule,
    downloads: [],
  };

  const outPath = path.join(PROTECTED_DATA_DIR, 'content.json');
  const demoOutPath = path.join(PROTECTED_DATA_DIR, 'demo-content.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8');
  fs.writeFileSync(demoOutPath, JSON.stringify(demoPayload, null, 2), 'utf-8');
  console.log(
    `[sync-content] Sincronizado com sucesso: ${recipes.length} receitas (demo: ${demoPayload.recipes.length}), ${modules.length} módulos, ${suppliers.length} fornecedores, ${whatsappScripts.length} scripts, ${downloads.length} ficheiros protegidos.`
  );
}

main();
