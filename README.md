# Purchase Guardian

**V1.3 France Receipt Engine** — prototype mobile-first pensé pour être testé sur iPhone via Safari / PWA.

## Concept

Purchase Guardian aide à éviter de perdre de l'argent après un achat :

- conservation de la preuve d'achat ;
- suivi des délais de retour ;
- suivi des remboursements ;
- suivi des garanties ;
- indicateur **Money Protected** ;
- scan de tickets et extraction automatique d'informations.

## Offre de lancement envisagée

Prix fondateur prévu : **9,99 € pendant 14 jours** après le lancement public.

## V1.3

### France Receipt Engine

Le moteur OCR tente maintenant d'extraire :

- l'enseigne ;
- le montant total ;
- la date d'achat ;
- le canal probable (en ligne / magasin) ;
- un niveau de confiance.

Le moteur reconnaît notamment des enseignes courantes comme Fnac, Darty, Boulanger, Amazon.fr, Cdiscount, Carrefour, E.Leclerc, Auchan, Intermarché, Lidl, Aldi, Decathlon, IKEA, Leroy Merlin, Castorama, Sephora, Zara, H&M, Apple, Samsung, Micromania et d'autres.

### Photos de reçus

- prise de photo depuis l'iPhone ;
- import depuis la photothèque ;
- compression et prétraitement local de l'image ;
- OCR avec Tesseract.js ;
- stockage de la photo dans **IndexedDB** plutôt que dans localStorage ;
- prévisualisation du reçu depuis la fiche achat.

### Échéances

La V1.3 peut proposer une estimation à partir de :

- la date d'achat ;
- la date de livraison ;
- le canal d'achat ;
- un délai de retour indiqué par le commerçant ;
- une durée de garantie renseignée.

Les estimations sont volontairement présentées comme **indicatives** : les règles applicables dépendent du produit, du canal de vente, du vendeur et de la situation. L'utilisateur doit vérifier les conditions réelles avant d'agir.

### Autres fonctions

- ajout / modification / suppression d'achats ;
- filtres retours / remboursements / garanties ;
- remboursement reçu → ajout automatique dans **Money Protected** ;
- stockage local des métadonnées ;
- cache PWA ;
- interface adaptée aux safe areas iPhone.

## Structure

- `index.html` — interface ;
- `styles.css` — design mobile ;
- `app.js` — logique de l'application et stockage ;
- `receipt-engine.js` — analyse des tickets français ;
- `service-worker.js` — cache PWA ;
- `manifest.json` — configuration PWA ;
- `icon.svg` — icône provisoire.

## Tester sur iPhone

Une fois le site publié en HTTPS :

1. ouvrir le site dans Safari ;
2. toucher **Partager** ;
3. choisir **Ajouter à l'écran d'accueil** ;
4. ouvrir Purchase Guardian depuis l'icône ;
5. tester un vrai ticket avec **Scanner un ticket**.

Le premier OCR nécessite une connexion pour charger le moteur et les données linguistiques. Les analyses suivantes peuvent profiter du cache navigateur.

## Limites actuelles

- l'OCR peut confondre certains montants ou dates ;
- le nom précis du produit doit encore souvent être corrigé manuellement ;
- aucune synchronisation cloud ou compte utilisateur ;
- aucune notification push distante ;
- aucune connexion automatique à une boîte mail ;
- aucune règle commerciale par enseigne n'est considérée comme garantie juridiquement.

## Prochaine étape possible

**V1.4 — Merchant Profiles & Smart Returns** : profils par enseigne, meilleur choix du vrai total, import de factures numériques, notifications locales et suivi retour → colis → remboursement.

## Statut

Prototype de validation. Pas encore une application de production.
