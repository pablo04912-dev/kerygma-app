"""Contrôle qualité du prototype (à lancer à la main, pas dans la CI).

Parcourt tous les écrans des 3 profils sur un petit téléphone (320 px), un téléphone courant (390 px)
et un ordinateur (1280 px), avec le texte normal, grand (x1,5) et très grand (x2), et signale :
éléments qui débordent de l'écran, boutons de moins de 44 px, textes coupés.

Prérequis : pip install playwright, et Chrome (ou `playwright install chromium`).
Usage : npm run build, puis python3 outils/controle_qualite.py site [échelle]
Résultat détaillé dans /tmp/audit.json.
"""
import asyncio, sys, json
from playwright.async_api import async_playwright

CHECK = r"""
(nom) => {
  const app = document.getElementById('app');
  const A = app.getBoundingClientRect();
  const out = [];
  const desc = el => {
    const t = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    return el.localName + (t ? ' « ' + t + ' »' : '');
  };
  const visible = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const dansDefilement = el => {
    for (let p = el.parentElement; p && p !== app; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && p.localName !== 'main') return true;
    }
    return false;
  };
  app.querySelectorAll('*').forEach(el => {
    if (!visible(el) || dansDefilement(el)) return;
    const r = el.getBoundingClientRect();
    if (r.right > A.right + 1 || r.left < A.left - 1) out.push(['déborde', desc(el), Math.round(r.right - A.right)]);
    const cs = getComputedStyle(el);
    if (el.children.length === 0 && el.textContent.trim() && el.scrollWidth > el.clientWidth + 1 && (cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis')) out.push(['texte coupé', desc(el), el.scrollWidth - el.clientWidth]);
  });
  app.querySelectorAll('button, a, input, textarea, [role=checkbox], [role=switch]').forEach(el => {
    if (!visible(el)) return;
    const r = el.getBoundingClientRect();
    if (r.height < 43.5 || r.width < 43.5) out.push(['cible petite', desc(el), Math.round(r.width) + '×' + Math.round(r.height)]);
  });
  // texte qui dépasse de son bouton (hauteur fixe)
  app.querySelectorAll('button, span').forEach(el => {
    if (!visible(el)) return;
    if (el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflow === 'hidden' && el.clientHeight > 0) out.push(['texte coupé (hauteur)', desc(el), el.scrollHeight - el.clientHeight]);
  });
  const vus = new Set();
  return out.filter(o => { const k = o.join('|'); if (vus.has(k)) return false; vus.add(k); return true; }).map(o => [nom].concat(o));
}
"""

