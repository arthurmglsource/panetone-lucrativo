#!/usr/bin/env python3
"""Compilador editorial HTML -> PDF para Panetones que Rendem (Natal 2026)."""

import base64
import html
import os
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path("/Users/arthurmagalhaes/.gemini/antigravity/scratch/panetone-lucrativo")
SRC = ROOT / "panetones-que-rendem"
OUT = ROOT / "produto-digital"
ASSETS = ROOT / "assets"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def img_data_uri(path: Path) -> str:
    data = path.read_bytes()
    ext = path.suffix.lower().lstrip(".")
    mime = "image/png" if ext == "png" else "image/jpeg"
    return f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"


FORMULA_MAP = {
    r"\text{Custo Total Unitário} = \text{Ingredientes (com quebra)} + \text{Embalagem} + \text{Energia/Indiretos} + \text{Mão de Obra} + \text{Taxas de Venda}": (
        "Custo Total Unitário = Ingredientes (com quebra +5 %) + Embalagem + Energia/Indiretos + Mão de Obra + Taxas de Venda"
    ),
    r"\text{Custo do Ingrediente} = \frac{\text{Preço da Embalagem}}{\text{Peso/Volume Total da Embalagem}} \times \text{Quantidade Usada na Receita}": (
        "Custo do Ingrediente = (Preço da Embalagem ÷ Peso/Volume Total) × Quantidade Usada na Receita"
    ),
    r"\frac{2,40 €}{200 \text{ g}} \times 150 \text{ g} = 1,80 €": (
        "(2,40 € ÷ 200 g) × 150 g = 1,80 €"
    ),
    r"\frac{2 \text{ h} \times 10,00 €}{8 \text{ unidades}} = 2,50 €/unidade": (
        "(2 h × 10,00 €) ÷ 8 unidades = 2,50 € / unidade"
    ),
    r"\text{Custo Ingredientes Receita} = \sum \left( \frac{\text{Preço da Embalagem (€)}}{\text{Peso Total (g/ml)}} \times \text{Qtd. na Receita (g/ml)} \right)": (
        "Custo Ingredientes Receita = Soma de [ (Preço da Embalagem ÷ Peso Total em g/ml) × Quantidade na Receita ]"
    ),
    r"\text{Custo Direto Unitário} = \frac{(\text{Custo Ingredientes} \times 1,05)}{\text{Rendimento (unid.)}} + \text{Embalagem Unitária}": (
        "Custo Direto Unitário = [ (Custo Ingredientes × 1,05) ÷ Rendimento (unid.) ] + Embalagem Unitária"
    ),
    r"\text{Custo Total Real Unitário} = \text{Custo Direto} + \text{Energia/Indiretos} + \left(\frac{\text{Minutos Ativos}}{60} \times \text{Valor/Hora €}\right)": (
        "Custo Total Real Unitário = Custo Direto + Energia/Indiretos + [ (Minutos Ativos ÷ 60) × Valor/Hora (€) ]"
    ),
    r"\text{Preço Sugerido (€)} = \frac{\text{Custo Total Real Unitário}}{1 - \text{Margem Pretendida (ex.: } 0,35\text{)}}": (
        "Preço Sugerido (€) = Custo Total Real Unitário ÷ (1 − Margem Pretendida, ex.: 0,35)"
    ),
}


