#!/usr/bin/env python3
"""Compilador editorial premium HTML -> PDF/PNG para Panetones que Rendem (Natal 2026)."""

import base64
import html
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path("/Users/arthurmagalhaes/.gemini/antigravity/scratch/panetone-lucrativo")
SRC = ROOT / "panetones-que-rendem"
OUT = ROOT / "produto-digital"
ASSETS = ROOT / "assets"
ED_ASSETS = SRC / "assets-editoriais"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def img_data_uri(path: Path, max_dim: int = 1150, force_jpeg: bool = False) -> str:
    """Redimensiona e otimiza imagem via macOS sips para manter PDFs leves e nítidos."""
    with tempfile.TemporaryDirectory(prefix="opt_img_") as tdir:
        tmp_out = Path(tdir) / (path.stem + (".jpg" if force_jpeg else path.suffix.lower()))
        fmt_args = ["-s", "format", "jpeg", "-s", "formatOptions", "82"] if force_jpeg else []
        subprocess.run(
            ["sips", "-Z", str(max_dim), *fmt_args, str(path), "--out", str(tmp_out)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        data = tmp_out.read_bytes()
    ext = tmp_out.suffix.lower().lstrip(".")
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


HOLLY_SVG = """
<svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
  <path d="M16 14C12 10 6 11 4 15C8 16 11 19 16 17Z" fill="#2f6f3e"/>
  <path d="M16 14C20 10 26 11 28 15C24 16 21 19 16 17Z" fill="#265b32"/>
  <circle cx="14" cy="18" r="2.6" fill="#c72c38"/>
  <circle cx="18.2" cy="18" r="2.6" fill="#d93844"/>
  <circle cx="16.1" cy="15" r="2.4" fill="#e54854"/>
</svg>
""".strip()


def clean_inline(text: str, recipe_anchors: bool = True) -> str:
    text = text.replace("<br />", "\u0001BR\u0001").replace("<br>", "\u0001BR\u0001")
    text = text.replace(r"\*", "\u0002STAR\u0002")
    text = html.escape(text, quote=False)
    text = text.replace("\u0001BR\u0001", "<br />")

    def repl_md_link(m: re.Match) -> str:
        label, target = m.group(1), m.group(2)
        m_rec = re.search(r"(?:^|/)(\d{2})-[^/]+\.md$", target)
        if m_rec and recipe_anchors:
            num = int(m_rec.group(1))
            clean_lbl = re.sub(r"\.md$", "", label)
            if re.match(r"^\d{2}-", clean_lbl):
                return f'<a class="anchor-pill" href="#rec-{num:02d}">Ficha {num:02d} &rarr;</a>'
            return f'<a href="#rec-{num:02d}">{clean_lbl}</a>'
        clean_lbl = re.sub(r"\.md$", "", label)
        return f"<strong>{clean_lbl}</strong>"

    text = re.sub(r"\[([^\]]+)\]\(file://[^)]+\)", lambda m: f"<strong>{m.group(1)}</strong>", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+\.md)\)", repl_md_link, text)
    text = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', text)
    # Converter URLs soltos em links clicáveis reais no PDF (excluindo backtick)
    text = re.sub(r'(?<!href=")(https?://[^\s<>"\)\`]+)', r'<a href="\1" target="_blank" rel="noopener">\1</a>', text)

    def repl_code_md(m: re.Match) -> str:
        inner = m.group(1)
        if inner.startswith("<a href="):
            return inner
        if inner.startswith("https://") or inner.startswith("http://"):
            return f'<a href="{inner}" target="_blank" rel="noopener">{inner}</a>'
        if recipe_anchors:
            m_rec = re.match(r"^(\d{2})-[a-z0-9-]+\.md$", inner)
            if m_rec:
                n = int(m_rec.group(1))
                return f'<a class="anchor-pill" href="#rec-{n:02d}">Ficha {n:02d} &rarr;</a>'
            m_mod = re.match(r"^modulo-(\d{2})-[a-z0-9-]+\.md$", inner)
            if m_mod:
                n = int(m_mod.group(1))
                return f'<a class="anchor-pill" href="#mod-{n:02d}">M&oacute;dulo {n:02d} &rarr;</a>'
            if inner == "07-primeiros-7-dias-e-checklist.md":
                return '<a class="anchor-pill" href="#sec-7dias">7 Dias &rarr;</a>'
            if inner == "08-glossario-e-faq.md":
                return '<a class="anchor-pill" href="#sec-faq">FAQ &rarr;</a>'
            if inner == "receitas/README.md":
                return '<a class="anchor-pill" href="#bloco-a">Ver 30 Fichas &rarr;</a>'
        return f"<code>{inner}</code>"

    text = re.sub(r"`([^`]+)`", repl_code_md, text)
    text = re.sub(r"\*\*\*([^*]+)\*\*\*", r"<strong><em>\1</em></strong>", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", text)
    text = text.replace("\u0002STAR\u0002", "*")
    return text


def md_to_html(md_text: str, recipe_anchors: bool = True) -> str:
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

        if stripped.startswith("$$") and stripped.endswith("$$") and len(stripped) > 4:
            expr = stripped[2:-2].strip()
            pretty = FORMULA_MAP.get(expr, expr)
            out.append(f'<div class="formula-box">{html.escape(pretty)}</div>')
            i += 1
            continue

        if not stripped:
            i += 1
            continue

        if re.match(r"^-{3,}$", stripped):
            out.append("<hr />")
            i += 1
            continue

        m_h = re.match(r"^(#{1,4})\s+(.+)$", stripped)
        if m_h:
            lvl = len(m_h.group(1))
            cls = ' class="chapter-title"' if lvl == 1 else ""
            out.append(f"<h{lvl}{cls}>{clean_inline(m_h.group(2), recipe_anchors)}</h{lvl}>")
            i += 1
            continue

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
                body = "<br />".join(clean_inline(x, recipe_anchors) for x in rest if x.strip())
                out.append(
                    f'<div class="callout callout-{kind}"><div class="callout-title">{titles[kind]}</div><p>{body}</p></div>'
                )
            else:
                body = "<br />".join(clean_inline(x, recipe_anchors) for x in bq_lines if x.strip())
                out.append(f"<blockquote><p>{body}</p></blockquote>")
            continue

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
                thtml.append(f"<th>{clean_inline(h, recipe_anchors)}</th>")
            thtml.append("</tr></thead><tbody>")
            for r in rows:
                thtml.append("<tr>")
                for idx in range(len(headers)):
                    cell = r[idx] if idx < len(r) else ""
                    cell_html = clean_inline(cell, recipe_anchors).replace("[ ]", "&#9744;").replace("`&#9744;`", "&#9744;")
                    thtml.append(f"<td>{cell_html}</td>")
                thtml.append("</tr>")
            thtml.append("</tbody></table></div>")
            out.append("".join(thtml))
            continue

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
                        sub_html = "<ul>" + "".join(f"<li>{clean_inline(s, recipe_anchors)}</li>" for s in sub) + "</ul>"
                        items.append(f"<li>{clean_inline(item_txt, recipe_anchors)}{sub_html}</li>")
                    else:
                        items.append(f"<li>{clean_inline(item_txt, recipe_anchors)}</li>")
                else:
                    break
            cls_ul = ' class="checklist"' if any("<li>☐ " in it or it.startswith("<li>&#9744;") for it in items) else ""
            out.append(f"<ul{cls_ul}>" + "".join(items) + "</ul>")
            continue

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
                        sub_html = "<ul>" + "".join(f"<li>{clean_inline(s, recipe_anchors)}</li>" for s in sub) + "</ul>"
                        items.append(f"<li>{clean_inline(item_txt, recipe_anchors)}{sub_html}</li>")
                    else:
                        items.append(f"<li>{clean_inline(item_txt, recipe_anchors)}</li>")
                else:
                    break
            out.append("<ol>" + "".join(items) + "</ol>")
            continue

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
        p_html = clean_inline(" ".join(p_lines), recipe_anchors).replace("[ ]", "☐")
        out.append(f"<p>{p_html}</p>")
        if i == prev_i:
            i += 1

    return "\n".join(out)


def render_recipe_card(md_text: str, num: int, bloco: str, toc_href: str = "#indice") -> str:
    """Converte uma ficha Markdown numa apresentação visual editorial estruturada."""
    lines = md_text.splitlines()
    title = f"Receita {num:02d}"
    summary_quote = ""
    sections: dict[str, list[str]] = {}
    current_h2 = None

    for line in lines:
        s = line.strip()
        if s.startswith("# ") and current_h2 is None:
            title = s[2:].strip()
        elif s.startswith(">") and current_h2 is None:
            q_part = re.sub(r"^>\s?", "", s)
            summary_quote = (summary_quote + " " + q_part).strip()
        elif s.startswith("## "):
            current_h2 = s[3:].strip()
            sections[current_h2] = []
        elif current_h2 is not None:
            sections[current_h2].append(line)

    # 1. Ficha Técnica Resumida -> 4 cards no topo
    ficha_lines = sections.get("Ficha Técnica Resumida", [])
    meta_cards = []
    for fl in ficha_lines:
        fs = fl.strip()
        m_kv = re.match(r"^[-*]\s+\*\*(.+?):\*\*\s*(.+)$", fs)
        if m_kv:
            k, v = clean_inline(m_kv.group(1)), clean_inline(m_kv.group(2))
            meta_cards.append(f'<div class="meta-tile"><div class="meta-k">{k}</div><div class="meta-v">{v}</div></div>')

    # 2. Utensílios
    utens_md = "\n".join(sections.get("Utensílios Necessários", []))
    utens_html = md_to_html(utens_md)

    # 3. Ingredientes
    ing_md = "\n".join(sections.get("Ingredientes (Exatos em Gramas e Mililitros)", []))
    ing_html = md_to_html(ing_md)

    # 4. Preparação
    prep_md = "\n".join(sections.get("Preparação Numerada Passo a Passo", []))
    prep_html = md_to_html(prep_md)

    # 5. Conservação & Alergénios (tolerando ambos os títulos de H2)
    cons_key = (
        "Recheios, Conservação e Alergénios"
        if "Recheios, Conservação e Alergénios" in sections
        else "Conservação, Segurança e Alergénios"
    )
    cons_md = "\n".join(sections.get(cons_key, []))
    cons_html = md_to_html(cons_md)

    # 6. Erros Comuns e Validação
    err_md = "\n".join(sections.get("Erros Comuns e Validação Física", []))
    err_html = md_to_html(err_md)

    quote_html = f'<div class="rec-summary">{clean_inline(summary_quote)}</div>' if summary_quote else ""
    meta_grid_html = f'<div class="meta-grid">{"".join(meta_cards)}</div>' if meta_cards else ""

    return f"""
    <section class="section-break recipe-sheet" id="rec-{num:02d}">
      <div class="rec-topbar">
        <span class="recipe-badge">Ficha {num:02d}/30 &middot; {html.escape(bloco)}</span>
        <a class="back-toc" href="{toc_href}">&uarr; Voltar ao &Iacute;ndice</a>
      </div>
      <h1 class="chapter-title rec-title">{clean_inline(title)}</h1>
      {quote_html}
      {meta_grid_html}
      <div class="rec-prep-cols">
        <div class="rec-box rec-box-utens">
          <div class="rec-box-head">Utens&iacute;lios Necess&aacute;rios</div>
          {utens_html}
        </div>
        <div class="rec-box rec-box-ingred">
          <div class="rec-box-head">Ingredientes (Exatos em Gramas / ml)</div>
          {ing_html}
        </div>
      </div>
      <div class="rec-steps-wrap">
        <div class="rec-steps-head">Prepara&ccedil;&atilde;o Passo a Passo</div>
        {prep_html}
      </div>
      <div class="rec-footer-cols">
        <div class="rec-foot-card rec-foot-safe">
          <div class="rec-foot-title">Conserva&ccedil;&atilde;o &amp; Alerg&eacute;nios</div>
          {cons_html}
        </div>
        <div class="rec-foot-card rec-foot-warn">
          <div class="rec-foot-title">Erros Comuns &amp; Valida&ccedil;&atilde;o F&iacute;sica</div>
          {err_html}
        </div>
      </div>
    </section>
    """


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
  margin: 14mm 14mm 17mm 14mm;
  @bottom-center {
    content: "Panetones que Rendem · Edição Portugal 2026 · Pág. " counter(page);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 8.2pt;
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
  font-size: 10.2pt;
  line-height: 1.54;
  color: var(--ink);
  background: #ffffff;
}
a { color: var(--wine); font-weight: 700; text-decoration: underline; }
.anchor-pill {
  display: inline-block;
  background: rgba(229, 169, 59, 0.22);
  color: var(--wine-deep);
  border: 1px solid rgba(229, 169, 59, 0.55);
  border-radius: 999px;
  padding: 2px 9px;
  font-size: 8.2pt;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}
/* CAPA PREMIUM */
.cover {
  height: 297mm;
  width: 210mm;
  background: radial-gradient(circle at top center, #6c2631 0%, #4a0d16 46%, #27070d 100%);
  color: var(--cream);
  padding: 16mm 18mm 14mm 18mm;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  page-break-after: always;
  position: relative;
}
.cover::before {
  content: "";
  position: absolute;
  inset: 8mm;
  border: 1.5px solid rgba(229, 169, 59, 0.55);
  border-radius: 12px;
  pointer-events: none;
}
.cover-top { text-align: center; }
.cover-logo { width: 155px; height: auto; margin-bottom: 5mm; filter: drop-shadow(0 8px 18px rgba(0,0,0,0.45)); }
.cover-pill {
  display: inline-block;
  background: var(--gold);
  color: var(--wine-deep);
  font-weight: 800;
  font-size: 8.8pt;
  letter-spacing: 1.3px;
  text-transform: uppercase;
  padding: 5px 15px;
  border-radius: 999px;
  margin-bottom: 4.5mm;
}
.cover h1 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 28pt;
  line-height: 1.12;
  color: var(--cream);
  margin: 0 0 4mm 0;
}
.cover h1 span { color: var(--gold); }
.cover-sub {
  font-size: 11.5pt;
  color: var(--gold-light);
  max-width: 152mm;
  margin: 0 auto;
  line-height: 1.48;
}
.cover-visual {
  margin: 4mm auto;
  width: 146mm;
  border-radius: 14px;
  overflow: hidden;
  border: 2px solid rgba(229, 169, 59, 0.65);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45);
}
.cover-visual img {
  display: block;
  width: 100%;
  height: 58mm;
  object-fit: cover;
}
.cover-card {
  background: rgba(255, 245, 230, 0.09);
  border: 1px solid rgba(229, 169, 59, 0.48);
  border-radius: 10px;
  padding: 5mm 7mm;
  font-size: 9.2pt;
  line-height: 1.48;
}
.cover-card code {
  background: rgba(255, 245, 230, 0.16);
  color: var(--gold-light);
}
.cover-footer {
  border-top: 1px solid rgba(229, 169, 59, 0.35);
  padding-top: 4mm;
  display: flex;
  justify-content: space-between;
  font-size: 8.4pt;
  color: var(--gold-light);
}

/* NAVEGAÇÃO & QUEBRAS */
.section-break { page-break-before: always; }
.rec-topbar, .mod-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.back-toc {
  font-size: 8.2pt;
  font-weight: 700;
  color: var(--wine-soft);
  background: var(--cream);
  border: 1px solid rgba(229, 169, 59, 0.65);
  padding: 2px 9px;
  border-radius: 999px;
  text-decoration: none;
}
.holly-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* BANNER DE MÓDULO / BLOCO */
.hero-banner {
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid var(--gold);
  margin: 0 0 10px 0;
  background: var(--wine-deep);
}
.hero-banner img {
  display: block;
  width: 100%;
  height: 36mm;
  object-fit: cover;
}
.hero-banner-cap {
  padding: 6px 12px;
  font-size: 8.6pt;
  color: var(--gold-light);
  background: var(--wine-deep);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ÍNDICE NAVEGÁVEL */
.toc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 8px;
}
.toc-card {
  background: #fffcf7;
  border: 1px solid #e6d3b8;
  border-top: 3px solid var(--wine);
  border-radius: 10px;
  padding: 9px 11px;
  break-inside: avoid;
}
.toc-card-wide {
  grid-column: 1 / -1;
}
.toc-card h3 {
  margin: 0 0 6px 0;
  font-size: 9.5pt;
  color: var(--wine);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.toc-list li {
  margin: 2px 0;
  font-size: 8.8pt;
  line-height: 1.38;
}
.toc-list a {
  text-decoration: none;
  color: var(--ink);
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  gap: 6px;
  border-bottom: 1px dotted #e3d2bc;
  padding: 2px 0;
}
.toc-list a span.toc-tag {
  color: var(--wine);
  font-weight: 800;
  white-space: nowrap;
}
.toc-rec-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 14px;
}

/* TIPOGRAFIA CORRENTE */
h1.chapter-title {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 18pt;
  color: var(--wine);
  border-bottom: 2.5px solid var(--gold);
  padding-bottom: 5px;
  margin: 0 0 10px 0;
  page-break-after: avoid;
}
h2 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 13pt;
  color: var(--wine);
  margin: 14px 0 6px 0;
  padding-left: 8px;
  border-left: 3.5px solid var(--gold);
  page-break-after: avoid;
}
h3 {
  font-size: 10.6pt;
  color: var(--wine-soft);
  margin: 10px 0 4px 0;
  page-break-after: avoid;
}
p { margin: 0 0 7px 0; }
ul, ol { margin: 0 0 8px 0; padding-left: 18px; }
ul.checklist { list-style: none; padding-left: 2px; }
li { margin-bottom: 3.5px; }
pre {
  break-inside: avoid;
  background: #fffcf6;
  border: 1px solid #e4d2bc;
  border-left: 3.5px solid var(--gold);
  border-radius: 8px;
  padding: 8px 11px;
  font-size: 8.5pt;
  line-height: 1.44;
  white-space: pre-wrap;
  margin: 7px 0 10px 0;
}
pre code { background: none; color: var(--ink); padding: 0; font-size: 8.5pt; }
code {
  background: rgba(229, 169, 59, 0.16);
  color: var(--wine);
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 9pt;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
hr { border: none; border-top: 1px solid #e7d5be; margin: 11px 0; }
blockquote {
  margin: 8px 0;
  padding: 9px 13px;
  background: var(--cream);
  border-left: 4px solid var(--gold);
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: var(--ink);
  break-inside: avoid;
}
blockquote p:last-child { margin-bottom: 0; }
.callout {
  margin: 9px 0;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--gold);
  background: #fff9ef;
  break-inside: avoid;
}
.callout-warning, .callout-caution {
  background: #fdf2f2;
  border-color: #c85c5c;
}
.callout-important {
  background: #fff4df;
  border-color: var(--gold);
}
.callout-title {
  font-weight: 800;
  font-size: 8.4pt;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: var(--wine);
  margin-bottom: 3px;
}
.callout p { margin: 0; font-size: 9.4pt; }
.formula-box {
  margin: 7px 0;
  padding: 8px 12px;
  background: var(--wine-deep);
  color: var(--gold-light);
  border-radius: 8px;
  font-weight: 700;
  font-size: 9.2pt;
  text-align: center;
  break-inside: avoid;
}
.table-wrap { margin: 7px 0 11px 0; }
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.6pt;
}
thead { display: table-header-group; }
tr { break-inside: avoid; }
th {
  background: var(--wine);
  color: var(--cream);
  text-align: left;
  padding: 5.5px 7px;
  font-weight: 700;
  border: 1px solid var(--wine);
}
th code {
  background: rgba(255, 245, 230, 0.2);
  color: var(--cream);
}
td {
  padding: 5px 7px;
  border: 1px solid #e4d2bc;
  vertical-align: top;
}
tbody tr:nth-child(even) { background: #fff9f0; }

/* TEMPLATE ESTRUTURADO DAS 30 RECEITAS */
.recipe-badge {
  display: inline-block;
  background: var(--wine);
  color: var(--gold-light);
  font-size: 8pt;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
}
.rec-title { margin-bottom: 6px; font-size: 16.5pt; }
.rec-summary {
  background: var(--cream);
  border-left: 4px solid var(--gold);
  border-radius: 0 8px 8px 0;
  padding: 7px 11px;
  font-size: 9.4pt;
  margin-bottom: 8px;
}
.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-bottom: 9px;
  break-inside: avoid;
}
.meta-tile {
  background: #fffcf6;
  border: 1px solid #e5d1b5;
  border-radius: 7px;
  padding: 5px 8px;
}
.meta-k {
  font-size: 7.6pt;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--wine-soft);
}
.meta-v {
  font-size: 8.8pt;
  color: var(--ink);
  line-height: 1.35;
}
.rec-prep-cols {
  display: grid;
  grid-template-columns: 0.85fr 1.35fr;
  gap: 9px;
  margin-bottom: 10px;
  align-items: start;
}
.rec-box {
  border-radius: 9px;
  padding: 8px 10px;
  font-size: 9.1pt;
}
.rec-box-utens {
  background: #fffdf9;
  border: 1px solid #e5d1b5;
}
.rec-box-ingred {
  background: var(--cream);
  border: 1.5px solid rgba(229, 169, 59, 0.7);
}
.rec-box-head {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 10pt;
  font-weight: 700;
  color: var(--wine);
  border-bottom: 1.5px solid var(--gold);
  padding-bottom: 3px;
  margin-bottom: 6px;
}
.rec-box ul, .rec-box p { margin-bottom: 4px; font-size: 8.9pt; }
.rec-box ul { padding-left: 14px; }
.rec-steps-wrap {
  margin-bottom: 10px;
}
.rec-steps-head {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 11.2pt;
  font-weight: 700;
  color: var(--wine);
  border-left: 3.5px solid var(--gold);
  padding-left: 8px;
  margin-bottom: 6px;
  page-break-after: avoid;
}
.rec-steps-wrap ol {
  counter-reset: step;
  list-style: none;
  padding-left: 0;
  margin: 0;
}
.rec-steps-wrap ol > li {
  counter-increment: step;
  position: relative;
  padding-left: 26px;
  margin-bottom: 5.5px;
  font-size: 9.4pt;
}
.rec-steps-wrap ol > li::before {
  content: counter(step);
  position: absolute;
  left: 0;
  top: 1px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--wine);
  color: var(--gold-light);
  font-size: 8pt;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rec-footer-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  break-inside: avoid;
}
.rec-foot-card {
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 8.7pt;
}
.rec-foot-safe {
  background: #fff9ef;
  border: 1px solid var(--gold);
}
.rec-foot-warn {
  background: #fdf4f4;
  border: 1px solid #d18585;
}
.rec-foot-title {
  font-size: 8pt;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--wine);
  margin-bottom: 4px;
}
.rec-foot-card ul { padding-left: 14px; margin-bottom: 0; }
.rec-foot-card li { margin-bottom: 2.5px; }
"""


def build_cover(
    logo_uri: str,
    kicker: str,
    title_html: str,
    subtitle: str,
    card_html: str,
    hero_photo_uri: str = "",
    compact: bool = False,
) -> str:
    visual_block = (
        f'<div class="cover-visual"><img src="{hero_photo_uri}" alt="Panetones artesanais" /></div>'
        if hero_photo_uri
        else ""
    )
    return f"""
    <section class="cover{' cover-compact' if compact else ''}">
      <div class="cover-top">
        <div class="holly-row" style="justify-content:center; margin-bottom:2mm;">{HOLLY_SVG}</div>
        <img class="cover-logo" src="{logo_uri}" alt="Panetones que Rendem" />
        <br />
        <div class="cover-pill">{kicker}</div>
        <h1>{title_html}</h1>
        <p class="cover-sub">{subtitle}</p>
      </div>
      {visual_block}
      <div class="cover-card">{card_html}</div>
      <div class="cover-footer">
        <span>Panetones que Rendem &middot; M&eacute;todo Encomenda Primeiro</span>
        <span>Portugal (PT-PT) &middot; Valores em Euros (&euro;) &middot; Natal 2026</span>
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
    print(f"OK PDF: {pdf_path.relative_to(ROOT)} ({size_kb:.1f} KB)", flush=True)


