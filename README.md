# Cocoon · mini-site Portes ouvertes CPNV

Site statique (HTML/CSS/JS, aucune compilation). Déploiement Vercel : importer le dossier, preset « Other », pas de commande de build.

## Modifier
- **Équipe** : dans `index.html`, section `ÉQUIPE` — nom (`<h3>`), rôle principal (`.member__role`) et autres fonctions (`<p>`).
- **Date du timer** : en haut de `main.js` (`EVENT_START`, actuellement 28.11.2026 à 9h00).
- **Boulette 3D** : `boulette3d.js` (three.js chargé depuis jsDelivr). Si la 3D ne charge pas, la photo `assets/boulette.webp` s'affiche à la place.
