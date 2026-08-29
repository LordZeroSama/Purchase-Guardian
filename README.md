# Purchase Guardian

**V1.4 Product Scan** — prototype mobile-first pensé pour être testé sur iPhone via Safari / PWA.

## Concept

Purchase Guardian aide à éviter de perdre de l'argent après un achat :

- conservation de la preuve d'achat ;
- suivi des délais de retour ;
- suivi des remboursements ;
- suivi des garanties ;
- indicateur **Money Protected** ;
- scan de tickets et extraction automatique d'informations ;
- scan de codes-barres / QR des produits.

## Offre de lancement envisagée

Prix fondateur prévu : **9,99 € pendant 14 jours** après le lancement public.

## V1.4 — Product Scan

### Scanner code-barres / QR

Depuis l'iPhone, Purchase Guardian peut maintenant ouvrir la caméra arrière pour tenter de lire :

- EAN-13 ;
- EAN-8 ;
- UPC-A / UPC-E ;
- Code 128 ;
- Code 39 ;
- QR Code ;
- Data Matrix ;
- ITF.

Une image de la photothèque peut aussi être utilisée si la caméra ne lit pas correctement le code.

Pour les EAN/UPC, l'application tente ensuite une recherche dans plusieurs bases ouvertes : **Open Products Facts**, **Open Food Facts** et **Open Beauty Facts**. Si une référence est trouvée, le nom et la marque peuvent pré-remplir la fiche. Si elle n'est pas trouvée, le code est tout de même conservé et le nom du produit peut être saisi manuellement.

Les liens présents dans un QR ne sont jamais ouverts automatiquement : l'utilisateur doit explicitement toucher le bouton d'ouverture.

### Fiche produit

Chaque achat peut désormais conserver :

- nom du produit ;
- marque ;
- code produit / QR ;
- format du code ;
- source de l'identification ;
- magasin / site ;
- prix ;
- date d'achat / livraison ;
- retour ;
- garantie ;
- remboursement ;
- photo de la preuve d'achat.

## France Receipt Engine

Le moteur OCR tente d'extraire :

- l'enseigne ;
- le montant total ;
- la date d'achat ;
- le canal probable (en ligne / magasin) ;
- un niveau de confiance.

Le moteur reconnaît notamment Fnac, Darty, Boulanger, Amazon.fr, Cdiscount, Carrefour, E.Leclerc, Auchan, Intermarché, Lidl, Aldi, Decathlon, IKEA, Leroy Merlin, Castorama, Sephora, Zara, H&M, Apple, Samsung, Micromania et d'autres.

## Photos de reçus

- prise de photo depuis l'iPhone ;
- import depuis la photothèque ;
- compression et prétraitement local ;
- OCR avec Tesseract.js ;
- stockage dans IndexedDB ;
- prévisualisation depuis la fiche achat.

## Échéances

Les estimations de retour / garantie restent indicatives. Elles doivent être vérifiées avec les conditions du vendeur et les règles réellement applicables à l'achat.

## Structure

- `index.html` — interface ;
- `styles.css` — design mobile ;
- `barcode.css` — interface scanner produit ;
- `app.js` — logique et stockage ;
- `barcode-scanner.js` — codes-barres / QR + recherche produit ;
- `receipt-engine.js` — analyse des tickets français ;
- `service-worker.js` — cache PWA ;
- `manifest.json` — configuration PWA ;
- `icon.svg` — icône provisoire.

## Tester sur iPhone

1. ouvrir la version GitHub Pages dans Safari ;
2. si une ancienne version reste affichée, ouvrir `refresh.html` une fois ;
3. toucher **Scanner un produit** ;
4. autoriser la caméra ;
5. viser un code-barres ou QR ;
6. vérifier le résultat puis toucher **Utiliser ce code**.

Le scan caméra et les recherches produit nécessitent HTTPS. GitHub Pages convient pour les tests.

## Limites actuelles

- toutes les références commerciales ne sont pas présentes dans les bases ouvertes ;
- le nom du produit peut donc rester manuel ;
- l'OCR d'un ticket peut encore confondre certains montants ou dates ;
- aucune synchronisation cloud ou compte utilisateur ;
- aucune notification push distante ;
- aucune connexion automatique à une boîte mail.

## Prochaine étape possible

**V1.5 — Product Intelligence** : meilleur catalogue produit, historique des scans, association code-barres + ticket, détection des doublons et enrichissement des fiches.

## Statut

Prototype de validation. Pas encore une application de production.