def _render_pdf_to_png(pdf_path: Path, png_path: Path, target_width_px: int = 1080) -> None:
    """Renderiza a página 1 de um PDF em PNG de alta resolução via PDFKit (sem recortes)."""
    png_path.parent.mkdir(parents=True, exist_ok=True)
    swift_code = f"""
import Foundation
import PDFKit
import AppKit

let doc = PDFDocument(url: URL(fileURLWithPath: "{pdf_path}"))!
let page = doc.page(at: 0)!
let b = page.bounds(for: .mediaBox)
let scale = CGFloat({target_width_px}) / b.width
let sz = NSSize(width: round(b.width * scale), height: round(b.height * scale))
let img = NSImage(size: sz)
img.lockFocus()
NSColor.white.set()
NSRect(origin: .zero, size: sz).fill()
if let ctx = NSGraphicsContext.current?.cgContext {{
    ctx.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: ctx)
}}
img.unlockFocus()
let rep = NSBitmapImageRep(data: img.tiffRepresentation!)!
let png = rep.representation(using: .png, properties: [:])!
try png.write(to: URL(fileURLWithPath: "{png_path}"))
"""
    subprocess.run(["swift", "-"], input=swift_code.encode("utf-8"), check=True)
    size_kb = png_path.stat().st_size / 1024.0
    print(f"OK PNG: {png_path.relative_to(ROOT)} ({size_kb:.1f} KB)", flush=True)


