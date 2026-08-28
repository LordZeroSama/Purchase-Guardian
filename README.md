# Purchase Guardian

Prototype **V1.1 mobile-first** de Purchase Guardian, pensé pour être testé sur iPhone.

## Concept

Purchase Guardian aide à éviter de perdre de l'argent après un achat :

- suivi des délais de retour ;
- suivi des remboursements ;
- suivi des garanties ;
- conservation logique des achats ;
- indicateur **Money Protected**.

## Offre de lancement

Prix fondateur prévu : **9,99 € pendant 14 jours** après le lancement.

## V1.1

Cette version est maintenant interactive :

- stockage local réel via `localStorage` ;
- ajout d'achats ;
- modification et suppression ;
- statuts : à surveiller, retour possible, remboursement, garantie active, terminé ;
- dates de retour et garantie ;
- suivi d'un remboursement ;
- calcul dynamique de **Money Protected** ;
- filtres d'achats ;
- onglets Accueil / Achats / Ajouter / Garanties ;
- scan OCR simulé pour tester le parcours ;
- safe areas iPhone ;
- PWA standalone ;
- service worker avec cache hors ligne basique.

## Tester sur iPhone

Une fois GitHub Pages activé :

1. ouvrir l'URL GitHub Pages dans Safari ;
2. toucher **Partager** ;
3. choisir **Ajouter à l'écran d'accueil**.

Les achats créés dans cette V1.1 sont stockés uniquement dans le navigateur de l'appareil utilisé.

## Limites actuelles

- pas encore de backend ni de compte utilisateur ;
- pas de synchronisation entre appareils ;
- OCR/caméra encore simulés ;
- pas encore de notifications push réelles ;
- pas encore de règles automatiques par enseigne ;
- pas encore de paiement intégré.

## Prochaines étapes

- scan photo réel ;
- OCR réel ;
- ajout de photo de facture ;
- notifications de deadlines ;
- import e-mail ;
- règles France pour retours/garanties avec niveau de confiance ;
- synchronisation cloud ;
- icônes PWA ;
- module Trial / Subscription Guardian après validation du cœur produit.

## Statut

**V1.1 — prototype fonctionnel de validation, pas encore une application de production.**
