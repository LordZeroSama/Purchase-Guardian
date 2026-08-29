let barcodeScanner=null;
let barcodeCameraRunning=false;
let barcodeLastResult=null;

function barcodeEl(id){return document.getElementById(id)}

function barcodeFormatLabel(format){
  const map={QR_CODE:'QR',EAN_13:'EAN-13',EAN_8:'EAN-8',UPC_A:'UPC-A',UPC_E:'UPC-E',CODE_128:'Code 128',CODE_39:'Code 39',DATA_MATRIX:'Data Matrix',ITF:'ITF'};
  return map[format]||String(format||'Code');
}

function isProductBarcode(code,format){
  const value=String(code||'').replace(/\s/g,'');
  return /^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(value)||['EAN_13','EAN_8','UPC_A','UPC_E'].includes(format);
}

function scannerFormats(){
  if(!window.Html5QrcodeSupportedFormats)return undefined;
  const F=window.Html5QrcodeSupportedFormats;
  return [F.QR_CODE,F.EAN_13,F.EAN_8,F.UPC_A,F.UPC_E,F.CODE_128,F.CODE_39,F.DATA_MATRIX,F.ITF].filter(v=>v!==undefined);
}

function ensureBarcodeScanner(){
  if(!window.Html5Qrcode)throw new Error('Moteur scanner indisponible');
  if(!barcodeScanner)barcodeScanner=new Html5Qrcode('barcodeReader',{formatsToSupport:scannerFormats(),verbose:false});
  return barcodeScanner;
}

function openBarcodeScanner(){
  barcodeLastResult=null;
  const wrap=barcodeEl('barcodeWrap');
  if(!wrap)return;
  wrap.style.display='flex';
  barcodeEl('barcodeResult').style.display='none';
  barcodeEl('barcodeUseBtn').style.display='none';
  barcodeEl('barcodeOpenBtn').style.display='none';
  barcodeEl('barcodeStatus').textContent='Place le code dans le cadre puis lance la caméra.';
  barcodeEl('barcodePhotoInput').value='';
}

async function closeBarcodeScanner(){
  await stopBarcodeCamera();
  const wrap=barcodeEl('barcodeWrap');
  if(wrap)wrap.style.display='none';
}

async function startBarcodeCamera(){
  try{
    const scanner=ensureBarcodeScanner();
    if(barcodeCameraRunning)return;
    barcodeEl('barcodeStatus').textContent='Autorise la caméra puis vise le code-barres ou QR.';
    await scanner.start(
      {facingMode:'environment'},
      {fps:10,qrbox:{width:280,height:170},aspectRatio:1.65,disableFlip:false},
      decodedText=>handleBarcodeDecoded(decodedText,null),
      ()=>{}
    );
    barcodeCameraRunning=true;
    barcodeEl('barcodeStartBtn').style.display='none';
    barcodeEl('barcodeStopBtn').style.display='block';
    barcodeEl('barcodeStatus').textContent='Scan en cours… rapproche ou éloigne doucement le téléphone.';
  }catch(error){
    console.error(error);
    barcodeEl('barcodeStatus').textContent='Impossible d’ouvrir la caméra. Tu peux scanner depuis une photo.';
    if(typeof showToast==='function')showToast('Caméra indisponible ou permission refusée');
  }
}

async function stopBarcodeCamera(){
  if(!barcodeScanner)return;
  try{if(barcodeCameraRunning)await barcodeScanner.stop()}catch(e){}
  try{await barcodeScanner.clear()}catch(e){}
  barcodeScanner=null;
  barcodeCameraRunning=false;
  const start=barcodeEl('barcodeStartBtn'),stop=barcodeEl('barcodeStopBtn');
  if(start)start.style.display='block';
  if(stop)stop.style.display='none';
}

async function scanBarcodePhoto(file){
  if(!file)return;
  try{
    await stopBarcodeCamera();
    const scanner=ensureBarcodeScanner();
    barcodeEl('barcodeStatus').textContent='Analyse de la photo…';
    const decoded=await scanner.scanFile(file,true);
    await handleBarcodeDecoded(decoded,null);
  }catch(error){
    console.error(error);
    barcodeEl('barcodeStatus').textContent='Aucun code lisible trouvé. Essaie une photo plus nette et bien cadrée.';
    if(typeof showToast==='function')showToast('Code non détecté');
  }
}

async function handleBarcodeDecoded(text,format){
  const value=String(text||'').trim();
  if(!value)return;
  await stopBarcodeCamera();
  const guessedFormat=format||guessBarcodeFormat(value);
  barcodeLastResult={value,format:guessedFormat,product:null,lookupSource:null};
  renderBarcodeResult();
  barcodeEl('barcodeStatus').textContent='Code détecté ✓';
  if(isProductBarcode(value,guessedFormat)){
    barcodeEl('barcodeLookup').textContent='Recherche du produit…';
    const found=await lookupBarcodeProduct(value);
    if(found){
      barcodeLastResult.product=found;
      barcodeLastResult.lookupSource=found.source;
      barcodeEl('barcodeLookup').textContent=`Produit trouvé : ${found.name}${found.brand?` · ${found.brand}`:''}`;
    }else{
      barcodeEl('barcodeLookup').textContent='Produit non trouvé dans les bases ouvertes. Le code sera quand même enregistré.';
    }
    renderBarcodeResult();
  }
}

