# CrudeVol Surface

Application pédagogique permettant d’explorer la volatilité du Brent et du WTI, avec un historique réel de long terme et une surface implicite illustrative.

## Fonctionnalités

- surface de volatilité sous forme de heatmap et de vue 3D ;
- smile et structure par maturité ;
- comparaison Brent–WTI ;
- scanner de relative value ;
- recalibrage interactif ;
- définitions contextuelles et lexique accessible.
- historique quotidien EIA/FRED depuis 1986 (WTI) et 1987 (Brent) ;
- prévision HAR de la volatilité réalisée à cinq jours ;
- validation hors échantillon depuis 2021, comparée à un repère naïf ;
- intervalle d’incertitude à 80 %.

## Données et limites

Le module « Historique réel » repose sur les séries publiques quotidiennes [WTI DCOILWTICO](https://fred.stlouisfed.org/series/DCOILWTICO) et [Brent DCOILBRENTEU](https://fred.stlouisfed.org/series/DCOILBRENTEU), publiées par l’EIA via FRED.

Le modèle prévoit la **volatilité réalisée**, c’est-à-dire le mouvement qui sera ensuite observé dans les prix. Les écrans de surface implicite restent illustratifs : une surface historique réellement négociable nécessite des chaînes d’options horodatées et sous licence CME/ICE. Le site ne constitue ni une recommandation d’investissement ni une source de prix exécutable.

## GitHub Pages

Le contenu de `dist` est publié sur GitHub Pages.