async def parcours(pg, site, check):
    async def go(f):
        await pg.goto('file://' + site + '/' + f); await pg.wait_for_timeout(300)
        await pg.evaluate("s => { document.documentElement.style.fontSize = s }", ECHELLE)
        await pg.wait_for_timeout(100)
    async def clic(sel):
        await pg.click(sel, timeout=3000); await pg.wait_for_timeout(120)
    async def nav(nom): await clic('nav[aria-label="Navigation principale"] button:has-text("%s")' % nom)
    # Accueil
    await go('index.html'); await check('accueil')
    await pg.wait_for_timeout(900); await check('accueil · fenêtre connexion')
    await clic('[role=dialog] button:has-text("Créer un compte")'); await check('accueil · créer un compte')
    # Hélène
    await go('responsable.html'); await check('Hélène · 3 lieux')
    await clic('button[aria-label="Voir le mois"]'); await check('Hélène · calendrier du mois')
    await go('responsable.html')
    await clic('section[aria-label="Comptes rendus"] button >> nth=1'); await check('Hélène · compte rendu lu')
    await go('responsable.html')
    await clic('main > button >> nth=0'); await check('Hélène · détail Saint-Maurice')
    await clic('section[aria-label="Postes"] button:has-text("Choisir") >> nth=0'); await check('Hélène · feuille Choisir')
    await clic('[role=dialog] button:has-text("Fermer")')
    await clic('nav[aria-label="Dates"] button >> nth=1'); await check('Hélène · 29 nov')
    await go('responsable.html'); await clic('button:has-text("Programme du culte")'); await clic('main > button >> nth=0'); await check('Hélène · programme')
    await go('responsable.html'); await clic('button:has-text("Réunion de prière")'); await check('Hélène · prière'); await clic('main > button >> nth=0'); await check('Hélène · prière détail')
    await go('responsable.html')
    for n in ['Équipe', 'Actus', 'Moi']: await nav(n); await check('Hélène · ' + n)
    await nav('Équipe'); await clic("button:has-text(\"Toute l'équipe\")"); await check('Hélène · toute l’équipe')
    # Thomas
    await go('coordinateur.html'); await check('Thomas · planning')
    await clic('section[aria-label="Postes"] button:has-text("Choisir") >> nth=0'); await check('Thomas · feuille Choisir')
    await clic('[role=dialog] button:has-text("Fermer")')
    await clic('button[aria-label^="Ajouter une tâche"] >> nth=0'); await check('Thomas · feuille tâche')
    await clic('[role=dialog][aria-label="Ajouter une tâche"] button:has-text("Autre tâche")'); await check('Thomas · tâche libre')
    await clic('[role=dialog][aria-label="Ajouter une tâche"] button:has-text("Fermer")')
    await clic('button[aria-label="Voir le mois"]'); await check('Thomas · calendrier du mois')
    await clic('section[aria-label="Calendrier du mois"] button:has-text("Réduire")')
    await clic('text=Remplir le compte rendu'); await check('Thomas · compte rendu')
    await clic('[role=switch]'); await check('Thomas · compte rendu, très bon service')
    await clic('text=Envoyer le compte rendu à Hélène'); await check('Thomas · après compte rendu')
    await nav('Équipe'); await check('Thomas · équipe'); await clic('text=Lancer la collecte'); await check('Thomas · collecte lancée')
    await nav('Moi'); await check('Thomas · moi')
    # Lucas
    await go('serviteur.html'); await check('Lucas · accueil')
    await clic('button[aria-label="Voir le mois"]'); await check('Lucas · calendrier du mois')
    await clic('section[aria-label="Calendrier du mois"] button[aria-label^="Dimanche 29 novembre"]'); await check('Lucas · service avec tâche')
    await go('serviteur.html')
    await clic('[data-demande="06/12|cha|gac"] button:has-text("Pas dispo")'); await check('Lucas · feuille remplaçant')
    await clic('[role=dialog] button:has-text("Demander") >> nth=0')
    await clic('button:has-text("Garder les deux") >> nth=0'); await check('Lucas · garder les deux')
    await clic('[role=dialog] button:has-text("Fermer")')
    await clic('section[aria-label="Mes services"] button >> nth=0'); await check('Lucas · qui sert ce culte')
    await go('serviteur.html'); await clic('text=Remplir mes dispos'); await check('Lucas · grille des dispos')
    for n in ['Équipe', 'Actus', 'Moi']: await nav(n); await check('Lucas · ' + n)

ECHELLE = '106.25%'
async def main():
    import os
    site = os.path.abspath(sys.argv[1])
    configs = [(w, h, e) for (w, h) in [(320, 640), (390, 844), (1280, 800)] for e in ['106.25%', '159.375%', '212.5%']]
    if len(sys.argv) > 2: configs = [c for c in configs if c[2] == sys.argv[2]]
    tous = {}
    async with async_playwright() as p:
        import os
        chrome = '/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else None
        b = await p.chromium.launch(executable_path=chrome, args=['--no-sandbox'])
        for (w, h, e) in configs:
            global ECHELLE
            ECHELLE = e
            pg = await b.new_page(viewport={'width': w, 'height': h})
            errs = []
            pg.on('pageerror', lambda x: errs.append(str(x)))
            res = []
            async def check(nom):
                res.extend(await pg.evaluate(CHECK, nom))
            try:
                await parcours(pg, site, check)
            except Exception as ex:
                res.append(['PARCOURS', 'arrêté', str(ex)[:150], ''])
            tous['%dx%d @%s' % (w, h, e)] = {'problemes': res, 'erreurs': errs}
            await pg.close()
        await b.close()
    json.dump(tous, open('/tmp/audit.json', 'w'), ensure_ascii=False, indent=1)
    for k, v in tous.items():
        print('==', k, len(v['problemes']), 'problèmes', ('ERREURS JS ' + str(v['erreurs'])) if v['erreurs'] else '')
asyncio.run(main())