function guessBarcodeFormat(value){
  if(/^https?:\/\//i.test(value)||value.length>32||/[^0-9]/.test(value))return 'QR_CODE';
  if(/^\d{13}$/.test(value))return 'EAN_13';
  if(/^\d{12}$/.test(value))return 'UPC_A';
  if(/^\d{8}$/.test(value))return 'EAN_8';
  return 'CODE_128';
}

function renderBarcodeResult(){
  if(!barcodeLastResult)return;
  const r=barcodeLastResult;
  barcodeEl('barcodeValue').textContent=r.value;
  barcodeEl('barcodeFormat').textContent=barcodeFormatLabel(r.format);
  barcodeEl('barcodeResult').style.display='block';
  barcodeEl('barcodeUseBtn').style.display='block';
  const open=barcodeEl('barcodeOpenBtn');
  if(/^https?:\/\//i.test(r.value)){
    open.style.display='block';
    open.textContent='Ouvrir le lien QR';
  }else open.style.display='none';
}

async function fetchProductDB(base,code,source){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),5000);
  try{
    const response=await fetch(`${base}/api/v2/product/${encodeURIComponent(code)}.json`,{signal:ctrl.signal,cache:'no-store'});
    if(!response.ok)return null;
    const data=await response.json();
    if(data.status!==1||!data.product)return null;
    const p=data.product;
    const name=p.product_name_fr||p.product_name||p.generic_name_fr||p.generic_name||'';
    if(!name)return null;
    return {name:String(name).trim(),brand:String(p.brands||'').split(',')[0].trim(),source,image:p.image_front_small_url||p.image_url||''};
  }catch(e){return null}
  finally{clearTimeout(timer)}
}

async function lookupBarcodeProduct(code){
  const sources=[
    ['https://world.openproductsfacts.org','Open Products Facts'],
    ['https://world.openfoodfacts.org','Open Food Facts'],
    ['https://world.openbeautyfacts.org','Open Beauty Facts']
  ];
  for(const [base,name] of sources){
    const product=await fetchProductDB(base,code,name);
    if(product)return product;
  }
  return null;
}

function useBarcodeResult(){
  if(!barcodeLastResult)return;
  const r=barcodeLastResult;
  const current={
    product:r.product?.name||'Produit scanné',
    store:'',price:'',purchaseDate:new Date().toISOString().slice(0,10),channel:'unknown',deliveryDate:'',status:'watch',returnDate:'',warrantyDate:'',refundAmount:0,protectedAmount:0,
    barcode:r.value,barcodeFormat:r.format,barcodeSource:r.lookupSource||'',brand:r.product?.brand||''
  };
  closeBarcodeScanner();
  if(typeof openEditor==='function')openEditor(current);
  const hint=barcodeEl('barcodeHint');
  if(hint)hint.textContent=r.product?`Identifié via ${r.lookupSource}. Vérifie le nom du produit avant d’enregistrer.`:'Code enregistré. Complète le nom du produit si nécessaire.';
}

function scanBarcodeIntoCurrentPurchase(){
  openBarcodeScanner();
  window.__barcodeAttachMode=true;
}

const originalUseBarcodeResult=useBarcodeResult;
useBarcodeResult=function(){
  if(!barcodeLastResult)return;
  if(window.__barcodeAttachMode){
    const r=barcodeLastResult;
    window.__barcodeAttachMode=false;
    closeBarcodeScanner();
    if(barcodeEl('barcode'))barcodeEl('barcode').value=r.value;
    if(barcodeEl('barcodeFormatField'))barcodeEl('barcodeFormatField').value=r.format||'';
    if(barcodeEl('barcodeSource'))barcodeEl('barcodeSource').value=r.lookupSource||'';
    if(r.product?.name&&barcodeEl('product')&&!barcodeEl('product').value)barcodeEl('product').value=r.product.name;
    if(r.product?.brand&&barcodeEl('brand'))barcodeEl('brand').value=r.product.brand;
    if(typeof showToast==='function')showToast('Code rattaché à l’achat ✓');
    return;
  }
  return originalUseBarcodeResult();
};

function openDetectedQr(){
  if(!barcodeLastResult||!/^https?:\/\//i.test(barcodeLastResult.value))return;
  window.open(barcodeLastResult.value,'_blank','noopener,noreferrer');
}

window.addEventListener('DOMContentLoaded',()=>{
  const photo=barcodeEl('barcodePhotoInput');
  if(photo)photo.addEventListener('change',e=>scanBarcodePhoto(e.target.files?.[0]));
});
