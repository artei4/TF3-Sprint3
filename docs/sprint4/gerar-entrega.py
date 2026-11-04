"""Gera docs/sprint4/entrega.html a partir dos .md da entrega (metricas, sus, ajustes, checklist, retrospectiva, README).
Uso: python docs/sprint4/gerar-entrega.py  →  abrir entrega.html no Chrome  →  Ctrl+P  →  Salvar como PDF (margens: padrão, gráficos de fundo: ligado)."""
import html, re, subprocess, sys
from pathlib import Path

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]
S4 = ROOT / 'docs' / 'sprint4'
REPO = 'https://github.com/artei4/TF3-Sprint3'
DEPLOY = 'https://tf-3-sprint3.vercel.app'


def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', r'<a href="\2">\1</a>', t)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'\[(completar|preencher|link do Figma|inserir)[^\]]*\]', lambda m: '<mark>' + m.group(0) + '</mark>', t)
    return t


def md(text, shift=1):
    """Markdown mínimo: títulos, tabelas, listas, citações e parágrafos."""
    out, lines, i = [], text.splitlines(), 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1; continue
        if line.startswith('#'):
            level = min(len(line) - len(line.lstrip('#')) + shift, 6)
            out.append(f'<h{level}>{inline(line.lstrip("#").strip())}</h{level}>'); i += 1; continue
        if line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                if not re.match(r'^\|[\s|:-]+\|$', lines[i]):
                    rows.append([c.strip() for c in lines[i].strip().strip('|').split('|')])
                i += 1
            head, body = rows[0], rows[1:]
            out.append('<table><thead><tr>' + ''.join(f'<th>{inline(c)}</th>' for c in head) + '</tr></thead><tbody>' +
                       ''.join('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in r) + '</tr>' for r in body) + '</tbody></table>')
            continue
        if re.match(r'^(\s*[-*]|\d+\.)\s', line):
            tag = 'ol' if re.match(r'^\d+\.', line) else 'ul'
            items = []
            while i < len(lines) and re.match(r'^(\s*[-*]|\d+\.)\s', lines[i]):
                items.append(re.sub(r'^(\s*[-*]|\d+\.)\s', '', lines[i])); i += 1
            out.append(f'<{tag}>' + ''.join(f'<li>{inline(x)}</li>' for x in items) + f'</{tag}>'); continue
        if line.startswith('>'):
            out.append(f'<p class="note">{inline(line.lstrip("> "))}</p>'); i += 1; continue
        para = []
        while i < len(lines) and lines[i].strip() and not re.match(r'^(#|\||>|\s*[-*]\s|\d+\.\s)', lines[i]):
            para.append(lines[i]); i += 1
        out.append(f'<p>{inline(" ".join(para))}</p>')
    return '\n'.join(out)


def section_md(path, drop_title=True):
    text = (S4 / path).read_text(encoding='utf-8')
    if drop_title:
        text = re.sub(r'^# .*\n', '', text, count=1)
    return md(text, shift=2)


def readme_team():
    text = (ROOT / 'README.md').read_text(encoding='utf-8')
    block = text.split('## Equipe e contribuições (Sprint 4)')[1].split('\n## ')[0]
    return md(block, shift=2)


members = [l.split('. ', 1)[1].split(' — ') for l in (ROOT / 'integrantes.txt').read_text(encoding='utf-8').splitlines() if re.match(r'^\d+\.', l)]

graph = subprocess.run(['git', '-C', str(ROOT), 'log', '--graph', '--date=short', '--since=2026-10-15', '--format=%h %ad %an — %s', 'origin/main'],
                       capture_output=True, text=True, encoding='utf-8').stdout
graph = '\n'.join(l[:118] for l in graph.splitlines())

SCREENS = [
    ('01-login', 'Login (público)'),
    ('02-login-erro', 'Estado de erro: login com conta inexistente'),
    ('04-cadastro-erro-validacao', 'Estado de erro: validação do cadastro'),
    ('06-atleta-painel', 'Atleta: painel'),
    ('07-atleta-peneiras', 'Atleta: peneiras compatíveis'),
    ('08-atleta-inscricao-sucesso', 'Estado de sucesso: inscrição confirmada'),
    ('11-funcionario-painel', 'Funcionário: painel'),
    ('13-funcionario-atletas-vazio', 'Estado vazio: busca de atletas sem resultado'),
    ('15-funcionario-conversas-busca-vazia', 'Estado vazio: busca de conversas'),
    ('18-olheiro-vitrine', 'Olheiro de clube: vitrine'),
]
screens = ''.join(f'''
<section class="page shot">
  <h3>{t}</h3>
  <figure class="wide"><img src="prints/1366/{n}.png" alt="{t}, 1366 px"><figcaption>1366 px</figcaption></figure>
  <div class="pair">
    <figure><img src="prints/768/{n}.png" alt="{t}, 768 px"><figcaption>768 px</figcaption></figure>
    <figure><img src="prints/390/{n}.png" alt="{t}, 390 px"><figcaption>390 px</figcaption></figure>
  </div>
</section>''' for n, t in SCREENS)

FLOW = '''
<div class="flow">
  <div class="lane"><h4>Funcionário (Pelé Academia)</h4><ol>
    <li>Entra (conta criada por convite do administrador)</li><li>Cadastra o local e cria a peneira: data, horário, categoria, posições, vagas</li>
    <li>Vê os inscritos e abre o perfil do atleta</li><li>No dia: peneira ao vivo, chamada e nota rápida</li>
    <li>Registra a avaliação e conversa com o atleta</li><li>Se precisar, cancela a peneira com motivo</li></ol></div>
  <div class="lane"><h4>Atleta (Sub-7 a Sub-20)</h4><ol>
    <li>Cria a conta (menor de 18: autorização do responsável)</li><li>Monta o perfil: posição, perna, cidade, foto</li>
    <li>Vê as peneiras e se é compatível (posição e categoria)</li><li>Inscreve-se; o servidor confere vagas e status</li>
    <li>Recebe avisos, conversa com a equipe, vê o motivo se a peneira for cancelada</li><li>Pode ativar a vitrine para olheiros de clubes</li></ol></div>
  <div class="lane"><h4>Olheiro de clube (por convite)</h4><ol>
    <li>Entra pelo convite</li><li>Vê só atletas com a vitrine ativa (menores: com consentimento do responsável)</li>
    <li>Pede contato; a equipe da academia intermedeia (sem chat direto)</li></ol></div>
</div>'''

doc = f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Entrega Sprint 4 · Pelé Academia · TIER-ZERO</title>
<style>
@page {{ size: A4; margin: 14mm 14mm 16mm; }}
:root {{ --ink:#10142A; --gold:#F2C23A; --soft:#4A5068; --line:#D9DCE6; }}
* {{ box-sizing: border-box; }}
body {{ margin:0; font: 10.5pt/1.45 Archivo, "Segoe UI", Arial, sans-serif; color:var(--ink); background:#fff; }}
h1 {{ font-size:30pt; line-height:1.05; margin:0 0 6mm; }}
h2 {{ font-size:17pt; margin:0 0 4mm; padding-bottom:2mm; border-bottom:3px solid var(--gold); break-after:avoid; }}
h3 {{ font-size:12.5pt; margin:5mm 0 2mm; break-after:avoid; }}
h4 {{ font-size:11pt; margin:4mm 0 1.5mm; break-after:avoid; }}
a {{ color:#1C3FAA; }}
code {{ font: 9pt Consolas, monospace; background:#F1F2F6; padding:0 2px; border-radius:2px; overflow-wrap:anywhere; }}
mark {{ background:#FFF1B8; padding:0 2px; }}
table {{ width:100%; border-collapse:collapse; margin:2mm 0 4mm; font-size:9pt; break-inside:auto; }}
th, td {{ border:1px solid var(--line); padding:1.3mm 1.8mm; text-align:left; vertical-align:top; overflow-wrap:break-word; }}
td:first-child {{ min-width:26mm; }}
th {{ background:#F6F3E6; }}
tr {{ break-inside:avoid; }}
.page {{ break-before:page; }}
.cover {{ height:265mm; display:flex; flex-direction:column; justify-content:space-between; padding:16mm 10mm; background:var(--gold); }}
.cover .kicker {{ font-weight:700; letter-spacing:.08em; text-transform:uppercase; }}
.cover table {{ font-size:11pt; background:#fff; }}
.pending {{ border:2px dashed #C99A2E; background:#FFFBEA; padding:3mm 4mm; margin:3mm 0; }}
.note {{ color:var(--soft); font-size:9.5pt; }}
.links li {{ margin-bottom:1.5mm; }}
.flow {{ display:grid; grid-template-columns:repeat(3, 1fr); gap:4mm; break-inside:avoid; }}
.lane {{ border:1px solid var(--line); border-top:4px solid var(--gold); padding:2mm 3mm; }}
.lane ol {{ padding-left:5mm; margin:0; }} .lane li {{ margin-bottom:1.5mm; }}
.shot figure {{ margin:0; }} .shot img {{ display:block; border:1px solid var(--line); }}
.shot .wide img {{ width:100%; }}
.shot .pair {{ display:flex; gap:5mm; margin-top:4mm; align-items:flex-start; }}
.shot .pair img {{ height:118mm; width:auto; }}
figcaption {{ font-size:8.5pt; color:var(--soft); margin-top:1mm; }}
.lh {{ display:grid; gap:3mm; }} .lh img {{ width:100%; border:1px solid var(--line); }}
pre {{ font: 7.4pt/1.3 Consolas, monospace; white-space:pre-wrap; background:#F6F7FA; padding:3mm; border:1px solid var(--line); }}
.gh img {{ width:100%; border:1px solid var(--line); }}
@media screen {{ body {{ max-width:210mm; margin:0 auto; padding:10mm; background:#EEE; }} .page, .cover {{ background-clip:padding-box; }} }}
</style></head><body>

<section class="cover">
  <div><p class="kicker">FIAP · Front-End Design · Sprint 4 · 2026</p>
  <h1>Pelé Academia<br>TIER ZERO</h1>
  <p style="font-size:13pt;max-width:120mm">Plataforma que conecta atletas de base (Sub-7 a Sub-20) às peneiras da Pelé Academia. MVP funcional.</p></div>
  <div><p class="kicker">Equipe TIER-ZERO · Turma 1ESSRA</p>
  <table><thead><tr><th>Integrante</th><th>RM</th></tr></thead><tbody>
  {''.join(f'<tr><td>{html.escape(n)}</td><td>{html.escape(rm)}</td></tr>' for n, rm in members)}
  </tbody></table></div>
</section>

<section class="page">
<h2>1. Links</h2>
<ul class="links">
<li><strong>Deploy (produção):</strong> <a href="{DEPLOY}">{DEPLOY}</a></li>
<li><strong>Styleguide vivo:</strong> <a href="{DEPLOY}/design-system">{DEPLOY}/design-system</a></li>
<li><strong>Repositório público:</strong> <a href="{REPO}">{REPO}</a> · Pull requests: <a href="{REPO}/pulls?q=is%3Apr">{REPO}/pulls</a></li>
<li><strong>Figma:</strong> <mark>[inserir link do Figma]</mark></li>
<li><strong>Vídeo demonstrativo:</strong> <a href="https://youtu.be/R5p4qm1ZnNw">https://youtu.be/R5p4qm1ZnNw</a></li>
</ul>

<h2 style="margin-top:8mm">2. Escopo e modelo de MVP: funcional</h2>
<p>O fluxo principal roda de ponta a ponta com back-end real no Supabase (Postgres, Auth e regras RLS). Não há etapa manual da equipe por trás da tela: o que a interface promete, o servidor executa.</p>
<ul>
<li><strong>Peneiras e inscrições no servidor.</strong> O banco recusa a inscrição sem vaga, em peneira cancelada e de menor sem autorização do responsável.</li>
<li><strong>Acesso por papel, verificado no banco.</strong> Funcionário entra só por convite (link de uso único, 7 dias, preso ao e-mail); administrador é checado por <code>is_admin()</code>. Olheiro de clube também entra por convite e vê só a vitrine.</li>
<li><strong>Conversas e avisos</strong> no servidor (sem Realtime, para não gerar custo: a tela consulta a cada 8 s enquanto está visível). Avisos são criados por gatilhos do banco e chegam em qualquer aparelho.</li>
<li><strong>Honestidade dos dados.</strong> Sem votos nem curtidas: a nota vem só das avaliações da equipe. Perfis de exemplo aparecem marcados como exemplo. O botão de demonstração do login entra em modo local, identificado na tela, sem gravar nada no servidor.</li>
<li><strong>Estados reais</strong> em cada tela do fluxo: carregando (skeleton), vazio (com a próxima ação), erro (mensagem e "Tentar de novo") e sucesso (toast e estado confirmado no card).</li>
</ul>
<p><strong>Stack:</strong> Vite 8 · Tailwind CSS 4 com os tokens da Sprint 1 em <code>@theme</code> · JavaScript puro (ES Modules) · Supabase. Deploy na Vercel a cada merge na <code>main</code>.</p>

</section>
<section class="page">
<h2>3. Mapa dos fluxos</h2>
{FLOW}
<h3>Caminho principal (MVP)</h3>
<p>Funcionário cria a peneira → atleta compatível se inscreve (servidor confere vagas) → funcionário vê os inscritos → peneira ao vivo com chamada → avaliação registrada → conversa com o atleta. Se a peneira for cancelada, o inscrito vê o motivo na própria tela.</p>

<h2 style="margin-top:10mm">4. Telas nos 3 breakpoints</h2>
<p>Prints tirados em produção em 03/11/2026, a 1366, 768 e 390 px, nas páginas seguintes. As 54 telas (18 por largura, incluindo cadastro, perfil, conversas, peneiras do funcionário e equipe) estão em <code>docs/sprint4/prints/</code>. O estado de carregamento (skeleton) aparece no styleguide: <a href="{DEPLOY}/design-system">/design-system</a>.</p>
</section>

{screens}

<section class="page">
<h2>5. Relatório de testes com usuários</h2>
{section_md('metricas.md')}
</section>

<section class="page">
<h2>6. Melhorias a partir da validação</h2>
{section_md('ajustes.md')}
</section>

<section class="page">
<h2>7. Acessibilidade e performance</h2>
<h3>Lighthouse em produção (03/11/2026)</h3>
<div class="lh">
<figure style="margin:0"><img src="lighthouse/producao-mobile.png" alt="Lighthouse celular: Performance 85, Acessibilidade 100, Boas práticas 100, SEO 100"><figcaption>Celular: Performance 85 · Acessibilidade 100 · Boas práticas 100 · SEO 100</figcaption></figure>
<figure style="margin:0"><img src="lighthouse/producao-desktop.png" alt="Lighthouse desktop: Performance 96, Acessibilidade 100, Boas práticas 100, SEO 100"><figcaption>Desktop: Performance 96 · Acessibilidade 100 · Boas práticas 100 · SEO 100</figcaption></figure>
</div>
<p class="note">Relatórios completos: <code>docs/sprint4/lighthouse/producao-mobile.report.html</code> e <code>producao-desktop.report.html</code>. Console de produção sem erros nem recursos 404 nas telas dos três papéis.</p>
<h3>Checklist WCAG 2.1 AA</h3>
{section_md('checklist-wcag.md')}
</section>

<section class="page">
<h2>8. Colaboração</h2>
{readme_team()}
<h3>Pull requests</h3>
<figure class="gh" style="margin:0"><img src="prints/github-prs.png" alt="Lista de pull requests do repositório"><figcaption>Lista de PRs em {REPO}/pulls</figcaption></figure>
<h3>Grafo de commits da Sprint 4 (main)</h3>
<pre>{html.escape(graph)}</pre>
</section>

<section class="page">
<h2>9. Retrospectiva</h2>
{section_md('retrospectiva.md')}
</section>

<section class="page">
<h2>10. Vídeo demonstrativo</h2>
<p><a href="https://youtu.be/R5p4qm1ZnNw">https://youtu.be/R5p4qm1ZnNw</a> ("sprint 4 demonstração mvp")</p>
</section>
</body></html>
'''
(S4 / 'entrega.html').write_text(doc, encoding='utf-8')
print('ok', len(doc))
