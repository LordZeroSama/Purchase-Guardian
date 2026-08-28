# Purchase Guardian

**V1.2 mobile-first** de Purchase Guardian, pensée pour un test sur iPhone via Safari / PWA.

## Concept

Purchase Guardian aide à éviter de perdre de l'argent après un achat :

- suivi des délais de retour ;
- suivi des remboursements ;
- suivi des garanties ;
- conservation des preuves d'achat ;
- indicateur **Money Protected**.

## Offre de lancement

Prix fondateur prévu : **9,99 € pendant 14 jours** après le lancement.

## V1.2

- ajout, modification et suppression d'achats ;
- stockage local via `localStorage` ;
- dashboard dynamique ;
- filtres retours / remboursements / garanties ;
- suivi des remboursements et calcul Money Protected ;
- capture photo réelle sur iPhone via `input capture=environment` ;
- import d'une photo depuis la photothèque ;
- compression locale de l'image avant analyse ;
- OCR réel dans le navigateur avec Tesseract.js ;
- pré-remplissage automatique du magasin, du prix et de la date quand ils sont détectés ;
- vérification manuelle avant enregistrement ;
- service worker et cache PWA de base ;
- safe areas iPhone.

## Important sur l'OCR

L'OCR de cette V1.2 est une première implémentation. Il fonctionne côté navigateur avec Tesseract.js. Le script et les modèles OCR nécessitent une connexion Internet au premier chargement. Les tickets réels peuvent varier fortement : l'utilisateur doit toujours vérifier les champs détectés avant d'enregistrer.

Les images ne sont pas envoyées à un backend Purchase Guardian dans cette V1.2. L'objectif est de valider l'expérience avant de construire une infrastructure serveur.

## Tester sur iPhone

Une fois le site publié en HTTPS :

1. ouvrir le site dans Safari ;
2. toucher **Partager** ;
3. choisir **Ajouter à l'écran d'accueil** ;
4. ouvrir Purchase Guardian ;
5. choisir **Scanner un reçu** ;
6. prendre une photo du ticket ou choisir une photo existante ;
7. lancer l'analyse puis vérifier les champs détectés.

## Roadmap

### V1.3
- meilleure détection des totaux et enseignes françaises ;
- calcul assisté des deadlines de retour ;
- photo du justificatif associée à l'achat ;
- recherche et tri ;
- sauvegarde IndexedDB au lieu de localStorage pour les fichiers ;
- amélioration du fonctionnement hors ligne.

### Ensuite
- notifications ;
- import email / facture ;
- Refund Watchdog ;
- assistant de réclamation ;
- suivi de baisse de prix ;
- module essais / abonnements.

## Statut

Prototype de validation. **Pas encore une application de production ni un conseiller juridique sur les droits de retour ou de garantie.**
