"""Construit le prototype à partir des sources.

Produit :
  build/Accueil.dc.html, build/Planning.dc.html (Hélène, responsable), build/Coordinateur.dc.html (Thomas)
  et build/Serviteur.dc.html (Lucas) : les écrans au format du canevas Claude Design
  site/index.html : la version téléphone (mise en ligne sur GitHub Pages)

Usage : python3 outils/build.py
"""
import json
import os
import re

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def lire(chemin):
    with open(os.path.join(RACINE, chemin), encoding="utf-8") as f:
        return f.read()


def ecrire(chemin, texte):
    complet = os.path.join(RACINE, chemin)
    os.makedirs(os.path.dirname(complet), exist_ok=True)
    with open(complet, "w", encoding="utf-8") as f:
        f.write(texte)


def ecran_dc(source):
    """Découpe un écran .dc.html en (gabarit sans helmet, script logique)."""
    gabarit = re.search(r"<x-dc>(.*?)</x-dc>", source, re.S).group(1)
    gabarit = re.sub(r"<helmet>.*?</helmet>", "", gabarit, flags=re.S).strip()
    if gabarit.count("width: 390px; height: 844px;") != 1:
        raise SystemExit("racine de l'écran introuvable")
    gabarit = gabarit.replace("width: 390px; height: 844px;", "width: 100%; height: 100%;")
    script = re.search(r'<script type="text/x-dc" data-dc-script[^>]*>(.*?)</script>', source, re.S).group(1)
    if "</script" in script or "</template" in gabarit:
        raise SystemExit("balise interdite dans un écran")
    return gabarit, script


def main():
    donnees = json.loads(lire("data/exemple.json"))
    accueil = lire("src/accueil.dc.html")
    json_donnees = json.dumps(donnees, ensure_ascii=False, separators=(",", ":"))
    planning = lire("src/planning.template.html")
    serviteur = lire("src/serviteur.template.html")
    for nom, texte in (("planning", planning), ("serviteur", serviteur)):
        if texte.count("__DATA__") != 1:
            raise SystemExit("__DATA__ doit apparaître une fois dans src/" + nom + ".template.html")
    if planning.count("__PROFIL__") != 1:
        raise SystemExit("__PROFIL__ doit apparaître une fois dans src/planning.template.html")
    planning = planning.replace("__DATA__", json_donnees)
    serviteur = serviteur.replace("__DATA__", json_donnees)
    responsable = planning.replace("__PROFIL__", "responsable")
    coordinateur = planning.replace("__PROFIL__", "coordinateur").replace("prototype responsable</title>", "prototype coordinateur</title>")
    ecrire("build/Accueil.dc.html", accueil)
    ecrire("build/Planning.dc.html", responsable)
    ecrire("build/Coordinateur.dc.html", coordinateur)
    ecrire("build/Serviteur.dc.html", serviteur)

    a_gab, a_js = ecran_dc(accueil)
    p_gab, p_js = ecran_dc(responsable)
    s_gab, s_js = ecran_dc(serviteur)
    moteur = lire("src/runtime.js").replace(
        "/*__COMPONENTS__*/",
        "const AccueilComponent = (function () {\n" + a_js + "\nreturn Component;\n})();\n"
        "const PlanningComponent = (function () {\n" + p_js + "\nreturn Component;\n})();\n"
        "const ServiteurComponent = (function () {\n" + s_js + "\nreturn Component;\n})();\n",
    )
    page = lire("src/page.html")
    page = (page.replace("<!--ACCUEIL-->", a_gab).replace("<!--PLANNING-->", p_gab)
            .replace("<!--SERVITEUR-->", s_gab).replace("/*MOTEUR*/", moteur))
    ecrire("site/index.html", page)
    print("build/ et site/index.html à jour")


if __name__ == "__main__":
    main()