def clean_inline(text: str) -> str:
    # Preserve intentional <br> or <br /> tags inside cells temporarily
    text = text.replace("<br />", "\u0001BR\u0001").replace("<br>", "\u0001BR\u0001")
    text = html.escape(text, quote=False)
    text = text.replace("\u0001BR\u0001", "<br />")

    # Normalize local file:// or relative .md links to clean bold labels without raw HTML tags/paths
    text = re.sub(r"\[([^\]]+)\]\(file://[^)]+\)", r"<strong>\1</strong>", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+\.md)\)", r"<strong>\1</strong>", text)
    text = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", r'<a href="\2">\1</a>', text)

    # Inline code
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    # Bold + italic
    text = re.sub(r"\*\*\*([^*]+)\*\*\*", r"<strong><em>\1</em></strong>", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", text)
    return text


def md_to_html(md_text: str) -> str:
    lines = md_text.splitlines()
    out = []
    i = 0
    in_code = False
    code_buf = []

    def is_table_sep(line: str) -> bool:
        s = line.strip()
        if "|" not in s:
            return False
        parts = [p.strip() for p in s.strip("|").split("|")]
        return all(re.match(r"^:?-{3,}:?$", p) for p in parts if p)

    while i < len(lines):
        prev_i = i
        line = lines[i]
        stripped = line.strip()

        # Code block
        if stripped.startswith("```"):
            if in_code:
                out.append("<pre><code>" + html.escape("\n".join(code_buf)) + "</code></pre>")
                code_buf = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue
        if in_code:
            code_buf.append(line)
            i += 1
            continue

        # Display math $$...$$
        if stripped.startswith("$$") and stripped.endswith("$$") and len(stripped) > 4:
            expr = stripped[2:-2].strip()
            pretty = FORMULA_MAP.get(expr, expr)
            out.append(f'<div class="formula-box">{html.escape(pretty)}</div>')
            i += 1
            continue

        # Blank line
        if not stripped:
            i += 1
            continue

        # Horizontal rule
        if re.match(r"^-{3,}$", stripped):
            out.append("<hr />")
            i += 1
            continue

        # Headings
        m_h = re.match(r"^(#{1,4})\s+(.+)$", stripped)
        if m_h:
            lvl = len(m_h.group(1))
            cls = ' class="chapter-title"' if lvl == 1 else ""
            out.append(f"<h{lvl}{cls}>{clean_inline(m_h.group(2))}</h{lvl}>")
            i += 1
            continue

        # Blockquote / Alert
        if stripped.startswith(">"):
            bq_lines = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                bq_lines.append(re.sub(r"^>\s?", "", lines[i].strip()))
                i += 1
            first = bq_lines[0] if bq_lines else ""
            m_alert = re.match(r"^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$", first)
            if m_alert:
                kind = m_alert.group(1).lower()
                titles = {
                    "note": "Nota Editorial",
                    "tip": "Dica Prática",
                    "important": "Importante",
                    "warning": "Atenção — Segurança",
                    "caution": "Cuidado Crítico",
                }
                rest = ([m_alert.group(2)] if m_alert.group(2) else []) + bq_lines[1:]
                body = "<br />".join(clean_inline(x) for x in rest if x.strip())
                out.append(f'<div class="callout callout-{kind}"><div class="callout-title">{titles[kind]}</div><p>{body}</p></div>')
            else:
                body = "<br />".join(clean_inline(x) for x in bq_lines if x.strip())
                out.append(f"<blockquote><p>{body}</p></blockquote>")
            continue

        # Table
        if "|" in stripped and i + 1 < len(lines) and is_table_sep(lines[i + 1]):
            headers = [c.strip() for c in stripped.strip("|").split("|")]
            i += 2
            rows = []
            while i < len(lines) and "|" in lines[i].strip() and lines[i].strip():
                row_cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                rows.append(row_cells)
                i += 1
            thtml = ['<div class="table-wrap"><table><thead><tr>']
            for h in headers:
                thtml.append(f"<th>{clean_inline(h)}</th>")
            thtml.append("</tr></thead><tbody>")
            for r in rows:
                thtml.append("<tr>")
                for idx in range(len(headers)):
                    cell = r[idx] if idx < len(r) else ""
                    # Render checklist brackets neatly
                    cell_html = clean_inline(cell).replace("[ ]", "&#9744;").replace("`&#9744;`", "&#9744;")
                    thtml.append(f"<td>{cell_html}</td>")
                thtml.append("</tr>")
            thtml.append("</tbody></table></div>")
            out.append("".join(thtml))
            continue

        # Unordered list
        if re.match(r"^[-*]\s+", stripped):
            items = []
            while i < len(lines):
                cur = lines[i]
                cur_s = cur.strip()
                if re.match(r"^[-*]\s+", cur_s) and (not cur.startswith("  ") or not items):
                    item_txt = re.sub(r"^[-*]\s+", "", cur_s)
                    item_txt = re.sub(r"^\[ \]\s*", "☐ ", item_txt)
                    sub = []
                    i += 1
                    while i < len(lines) and lines[i].startswith("  ") and re.match(r"^\s+(?:[-*]|\d+\.)\s+", lines[i]):
                        sub.append(re.sub(r"^\s*(?:[-*]|\d+\.)\s+", "", lines[i]))
                        i += 1
                    if sub:
                        sub_html = "<ul>" + "".join(f"<li>{clean_inline(s)}</li>" for s in sub) + "</ul>"
                        items.append(f"<li>{clean_inline(item_txt)}{sub_html}</li>")
                    else:
                        items.append(f"<li>{clean_inline(item_txt)}</li>")
                else:
                    break
            out.append("<ul>" + "".join(items) + "</ul>")
            continue

        # Ordered list
        if re.match(r"^\d+\.\s+", stripped):
            items = []
            while i < len(lines):
                cur = lines[i]
                cur_s = cur.strip()
                if re.match(r"^\d+\.\s+", cur_s) and (not cur.startswith("  ") or not items):
                    item_txt = re.sub(r"^\d+\.\s+", "", cur_s)
                    sub = []
                    i += 1
                    while i < len(lines) and lines[i].startswith("  ") and re.match(r"^\s+(?:[-*]|\d+\.)\s+", lines[i]):
                        sub.append(re.sub(r"^\s*(?:[-*]|\d+\.)\s+", "", lines[i]))
                        i += 1
                    if sub:
                        sub_html = "<ul>" + "".join(f"<li>{clean_inline(s)}</li>" for s in sub) + "</ul>"
                        items.append(f"<li>{clean_inline(item_txt)}{sub_html}</li>")
                    else:
                        items.append(f"<li>{clean_inline(item_txt)}</li>")
                else:
                    break
            out.append("<ol>" + "".join(items) + "</ol>")
            continue

        # Paragraph
        p_lines = [stripped]
        i += 1
        while (
            i < len(lines)
            and lines[i].strip()
            and not lines[i].strip().startswith(("#", ">", "-", "*", "```", "$$"))
            and not re.match(r"^\d+\.\s+", lines[i].strip())
            and not ("|" in lines[i] and i + 1 < len(lines) and is_table_sep(lines[i + 1]))
        ):
            p_lines.append(lines[i].strip())
            i += 1
        p_html = clean_inline(" ".join(p_lines)).replace("[ ]", "☐")
        out.append(f"<p>{p_html}</p>")
        if i == prev_i:
            i += 1

    return "\n".join(out)


BASE_CSS = """
:root {
  --wine: #4a0d16;
  --wine-deep: #27070d;
  --wine-soft: #6c2631;
  --gold: #e5a93b;
  --gold-light: #f5cf7a;
  --cream: #fff5e6;
  --cream-dark: #f3e5d1;
  --ink: #2c1a1c;
  --muted: #6e5b5a;
}
@page {
  size: A4;
  margin: 16mm 15mm 18mm 15mm;
  @bottom-center {
    content: "Panetones que Rendem · Edição Portugal 2026 · Pág. " counter(page);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 8.5pt;
    color: #6e5b5a;
  }
}
@page :first {
  margin: 0;
  @bottom-center { content: ""; }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 10pt;
  line-height: 1.52;
  color: var(--ink);
  background: #ffffff;
}
.cover {
  height: 297mm;
  width: 210mm;
  background: radial-gradient(circle at top center, #6c2631 0%, #4a0d16 48%, #27070d 100%);
  color: var(--cream);
  padding: 22mm 20mm;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  page-break-after: always;
  position: relative;
}
.cover::before {
  content: "";
  position: absolute;
  inset: 9mm;
  border: 1.5px solid rgba(229, 169, 59, 0.5);
  border-radius: 10px;
  pointer-events: none;
}
.cover-top { text-align: center; }
.cover-logo { width: 170px; height: auto; margin-bottom: 10mm; filter: drop-shadow(0 8px 18px rgba(0,0,0,0.45)); }
.cover-pill {
  display: inline-block;
  background: var(--gold);
  color: var(--wine-deep);
  font-weight: 800;
  font-size: 9pt;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  padding: 5px 16px;
  border-radius: 999px;
  margin-bottom: 8mm;
}
.cover h1 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 30pt;
  line-height: 1.14;
  color: var(--cream);
  margin: 0 0 6mm 0;
}
.cover h1 span { color: var(--gold); }
.cover-sub {
  font-size: 12.5pt;
  color: var(--gold-light);
  max-width: 145mm;
  margin: 0 auto;
  line-height: 1.5;
}
.cover-card {
  background: rgba(255, 245, 230, 0.08);
  border: 1px solid rgba(229, 169, 59, 0.45);
  border-radius: 10px;
  padding: 6mm 8mm;
  font-size: 9.5pt;
  line-height: 1.5;
}
.cover-footer {
  border-top: 1px solid rgba(229, 169, 59, 0.35);
  padding-top: 5mm;
  display: flex;
  justify-content: space-between;
  font-size: 8.5pt;
  color: var(--gold-light);
}
.section-break { page-break-before: always; }
h1.chapter-title {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 19pt;
  color: var(--wine);
  border-bottom: 2.5px solid var(--gold);
  padding-bottom: 4px;
  margin: 0 0 10px 0;
  page-break-after: avoid;
}
h2 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 13pt;
  color: var(--wine-deep);
  margin: 14px 0 6px 0;
  border-left: 4px solid var(--gold);
  padding-left: 8px;
  page-break-after: avoid;
}
h3 {
  font-size: 11pt;
  color: var(--wine);
  margin: 10px 0 4px 0;
  page-break-after: avoid;
}
p { margin: 0 0 8px 0; }
ul, ol { margin: 4px 0 10px 0; padding-left: 18px; }
li { margin-bottom: 3px; }
hr { border: none; border-top: 1px solid #e7d8c5; margin: 12px 0; }
code {
  background: #fff5e6;
  color: var(--wine-deep);
  padding: 1px 4px;
  border-radius: 3px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 8.8pt;
}
pre {
  background: #fdf8f0;
  border: 1px solid #dfc8a9;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 8.3pt;
  white-space: pre-wrap;
  page-break-inside: avoid;
}
pre code { background: none; padding: 0; }
blockquote {
  margin: 8px 0;
  padding: 8px 12px;
  background: #fff9ef;
  border-left: 4px solid var(--gold);
  border-radius: 0 6px 6px 0;
  font-style: italic;
}
blockquote p { margin: 0; }
.callout {
  margin: 9px 0;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 4px solid var(--wine);
  background: #fff6e9;
  page-break-inside: avoid;
}
.callout-tip { border-left-color: #2f7d4b; background: #f2fbf5; }
.callout-important { border-left-color: var(--gold); background: #fff9ec; }
.callout-warning, .callout-caution { border-left-color: #9e1b24; background: #fff1f2; }
.callout-title { font-weight: 800; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px; color: var(--wine-deep); margin-bottom: 3px; }
.callout p { margin: 0; font-size: 9.2pt; }
.formula-box {
  background: #27070d;
  color: #fff5e6;
  border: 1.5px solid var(--gold);
  border-radius: 6px;
  padding: 8px 12px;
  margin: 8px 0;
  text-align: center;
  font-weight: 700;
  font-size: 9.5pt;
  page-break-inside: avoid;
}
.table-wrap { margin: 8px 0 12px 0; page-break-inside: auto; }
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.6pt;
}
th {
  background: var(--wine);
  color: var(--cream);
  font-weight: 700;
  text-align: left;
  padding: 5px 6px;
  border: 1px solid var(--wine-deep);
}
td {
  padding: 4.5px 6px;
  border: 1px solid #e2d1bc;
  vertical-align: top;
}
tr:nth-child(even) td { background: #fffbf4; }
tr { page-break-inside: avoid; }
.recipe-badge {
  display: inline-block;
  background: var(--wine);
  color: var(--gold-light);
  font-size: 8pt;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 999px;
  margin-bottom: 5px;
}
"""


def build_cover(logo_uri: str, kicker: str, title_html: str, subtitle: str, card_html: str) -> str:
    return f"""
    <section class="cover">
      <div class="cover-top">
        <img class="cover-logo" src="{logo_uri}" alt="Panetones que Rendem" />
        <br />
        <div class="cover-pill">{kicker}</div>
        <h1>{title_html}</h1>
        <p class="cover-sub">{subtitle}</p>
      </div>
      <div class="cover-card">{card_html}</div>
      <div class="cover-footer">
        <span>Panetones que Rendem · Método Encomenda Primeiro</span>
        <span>Portugal (PT-PT) · Valores em Euros (€) · Natal 2026</span>
      </div>
    </section>
    """


def _run_chrome_pdf(uri: str, pdf_path: Path) -> None:
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="chrome_pdf_prof_") as prof_dir:
        cmd = [
            CHROME,
            "--headless",
            f"--user-data-dir={prof_dir}",
            "--disable-gpu",
            "--no-sandbox",
            "--no-pdf-header-footer",
            f"--print-to-pdf={pdf_path}",
            uri,
        ]
        subprocess.run(cmd, check=True, timeout=60, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    size_kb = pdf_path.stat().st_size / 1024.0
    print(f"OK: {pdf_path.relative_to(ROOT)} ({size_kb:.1f} KB)", flush=True)


def html_to_pdf(html_str: str, pdf_path: Path, landscape: bool = False) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as tmp:
        if landscape:
            landscape_override = """
            <style>
            @page { size: A4 landscape; }
            .cover { height: 210mm; width: 297mm; padding: 12mm 20mm; }
            .cover-logo { width: 120px; margin-bottom: 4mm; }
            .cover-pill { margin-bottom: 4mm; }
            .cover h1 { font-size: 25pt; margin-bottom: 3mm; }
            .cover-sub { font-size: 11pt; max-width: 190mm; }
            .cover-card { padding: 4mm 7mm; font-size: 9pt; }
            .cover-footer { padding-top: 3mm; }
            </style>
            """
            html_str = html_str.replace("</head>", landscape_override + "</head>")
        tmp.write(html_str)
        tmp_path = Path(tmp.name)
    try:
        _run_chrome_pdf(tmp_path.as_uri(), pdf_path)
    finally:
        tmp_path.unlink(missing_ok=True)


def existing_html_to_pdf(src_html: Path, pdf_path: Path) -> None:
    _run_chrome_pdf(src_html.as_uri(), pdf_path)


def main():
    logo_uri = img_data_uri(ASSETS / "logo-panetones-que-rendem.png")

    # 1. Guia Principal (01-guia-principal-panetones-que-rendem.pdf)
    ebook_files = [
        SRC / "01-ebook-principal/00-introducao-e-indice.md",
        SRC / "01-ebook-principal/modulo-01-menu-de-natal.md",
        SRC / "01-ebook-principal/modulo-02-massa-sem-complicacoes.md",
        SRC / "01-ebook-principal/modulo-03-recheios-e-coberturas.md",
        SRC / "01-ebook-principal/modulo-04-precos-que-compensam.md",
        SRC / "01-ebook-principal/modulo-05-metodo-encomenda-primeiro.md",
        SRC / "01-ebook-principal/modulo-06-plano-de-producao.md",
        SRC / "01-ebook-principal/07-primeiros-7-dias-e-checklist.md",
        SRC / "01-ebook-principal/08-glossario-e-faq.md",
    ]
    sections_guia = []
    for idx, fp in enumerate(ebook_files):
        body = md_to_html(fp.read_text(encoding="utf-8"))
        cls = ' class="section-break"' if idx > 0 else ""
        sections_guia.append(f"<section{cls}>{body}</section>")

    cover_guia = build_cover(
        logo_uri,
        "Guia Principal · Edição Completa",
        "Panetones que <span>Rendem</span>",
        "Método completo para planear, produzir, calcular custos reais em euros e vender por encomenda no Natal em Portugal.",
        "<strong>Inclui:</strong> Introdução &amp; Índice · Os 6 Módulos Completos (Menu de Natal, Massa sem Complicações, Recheios e Coberturas, Preços que Compensam, Método Encomenda Primeiro e Plano de Produção 30 unid.) · Os Primeiros 7 Dias · Enquadramento Legal PT (ASAE/DGAV/AT) · Glossário &amp; FAQ.<br /><br /><em>Nota editorial: Inês Martins é uma personagem ilustrativa da marca. Valores e prazos indicados são orientativos e exigem validação física na cozinha do produtor.</em>",
    )
    html_guia = f"<!DOCTYPE html><html lang='pt-PT'><head><meta charset='UTF-8'><style>{BASE_CSS}</style></head><body>{cover_guia}{''.join(sections_guia)}</body></html>"
    html_to_pdf(html_guia, OUT / "ebooks/01-guia-principal-panetones-que-rendem.pdf")

    # 2. Caderno de 30 Receitas (02-caderno-30-fichas-receitas.pdf)
    recipe_readme = md_to_html((SRC / "01-ebook-principal/receitas/README.md").read_text(encoding="utf-8"))
    recipe_files = sorted((SRC / "01-ebook-principal/receitas").glob("[0-9][0-9]-*.md"))
    recipe_sections = [f"<section>{recipe_readme}</section>"]
    for rf in recipe_files:
        num = int(rf.name[:2])
        bloco = (
            "Bloco A · Massas Base" if num <= 4 else
            "Bloco B · Clássicos & Frutados" if num <= 10 else
            "Bloco C · Chocotones & Recheados" if num <= 18 else
            "Bloco D · Mini Panetones" if num <= 24 else
            "Bloco E · Panetone no Copo"
        )
        body = md_to_html(rf.read_text(encoding="utf-8"))
        recipe_sections.append(f'<section class="section-break"><div class="recipe-badge">Ficha {num:02d}/30 · {bloco}</div>{body}</section>')

    cover_receitas = build_cover(
        logo_uri,
        "Caderno Técnico · 30 Formulações",
        "Caderno das <span>30 Receitas</span>",
        "Massas base, clássicos portugueses, chocotones recheados nos 5 sabores principais, mini panetones e sobremesas no copo.",
        "<strong>Especificação Técnica:</strong> Quantidades em gramas (<code>g</code>) e mililitros (<code>ml</code>), temperaturas de forno e centro (<code>92 °C–94 °C</code>), técnica de <em>tombamento</em>, conservação, alergénios em destaque (Reg. UE 1169/2011), erros comuns e recomendação de calibração física prévia.",
    )
    html_receitas = f"<!DOCTYPE html><html lang='pt-PT'><head><meta charset='UTF-8'><style>{BASE_CSS}</style></head><body>{cover_receitas}{''.join(recipe_sections)}</body></html>"
    html_to_pdf(html_receitas, OUT / "ebooks/02-caderno-30-fichas-receitas.pdf")

    # 3. Os 3 Bónus em PDF
    bonuses = [
        (
            "Bónus 01 · Ferramenta Operacional",
            "Lista de Compras <span>10 / 30 / 50</span>",
            "Quantidades escaladas diretamente das receitas do guia com separação de ingredientes, recheios, embalagens e consumíveis.",
            SRC / "04-bonus-lista-compras/bonus-01-lista-compras-10-30-50.md",
            OUT / "bonus/bonus-01-lista-compras-10-30-50.pdf",
            False,
        ),
        (
            "Bónus 02 · Gestão de Pedidos & MB WAY",
            "Caderno de <span>Encomendas</span>",
            "Registo completo de clientes, sabores, sinais de 50 % por MB WAY, saldo em falta, datas de produção e fecho de caixa.",
            SRC / "05-bonus-caderno-encomendas/bonus-02-caderno-encomendas.md",
            OUT / "bonus/bonus-02-caderno-encomendas.pdf",
            True,
        ),
        (
            "Bónus 03 · Mercado Português",
            "Guia de <span>Fornecedores</span>",
            "Canais reais em Portugal para farinhas de força, chocolates, formas forneáveis, caixas, copos e etiquetas verificados em 2026.",
            SRC / "06-bonus-guia-fornecedores/bonus-03-guia-fornecedores-portugal.md",
            OUT / "bonus/bonus-03-guia-fornecedores-portugal.pdf",
            False,
        ),
    ]
    for kicker, title_html, sub, src_md, out_pdf, land in bonuses:
        cov = build_cover(logo_uri, kicker, title_html, sub, "Versão imprimível incluída no pacote <strong>Panetones que Rendem</strong>. Ficheiro de folha de cálculo editável (<code>.csv</code>) disponível na pasta <code>editaveis/</code>.")
        body = md_to_html(src_md.read_text(encoding="utf-8"))
        html_doc = f"<!DOCTYPE html><html lang='pt-PT'><head><meta charset='UTF-8'><style>{BASE_CSS}</style></head><body>{cov}<section>{body}</section></body></html>"
        html_to_pdf(html_doc, out_pdf, landscape=land)

    # 4. Materiais Extras & Guias Práticos em PDF
    cov_kit = build_cover(
        logo_uri,
        "Material Extra 01 · Kit Vende Sozinho",
        "Guiões &amp; <span>Divulgação</span>",
        "Mensagens prontas de WhatsApp, sequência para Estados, respostas a objeções, publicações de Feed e roteiro de Stories.",
        "Textos prontos em português europeu para divulgar sem improvisar e confirmar encomendas com sinal de 50 % por MB WAY.",
    )
    body_kit = md_to_html((SRC / "02-kit-divulgacao/kit-divulgacao-natal-textos.md").read_text(encoding="utf-8"))
    html_to_pdf(
        f"<!DOCTYPE html><html lang='pt-PT'><head><meta charset='UTF-8'><style>{BASE_CSS}</style></head><body>{cov_kit}<section>{body_kit}</section></body></html>",
        OUT / "materiais/guia-mensagens-whatsapp.pdf",
    )

    # Extras práticos (Calculadora, Calendário, Checklist) num caderno prático consolidado + Guia Etiquetas
    extras_html = [
        f"<section>{md_to_html((SRC / '09-extras-praticos/calculadora-custos-e-precos-guia.md').read_text(encoding='utf-8'))}</section>",
        f"<section class='section-break'>{md_to_html((SRC / '09-extras-praticos/calendario-producao-e-entregas.md').read_text(encoding='utf-8'))}</section>",
        f"<section class='section-break'>{md_to_html((SRC / '09-extras-praticos/checklist-primeira-encomenda.md').read_text(encoding='utf-8'))}</section>",
        f"<section class='section-break'>{md_to_html((SRC / '03-etiquetas/guia-etiquetas-e-rotulagem-pt.md').read_text(encoding='utf-8'))}</section>",
    ]
    cov_extras = build_cover(
        logo_uri,
        "Ferramentas &amp; Rotulagem Portugal",
        "Kit Operacional <span>Natal 2026</span>",
        "Guia da Calculadora de Custos (€), Calendário de Produção e Entregas, Checklist da Primeira Encomenda e Guia de Rotulagem (ASAE/UE 1169/2011).",
        "Utilize este caderno em conjunto com os ficheiros editáveis <code>.csv</code> e <code>.html</code> da pasta <code>editaveis/</code>.",
    )
    html_to_pdf(
        f"<!DOCTYPE html><html lang='pt-PT'><head><meta charset='UTF-8'><style>{BASE_CSS}</style></head><body>{cov_extras}{''.join(extras_html)}</body></html>",
        OUT / "materiais/caderno-operacional-custos-calendario-rotulagem.pdf",
    )

    # 5. Compilar templates visuais HTML existentes para PDFs finais em materiais/
    existing_html_to_pdf(
        SRC / "02-kit-divulgacao/modelos-visuais-editaveis/menu-natal-3-produtos-editavel.html",
        OUT / "materiais/catalogo-natal-personalizavel.pdf",
    )
    existing_html_to_pdf(
        SRC / "03-etiquetas/etiquetas-editaveis-a4.html",
        OUT / "materiais/etiquetas-marca-propria-a4.pdf",
    )
    existing_html_to_pdf(
        SRC / "02-kit-divulgacao/modelos-visuais-editaveis/card-whatsapp-abertura-editavel.html",
        OUT / "materiais/kit-divulgacao-natal/card-whatsapp-abertura.pdf",
    )
    existing_html_to_pdf(
        SRC / "02-kit-divulgacao/modelos-visuais-editaveis/post-feed-sabores-editavel.html",
        OUT / "materiais/kit-divulgacao-natal/post-feed-sabores.pdf",
    )

    # 6. Copiar ficheiros editáveis (.csv e .html) para produto-digital/editaveis/
    import shutil
    edit_dir = OUT / "editaveis"
    edit_dir.mkdir(parents=True, exist_ok=True)
    editables = [
        SRC / "04-bonus-lista-compras/lista-compras-editavel-10-30-50.csv",
        SRC / "05-bonus-caderno-encomendas/caderno-encomendas-editavel.csv",
        SRC / "06-bonus-guia-fornecedores/comparador-fornecedores-editavel.csv",
        SRC / "09-extras-praticos/calculadora-custos-e-precos-editavel.csv",
        SRC / "09-extras-praticos/calendario-producao-entregas-editavel.csv",
        SRC / "02-kit-divulgacao/modelos-visuais-editaveis/menu-natal-3-produtos-editavel.html",
        SRC / "02-kit-divulgacao/modelos-visuais-editaveis/card-whatsapp-abertura-editavel.html",
        SRC / "02-kit-divulgacao/modelos-visuais-editaveis/post-feed-sabores-editavel.html",
        SRC / "03-etiquetas/etiquetas-editaveis-a4.html",
    ]
    for src_f in editables:
        shutil.copy2(src_f, edit_dir / src_f.name)
    for gk in [OUT / "ebooks/.gitkeep", OUT / "bonus/.gitkeep", OUT / "materiais/.gitkeep"]:
        if gk.exists():
            gk.unlink()

    print("PDFs compilados com sucesso em:", OUT)


if __name__ == "__main__":
    main()