def html_to_pdf(html_str: str, pdf_path: Path, landscape: bool = False) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as tmp:
        if landscape:
            landscape_override = """
            <style>
            @page { size: A4 landscape; }
            .cover { height: 210mm; width: 297mm; padding: 11mm 20mm; }
            .cover-logo { width: 115px; margin-bottom: 3mm; }
            .cover-pill { margin-bottom: 3mm; }
            .cover h1 { font-size: 24pt; margin-bottom: 2.5mm; }
            .cover-sub { font-size: 10.8pt; max-width: 195mm; }
            .cover-card { padding: 4mm 7mm; font-size: 8.9pt; }
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


def extract_recipe_title(rf: Path) -> str:
    first = rf.read_text(encoding="utf-8").splitlines()[0]
    raw = re.sub(r"^#\s*Receita\s+\d+\s*[—-]\s*", "", first).strip()
    return raw.replace("*", "")


def build_complete_ebook_toc(recipe_files: list[Path]) -> str:
    rec_links = []
    for rf in recipe_files:
        num = int(rf.name[:2])
        t = html.escape(extract_recipe_title(rf))
        rec_links.append(f'<li><a href="#rec-{num:02d}"><span><strong>{num:02d}.</strong> {t}</span><span class="toc-tag">Ver &rarr;</span></a></li>')

    return f"""
    <section class="section-break" id="indice">
      <div class="rec-topbar">
        <span class="recipe-badge">Navega&ccedil;&atilde;o Direta &middot; Hiperliga&ccedil;&otilde;es Ativas</span>
        <span class="holly-row">{HOLLY_SVG}</span>
      </div>
      <h1 class="chapter-title">&Iacute;ndice Geral Naveg&aacute;vel</h1>
      <p>Toque ou clique em qualquer m&oacute;dulo ou receita abaixo para saltar diretamente para a sec&ccedil;&atilde;o correspondente (no telem&oacute;vel ou computador).</p>

      <div class="toc-grid">
        <div class="toc-card">
          <h3>Parte I &middot; O M&eacute;todo em 6 M&oacute;dulos</h3>
          <ul class="toc-list">
            <li><a href="#sec-intro"><span>Introdu&ccedil;&atilde;o &amp; Mapa de Leitura</span><span class="toc-tag">Intro</span></a></li>
            <li><a href="#mod-01"><span>M&oacute;dulo 01 &mdash; Menu de Natal que Vende</span><span class="toc-tag">M01</span></a></li>
            <li><a href="#mod-02"><span>M&oacute;dulo 02 &mdash; Massa sem Complica&ccedil;&otilde;es</span><span class="toc-tag">M02</span></a></li>
            <li><a href="#mod-03"><span>M&oacute;dulo 03 &mdash; Recheios e Coberturas</span><span class="toc-tag">M03</span></a></li>
            <li><a href="#mod-04"><span>M&oacute;dulo 04 &mdash; Pre&ccedil;os que Compensam (&euro;)</span><span class="toc-tag">M04</span></a></li>
            <li><a href="#mod-05"><span>M&oacute;dulo 05 &mdash; M&eacute;todo Encomenda Primeiro</span><span class="toc-tag">M05</span></a></li>
            <li><a href="#mod-06"><span>M&oacute;dulo 06 &mdash; Plano de Produ&ccedil;&atilde;o (30 unid.)</span><span class="toc-tag">M06</span></a></li>
          </ul>
        </div>

        <div class="toc-card">
          <h3>Parte II &middot; Arranque, Legal PT &amp; FAQ</h3>
          <ul class="toc-list">
            <li><a href="#sec-7dias"><span>Os Primeiros 7 Dias &amp; Enquadramento Legal PT</span><span class="toc-tag">ASAE/AT</span></a></li>
            <li><a href="#sec-faq"><span>Gloss&aacute;rio T&eacute;cnico &amp; Perguntas Frequentes</span><span class="toc-tag">FAQ</span></a></li>
            <li><a href="#bloco-a"><span>Parte III &middot; Bloco A: Massas Base (01&ndash;04)</span><span class="toc-tag">A</span></a></li>
            <li><a href="#bloco-b"><span>Bloco B: Cl&aacute;ssicos &amp; Frutados (05&ndash;10)</span><span class="toc-tag">B</span></a></li>
            <li><a href="#bloco-c"><span>Bloco C: Chocotones &amp; Recheados (11&ndash;18)</span><span class="toc-tag">C</span></a></li>
            <li><a href="#bloco-d"><span>Bloco D: Mini Panetones (19&ndash;24)</span><span class="toc-tag">D</span></a></li>
            <li><a href="#bloco-e"><span>Bloco E: Panetone no Copo (25&ndash;30)</span><span class="toc-tag">E</span></a></li>
          </ul>
        </div>

        <div class="toc-card toc-card-wide">
          <h3>Parte III &middot; Todas as 30 Fichas de Receitas Completas</h3>
          <ul class="toc-list toc-rec-cols">
            {''.join(rec_links)}
          </ul>
        </div>
      </div>
    </section>
    """


def build_recipes_only_toc(recipe_files: list[Path]) -> str:
    rec_links = []
    for rf in recipe_files:
        num = int(rf.name[:2])
        t = html.escape(extract_recipe_title(rf))
        rec_links.append(f'<li><a href="#rec-{num:02d}"><span><strong>{num:02d}.</strong> {t}</span><span class="toc-tag">Ficha {num:02d}</span></a></li>')
    return f"""
    <section class="section-break" id="indice">
      <div class="rec-topbar">
        <span class="recipe-badge">Caderno de Bancada &middot; 30 Fichas T&eacute;cnicas</span>
        <span class="holly-row">{HOLLY_SVG}</span>
      </div>
      <h1 class="chapter-title">&Iacute;ndice R&aacute;pido das 30 Receitas</h1>
      <div class="toc-card toc-card-wide">
        <h3>Saltar Diretamente para a Ficha Desejada</h3>
        <ul class="toc-list toc-rec-cols">{''.join(rec_links)}</ul>
      </div>
    </section>
    """


def render_module_section(
    sec_id: str,
    kicker: str,
    md_path: Path,
    banner_uri: str = "",
    banner_cap: str = "",
    toc_href: str = "#indice",
) -> str:
    body = md_to_html(md_path.read_text(encoding="utf-8"))
    banner_html = ""
    if banner_uri:
        banner_html = f"""
        <div class="hero-banner">
          <img src="{banner_uri}" alt="{html.escape(banner_cap)}" />
          <div class="hero-banner-cap">
            <span>{html.escape(banner_cap)}</span>
            <span>Edi&ccedil;&atilde;o Portugal 2026</span>
          </div>
        </div>
        """
    return f"""
    <section class="section-break" id="{sec_id}">
      <div class="mod-topbar">
        <span class="recipe-badge">{html.escape(kicker)}</span>
        <a class="back-toc" href="{toc_href}">&uarr; Voltar ao &Iacute;ndice</a>
      </div>
      {banner_html}
      {body}
    </section>
    """


def main():
    logo_uri = img_data_uri(ASSETS / "logo-panetones-que-rendem.png", max_dim=480, force_jpeg=False)
    banner_modulos_uri = img_data_uri(ASSETS / "banner-modulos-panetones-que-rendem.png", max_dim=1050, force_jpeg=True)
    fornada_uri = img_data_uri(ASSETS / "fornada-imagem-ilustrativa.png", max_dim=1050, force_jpeg=True)
    foto_classico_uri = img_data_uri(ED_ASSETS / "foto-panetone-classico.jpg", max_dim=1050, force_jpeg=True)
    foto_chocotone_uri = img_data_uri(ED_ASSETS / "foto-chocotone-recheado.jpg", max_dim=1050, force_jpeg=True)
    foto_mini_copo_uri = img_data_uri(ED_ASSETS / "foto-mini-e-copo.jpg", max_dim=1050, force_jpeg=True)
    ilust_natal_uri = img_data_uri(ED_ASSETS / "ilust-natal-atelie.jpg", max_dim=1050, force_jpeg=True)

    # Remover antigo PDF parcial caso exista
    old_guia = OUT / "ebooks/01-guia-principal-panetones-que-rendem.pdf"
    if old_guia.exists():
        old_guia.unlink()

    recipe_files = sorted((SRC / "01-ebook-principal/receitas").glob("[0-9][0-9]-*.md"))

    # ------------------------------------------------------------------
    # 0. GUIA RÁPIDO "COMECE AQUI"
    # ------------------------------------------------------------------
    cov_start = build_cover(
        logo_uri,
        "Comece Aqui &middot; Primeiros 15 Minutos",
        "Guia R&aacute;pido de <span>Arranque</span>",
        "O que abrir primeiro ap&oacute;s a compra, como usar os edit&aacute;veis no telem&oacute;vel ou computador e os 3 passos imediatos de hoje.",
        "<strong>Leitura recomendada de 5 minutos:</strong> antes de imprimir receitas ou ir &agrave;s compras, confirme neste mapa a ordem exata de utiliza&ccedil;&atilde;o do e-book completo, dos 3 b&oacute;nus e dos kits visuais.",
        hero_photo_uri=ilust_natal_uri,
    )
    body_start = md_to_html((SRC / "00-comece-aqui.md").read_text(encoding="utf-8"), recipe_anchors=False)
    html_start = f"<!DOCTYPE html><html lang='pt-PT'><head><meta charset='UTF-8'><style>{BASE_CSS}</style></head><body>{cov_start}<section id='start-body'>{body_start}</section></body></html>"
    html_to_pdf(html_start, OUT / "00-comece-aqui-guia-rapido.pdf")

    # ------------------------------------------------------------------
    # 1. E-BOOK COMPLETO (Capa + Índice Navegável + 6 Módulos + 30 Receitas)
    # ------------------------------------------------------------------
    cov_ebook = build_cover(
        logo_uri,
        "E-book Principal Completo &middot; 6 M&oacute;dulos + 30 Receitas",
        "Panetones que <span>Rendem</span>",
        "O manual completo para produzir panetones artesanais, calcular custos reais em euros e vender por encomenda com sinal MB WAY no Natal em Portugal.",
        "<strong>Edi&ccedil;&atilde;o Integral PT-PT:</strong> &Iacute;ndice Naveg&aacute;vel &middot; 6 M&oacute;dulos Completos (Menu de Natal, Massa sem Complica&ccedil;&otilde;es, Recheios e Coberturas, Pre&ccedil;os em Euros, M&eacute;todo Encomenda Primeiro e Plano 30 unid.) &middot; Enquadramento Legal PT (ASAE/DGAV/AT) &middot; <strong>As 30 Receitas Completas</strong>.<br /><br /><em>Nota de transpar&ecirc;ncia: In&ecirc;s Martins &eacute; uma personagem ilustrativa da marca. Valores e tempos s&atilde;o orientativos e requerem testes f&iacute;sicos antes da venda.</em>",
        hero_photo_uri=foto_classico_uri,
    )
    toc_ebook = build_complete_ebook_toc(recipe_files)

    modules_html = [
        render_module_section(
            "sec-intro", "Introdução & Visão Geral",
            SRC / "01-ebook-principal/00-introducao-e-indice.md",
            banner_modulos_uri, "Identidade Panetones que Rendem — Método Completo PT-PT"
        ),
        render_module_section(
            "mod-01", "Módulo 01 · Catálogo Estratégico",
            SRC / "01-ebook-principal/modulo-01-menu-de-natal.md",
            foto_mini_copo_uri, "Exemplo visual de oferta em 3 faixas (Minis, Copo e Grande)"
        ),
        render_module_section(
            "mod-02", "Módulo 02 · Panificação Técnica",
            SRC / "01-ebook-principal/modulo-02-massa-sem-complicacoes.md",
            foto_classico_uri, "Alveolagem de massa levedada enriquecida — textura de referência"
        ),
        render_module_section(
            "mod-03", "Módulo 03 · Recheios & Acabamento",
            SRC / "01-ebook-principal/modulo-03-recheios-e-coberturas.md",
            foto_chocotone_uri, "Estrutura de chocotone escavado com creme fluido e ganache firme"
        ),
        render_module_section(
            "mod-04", "Módulo 04 · Margens & Custos (€)",
            SRC / "01-ebook-principal/modulo-04-precos-que-compensam.md",
        ),
        render_module_section(
            "mod-05", "Módulo 05 · Vendas & MB WAY",
            SRC / "01-ebook-principal/modulo-05-metodo-encomenda-primeiro.md",
            ilust_natal_uri, "Método Encomenda Primeiro: divulgar, sinalizar e produzir sem desperdício"
        ),
        render_module_section(
            "mod-06", "Módulo 06 · Operação 30 Unidades",
            SRC / "01-ebook-principal/modulo-06-plano-de-producao.md",
            fornada_uri, "Fornada ilustrativa — planeamento em escala num fim de semana"
        ),
        render_module_section(
            "sec-7dias", "Arranque Prático & Legal PT",
            SRC / "01-ebook-principal/07-primeiros-7-dias-e-checklist.md",
        ),
        render_module_section(
            "sec-faq", "Referência Técnica & FAQ",
            SRC / "01-ebook-principal/08-glossario-e-faq.md",
        ),
    ]

    def build_recipes_sections(with_block_banners: bool = True) -> list[str]:
        parts = []
        block_meta = {
            1: ("bloco-a", "Bloco A · Massas Base Estruturais (01–04)", foto_classico_uri, "Massas enriquecidas em gramas exatas (método direto, esponja, cacau e salgado)"),
            5: ("bloco-b", "Bloco B · Clássicos & Frutados Portugueses (05–10)", foto_classico_uri, "Frutas, laranja com crosta de amêndoa, Vinho do Porto e especiarias"),
            11: ("bloco-c", "Bloco C · Chocotones & Recheados Premium (11–18)", foto_chocotone_uri, "Os 5 sabores principais do método + versões especiais de montra"),
            19: ("bloco-d", "Bloco D · Mini Panetones para Oferta (19–24)", foto_mini_copo_uri, "Formatação para lembranças individuais e caixas de oferta"),
            25: ("bloco-e", "Bloco E · Sobremesas de Panetone no Copo (25–30)", foto_mini_copo_uri, "Sobremesas à colher para aproveitamento inteligente de miolos"),
        }
        for rf in recipe_files:
            num = int(rf.name[:2])
            bloco_short = (
                "Bloco A · Massas Base" if num <= 4 else
                "Bloco B · Clássicos & Frutados" if num <= 10 else
                "Bloco C · Chocotones & Recheados" if num <= 18 else
                "Bloco D · Mini Panetones" if num <= 24 else
                "Bloco E · Panetone no Copo"
            )
            if with_block_banners and num in block_meta:
                bid, btitle, bimg, bcap = block_meta[num]
                parts.append(
                    f"""
                    <section class="section-break" id="{bid}">
                      <div class="mod-topbar">
                        <span class="recipe-badge">Parte III &middot; Abertura de Bloco</span>
                        <a class="back-toc" href="#indice">&uarr; Voltar ao &Iacute;ndice</a>
                      </div>
                      <h1 class="chapter-title">{html.escape(btitle)}</h1>
                      <div class="hero-banner">
                        <img src="{bimg}" alt="{html.escape(btitle)}" />
                        <div class="hero-banner-cap"><span>{html.escape(bcap)}</span><span>Fichas T&eacute;cnicas</span></div>
                      </div>
                    """
                )
                # Fecha logo com README se num == 1 ou nota curta para evitar página quase vazia!
                if num == 1:
                    parts.append(md_to_html((SRC / "01-ebook-principal/receitas/README.md").read_text(encoding="utf-8")))
                parts.append("</section>")
            parts.append(render_recipe_card(rf.read_text(encoding="utf-8"), num, bloco_short, "#indice"))
        return parts

    # No Bloco B..E, colocamos o banner no topo da própria 1.ª ficha do bloco (ou juntamos sem gerar página quase vazia!)
    def build_recipes_compact(include_readme: bool = True) -> list[str]:
        parts = []
        if include_readme:
            parts.append(
                render_module_section(
                    "bloco-a",
                    "Parte III · Fichas Técnicas",
                    SRC / "01-ebook-principal/receitas/README.md",
                    foto_classico_uri,
                    "As 30 Formulações Técnicas Estruturadas (Massas, Clássicos, Recheados, Minis e Copo)",
                )
            )
        block_headers = {
            5: ("bloco-b", "Bloco B · Clássicos & Frutados Portugueses (05–10)", foto_classico_uri),
            11: ("bloco-c", "Bloco C · Chocotones & Recheados Premium (11–18)", foto_chocotone_uri),
            19: ("bloco-d", "Bloco D · Mini Panetones para Oferta (19–24)", foto_mini_copo_uri),
            25: ("bloco-e", "Bloco E · Sobremesas de Panetone no Copo (25–30)", foto_mini_copo_uri),
        }
        for rf in recipe_files:
            num = int(rf.name[:2])
            bloco_short = (
                "Bloco A · Massas Base" if num <= 4 else
                "Bloco B · Clássicos & Frutados" if num <= 10 else
                "Bloco C · Chocotones & Recheados" if num <= 18 else
                "Bloco D · Mini Panetones" if num <= 24 else
                "Bloco E · Panetone no Copo"
            )
            card_html = render_recipe_card(rf.read_text(encoding="utf-8"), num, bloco_short, "#indice")
            if num in block_headers:
                bid, btitle, bimg = block_headers[num]
                banner_inject = f'<div id="{bid}" class="hero-banner" style="margin-bottom:8px;"><img style="height:32mm;" src="{bimg}" alt="{html.escape(btitle)}" /><div class="hero-banner-cap"><span>{html.escape(btitle)}</span><span>Fotografia ilustrativa</span></div></div>'
                card_html = card_html.replace('<div class="rec-topbar">', banner_inject + '<div class="rec-topbar">')
            parts.append(card_html)
        return parts

    all_ebook_recipes = build_recipes_compact(include_readme=True)
    html_ebook_full = (
        "<!DOCTYPE html><html lang='pt-PT'><head><meta charset='UTF-8'>"
        f"<style>{BASE_CSS}</style></head><body>"
        f"{cov_ebook}{toc_ebook}{''.join(modules_html)}{''.join(all_ebook_recipes)}"
        "</body></html>"
    )
    html_to_pdf(html_ebook_full, OUT / "ebooks/01-ebook-completo-panetones-que-rendem.pdf")

    # ------------------------------------------------------------------
    # 2. CADERNO DE BANCADA (30 Receitas com Índice Navegável)
    # ------------------------------------------------------------------
    cov_receitas = build_cover(
        logo_uri,
        "Caderno de Cozinha &middot; Impress&atilde;o R&aacute;pida",
        "Caderno das <span>30 Receitas</span>",
        "Vers&atilde;o de consulta r&aacute;pida na bancada com todas as fichas t&eacute;cnicas estruturadas, gramas/ml e alertas de alerg&eacute;nios.",
        "<strong>Especifica&ccedil;&atilde;o T&eacute;cnica:</strong> Quantidades em gramas (<code>g</code>) e mililitros (<code>ml</code>), temperaturas de forno e centro (<code>92 &deg;C&ndash;94 &deg;C</code>), t&eacute;cnica de <em>tombamento</em>, conserva&ccedil;&atilde;o orientativa e alerg&eacute;nios (Reg. UE 1169/2011).",
        hero_photo_uri=foto_chocotone_uri,
    )
    toc_rec = build_recipes_only_toc(recipe_files)
    rec_only_parts = build_recipes_compact(include_readme=False)
    html_receitas = (
        "<!DOCTYPE html><html lang='pt-PT'><head><meta charset='UTF-8'>"
        f"<style>{BASE_CSS}</style></head><body>"
        f"{cov_receitas}{toc_rec}{''.join(rec_only_parts)}</body></html>"
    )
    html_to_pdf(html_receitas, OUT / "ebooks/02-caderno-30-fichas-receitas.pdf")

    # ------------------------------------------------------------------
    # 3. OS 3 BÓNUS INDEPENDENTES
    # ------------------------------------------------------------------
    bonuses = [
        (
            "B&oacute;nus 01 &middot; Ferramenta Operacional",
            "Lista de Compras <span>10 / 30 / 50</span>",
            "Quantidades escaladas diretamente das receitas do guia com separa&ccedil;&atilde;o de ingredientes, recheios, embalagens e consum&iacute;veis.",
            SRC / "04-bonus-lista-compras/bonus-01-lista-compras-10-30-50.md",
            OUT / "bonus/bonus-01-lista-compras-10-30-50.pdf",
            False,
            ilust_natal_uri,
        ),
        (
            "B&oacute;nus 02 &middot; Gest&atilde;o de Pedidos &amp; MB WAY",
            "Caderno de <span>Encomendas</span>",
            "Registo completo de clientes, sabores, sinais de 50 % por MB WAY, saldo em falta, datas de produ&ccedil;&atilde;o e fecho de caixa.",
            SRC / "05-bonus-caderno-encomendas/bonus-02-caderno-encomendas.md",
            OUT / "bonus/bonus-02-caderno-encomendas.pdf",
            True,
            "",
        ),
        (
            "B&oacute;nus 03 &middot; Mercado Portugu&ecirc;s",
            "Guia de <span>Fornecedores</span>",
            "Canais reais em Portugal para farinhas de for&ccedil;a, chocolates, formas forne&aacute;veis, caixas, copos e etiquetas verificados em 2026.",
            SRC / "06-bonus-guia-fornecedores/bonus-03-guia-fornecedores-portugal.md",
            OUT / "bonus/bonus-03-guia-fornecedores-portugal.pdf",
            False,
            "",
        ),
    ]
    for kicker, title_html, sub, src_md, out_pdf, land, cov_img in bonuses:
        cov = build_cover(
            logo_uri, kicker, title_html, sub,
            "Vers&atilde;o imprim&iacute;vel inclu&iacute;da no pacote <strong>Panetones que Rendem</strong>. Folha de c&aacute;lculo edit&aacute;vel (<code>.csv</code>) correspondente na pasta <code>editaveis/</code>.",
            hero_photo_uri=cov_img,
        )
        body = md_to_html(src_md.read_text(encoding="utf-8"), recipe_anchors=False)
        html_doc = f"<!DOCTYPE html><html lang='pt-PT'><head><meta charset='UTF-8'><style>{BASE_CSS}</style></head><body>{cov}<section>{body}</section></body></html>"
        html_to_pdf(html_doc, out_pdf, landscape=land)

    # ------------------------------------------------------------------
    # 4. MATERIAIS EXTRAS & CADERNO OPERACIONAL
    # ------------------------------------------------------------------
    cov_kit = build_cover(
        logo_uri,
        "Material Extra 01 &middot; Kit Vende Sozinho",
        "Gui&otilde;es &amp; <span>Divulga&ccedil;&atilde;o</span>",
        "Mensagens prontas de WhatsApp, sequ&ecirc;ncia para Estados, respostas a obje&ccedil;&otilde;es, publica&ccedil;&otilde;es de Feed e roteiro de Stories.",
        "Textos prontos em portugu&ecirc;s europeu para divulgar sem improvisar e confirmar encomendas com sinal de 50 % por MB WAY. Cart&otilde;es PNG e HTML disponíveis em <code>imagens/</code> e <code>editaveis/</code>.",
        hero_photo_uri=ilust_natal_uri,
    )
    body_kit = md_to_html((SRC / "02-kit-divulgacao/kit-divulgacao-natal-textos.md").read_text(encoding="utf-8"), recipe_anchors=False)
    html_to_pdf(
        f"<!DOCTYPE html><html lang='pt-PT'><head><meta charset='UTF-8'><style>{BASE_CSS}</style></head><body>{cov_kit}<section>{body_kit}</section></body></html>",
        OUT / "materiais/guia-mensagens-whatsapp.pdf",
    )

    extras_html = [
        f"<section id='calc'>{md_to_html((SRC / '09-extras-praticos/calculadora-custos-e-precos-guia.md').read_text(encoding='utf-8'), recipe_anchors=False)}</section>",
        f"<section id='cal' class='section-break'>{md_to_html((SRC / '09-extras-praticos/calendario-producao-e-entregas.md').read_text(encoding='utf-8'), recipe_anchors=False)}</section>",
        f"<section id='chk' class='section-break'>{md_to_html((SRC / '09-extras-praticos/checklist-primeira-encomenda.md').read_text(encoding='utf-8'), recipe_anchors=False)}</section>",
        f"<section id='rot' class='section-break'>{md_to_html((SRC / '03-etiquetas/guia-etiquetas-e-rotulagem-pt.md').read_text(encoding='utf-8'), recipe_anchors=False)}</section>",
    ]
    cov_extras = build_cover(
        logo_uri,
        "Ferramentas &amp; Rotulagem Portugal",
        "Kit Operacional <span>Natal 2026</span>",
        "Guia da Calculadora de Custos (&euro;), Calend&aacute;rio de Produ&ccedil;&atilde;o e Entregas, Checklist da Primeira Encomenda e Guia Legal de Rotulagem (ASAE/UE 1169/2011).",
        "Utilize este caderno em conjunto com os ficheiros edit&aacute;veis <code>.csv</code> e <code>.html</code> da pasta <code>editaveis/</code>.",
    )
    html_to_pdf(
        f"<!DOCTYPE html><html lang='pt-PT'><head><meta charset='UTF-8'><style>{BASE_CSS}</style></head><body>{cov_extras}{''.join(extras_html)}</body></html>",
        OUT / "materiais/caderno-operacional-custos-calendario-rotulagem.pdf",
    )

    # ------------------------------------------------------------------
    # 5. TEMPLATES VISUAIS -> PDFs + PNGs PRONTOS PARA TELEMÓVEL / REDES
    # ------------------------------------------------------------------
    tpl_menu = SRC / "02-kit-divulgacao/modelos-visuais-editaveis/menu-natal-3-produtos-editavel.html"
    tpl_labels = SRC / "03-etiquetas/etiquetas-editaveis-a4.html"
    tpl_story = SRC / "02-kit-divulgacao/modelos-visuais-editaveis/card-whatsapp-abertura-editavel.html"
    tpl_feed = SRC / "02-kit-divulgacao/modelos-visuais-editaveis/post-feed-sabores-editavel.html"

    _run_chrome_pdf(tpl_menu.as_uri(), OUT / "materiais/catalogo-natal-personalizavel.pdf")
    _run_chrome_pdf(tpl_labels.as_uri(), OUT / "materiais/etiquetas-marca-propria-a4.pdf")
    _run_chrome_pdf(tpl_story.as_uri(), OUT / "materiais/kit-divulgacao-natal/card-whatsapp-abertura.pdf")
    _run_chrome_pdf(tpl_feed.as_uri(), OUT / "materiais/kit-divulgacao-natal/post-feed-sabores.pdf")

    # Exportar PNGs sem recortes diretamente dos PDFs finais via PDFKit
    _render_pdf_to_png(OUT / "materiais/kit-divulgacao-natal/card-whatsapp-abertura.pdf", OUT / "imagens/card-whatsapp-abertura.png", target_width_px=1080)
    _render_pdf_to_png(OUT / "materiais/kit-divulgacao-natal/post-feed-sabores.pdf", OUT / "imagens/post-feed-sabores.png", target_width_px=1080)
    _render_pdf_to_png(OUT / "materiais/catalogo-natal-personalizavel.pdf", OUT / "imagens/menu-natal-3-produtos.png", target_width_px=1190)

    # ------------------------------------------------------------------
    # 6. EDITÁVEIS (.csv e .html) EM produto-digital/editaveis/
    # ------------------------------------------------------------------
    edit_dir = OUT / "editaveis"
    edit_dir.mkdir(parents=True, exist_ok=True)
    editables = [
        SRC / "04-bonus-lista-compras/lista-compras-editavel-10-30-50.csv",
        SRC / "05-bonus-caderno-encomendas/caderno-encomendas-editavel.csv",
        SRC / "06-bonus-guia-fornecedores/comparador-fornecedores-editavel.csv",
        SRC / "09-extras-praticos/calculadora-custos-e-precos-editavel.csv",
        SRC / "09-extras-praticos/calendario-producao-entregas-editavel.csv",
        tpl_menu,
        tpl_story,
        tpl_feed,
        tpl_labels,
    ]
    for src_f in editables:
        shutil.copy2(src_f, edit_dir / src_f.name)

    print("Compilação editorial completa concluída em:", OUT, flush=True)


if __name__ == "__main__":
    main()
