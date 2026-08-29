const META_KEY='purchaseGuardian.v1_3';
const OLD_KEYS=['purchaseGuardian.v1_2','purchaseGuardian.v1_1'];
const DB_NAME='purchaseGuardianDB';
const STORE='receipts';
const seed=[
  {id:'demo1',product:'AirPods Pro',store:'Fnac',price:279,purchaseDate:'2026-08-20',channel:'store',deliveryDate:'',status:'return',returnDate:'2026-08-31',warrantyDate:'2028-08-20',refundAmount:0,protectedAmount:0,icon:'🎧',confidence:null},
  {id:'demo2',product:'Clavier mécanique',store:'Amazon.fr',price:89.99,purchaseDate:'2026-08-15',channel:'online',deliveryDate:'2026-08-17',status:'refund',returnDate:'2026-08-31',warrantyDate:'2028-08-17',refundAmount:89.99,protectedAmount:0,icon:'📦',confidence:null},
  {id:'demo3',product:'Écran 27\"',store:'Boulanger',price:249.99,purchaseDate:'2026-05-18',channel:'store',deliveryDate:'',status:'protected',returnDate:'',warrantyDate:'2028-05-18',refundAmount:0,protectedAmount:47.43,icon:'💻',confidence:null}
];
let items=loadItems();
let currentFilter='all';
let scannerBlob=null;
let scannerRawText='';
let scannerResult=null;
let scannerObjectUrl='';
let receiptPreviewUrl='';

function $(id){return document.getElementById(id)}
function loadItems(){
  try{const cur=JSON.parse(localStorage.getItem(META_KEY));if(Array.isArray(cur))return cur}catch(e){}
  for(const key of OLD_KEYS){try{const old=JSON.parse(localStorage.getItem(key));if(Array.isArray(old)){localStorage.setItem(META_KEY,JSON.stringify(old));return old}}catch(e){}}
  return seed;
}
function persist(){localStorage.setItem(META_KEY,JSON.stringify(items));renderAll()}
function eur(n){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(Number(n)||0)}
function fmtDate(s){return s?new Date(s+'T12:00:00').toLocaleDateString('fr-FR'):'—'}
function daysUntil(s){if(!s)return null;const a=new Date();a.setHours(0,0,0,0);const b=new Date(s+'T12:00:00');return Math.ceil((b-a)/86400000)}
function uid(){return crypto.randomUUID?crypto.randomUUID():'p'+Date.now()+Math.random().toString(16).slice(2)}
function showToast(msg){const t=$('toast');t.textContent=msg;t.style.display='block';clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.style.display='none',2200)}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function confidenceLabel(v){if(v==null)return'';const p=Math.round(v*100);return p>=85?`OCR ${p}%`:`OCR ~${p}%`}

function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function putReceipt(id,blob){if(!blob)return;const db=await openDB();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({id,blob,updatedAt:Date.now()});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function getReceipt(id){try{const db=await openDB();return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).get(id);r.onsuccess=()=>resolve(r.result?.blob||null);r.onerror=()=>reject(r.error)})}catch(e){return null}}
async function deleteReceipt(id){try{const db=await openDB();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}catch(e){}}

function statusLabel(i){
  if(i.status==='refund')return['En attente','red'];
  if(i.status==='return'){const d=daysUntil(i.returnDate);if(d==null)return['Retour','yellow'];if(d<0)return['Retour expiré','grey'];return[`Retour · ${d} j`,d<=3?'red':'yellow']}
  if(i.status==='protected')return['Protégé','green'];
  if(i.status==='done')return['Terminé','grey'];
  return['À surveiller','blue'];
}
function card(i){
  const [label,cls]=statusLabel(i);
  let extra=`${escapeHtml(i.store||'Magasin inconnu')} · ${eur(i.price)}`;
  if(i.status==='refund')extra=`Remboursement attendu ${eur(i.refundAmount)}`;
  else if(i.status==='protected'&&i.warrantyDate)extra=`Garantie jusqu’au ${fmtDate(i.warrantyDate)}`;
  const conf=confidenceLabel(i.confidence);
  return `<div class="card"><div class="row"><div class="left"><img class="receipt-thumb" data-receipt-id="${i.id}" alt="" style="display:none"><div class="icon fallback-icon">${i.icon||'🛍️'}</div><div style="min-width:0"><div class="title">${escapeHtml(i.product||'Achat')}</div><div class="meta">${extra}${conf?` · ${conf}`:''}</div></div></div><div class="pill ${cls}">${label}</div></div><div class="card-actions">${i.status==='refund'?`<button class="small-btn" onclick="markRefund('${i.id}')">Remboursement reçu</button>`:''}<button class="small-btn" onclick="editPurchase('${i.id}')">Modifier</button><button class="small-btn" onclick="showReceipt('${i.id}')">Reçu</button><button class="small-btn danger" onclick="removePurchase('${i.id}')">Supprimer</button></div></div>`;
}
async function hydrateThumbnails(){
  const els=[...document.querySelectorAll('[data-receipt-id]')];
  for(const el of els){const blob=await getReceipt(el.dataset.receiptId);if(blob){const url=URL.createObjectURL(blob);el.src=url;el.style.display='block';const fallback=el.parentElement.querySelector('.fallback-icon');if(fallback)fallback.style.display='none';setTimeout(()=>URL.revokeObjectURL(url),30000)}}
}
function renderAll(){
  const money=items.reduce((s,i)=>s+Number(i.protectedAmount||0),0);
  $('moneyProtected').textContent=eur(money);$('statPurchases').textContent=items.length;$('statRefunds').textContent=items.filter(i=>i.status==='done'&&Number(i.protectedAmount)>0).length;$('statWarranties').textContent=items.filter(i=>i.warrantyDate&&daysUntil(i.warrantyDate)>=0).length;
  const watch=items.filter(i=>i.status==='refund'||i.status==='return').sort((a,b)=>(daysUntil(a.returnDate)??9999)-(daysUntil(b.returnDate)??9999));$('watchList').innerHTML=watch.length?watch.slice(0,4).map(card).join(''):'<div class="empty">Aucune échéance urgente 🎉</div>';
  const filtered=items.filter(i=>currentFilter==='all'||(currentFilter==='protected'?!!i.warrantyDate&&daysUntil(i.warrantyDate)>=0:i.status===currentFilter));$('purchaseList').innerHTML=filtered.length?filtered.map(card).join(''):'<div class="empty">Aucun achat dans cette catégorie.</div>';
  const ws=items.filter(i=>i.warrantyDate&&daysUntil(i.warrantyDate)>=0);$('warrantyList').innerHTML=ws.length?ws.map(card).join(''):'<div class="empty">Aucune garantie enregistrée.</div>';
  hydrateThumbnails();
}
function switchView(view,filter){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===view));document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===view));if(filter){currentFilter=filter;document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));renderAll()}scrollTo({top:0,behavior:'smooth'})}
function setFilter(filter,btn){currentFilter=filter;document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderAll()}

function resetEditor(){
  $('editId').value='';$('product').value='';$('store').value='';$('price').value='';$('purchaseDate').value=new Date().toISOString().slice(0,10);$('channel').value='unknown';$('deliveryDate').value='';$('status').value='watch';$('returnDate').value='';$('warrantyDate').value='';$('refundAmount').value='';$('protectedAmount').value='';$('manualReturnDays').value='';$('warrantyMonths').value='24';$('deadlineHint').textContent='';$('sheetTitle').textContent='Ajouter un achat';
}
function openEditor(prefill){resetEditor();if(prefill)fillEditor(prefill);$('sheetWrap').style.display='flex'}
function closeEditor(){$('sheetWrap').style.display='none'}
function fillEditor(i){
  $('editId').value=i.id||'';$('sheetTitle').textContent=i.id?'Modifier l’achat':'Ajouter un achat';$('product').value=i.product||'';$('store').value=i.store||'';$('price').value=i.price??'';$('purchaseDate').value=i.purchaseDate||new Date().toISOString().slice(0,10);$('channel').value=i.channel||'unknown';$('deliveryDate').value=i.deliveryDate||'';$('status').value=i.status||'watch';$('returnDate').value=i.returnDate||'';$('warrantyDate').value=i.warrantyDate||'';$('refundAmount').value=i.refundAmount||'';$('protectedAmount').value=i.protectedAmount||'';$('warrantyMonths').value='24';
}
function editPurchase(id){const i=items.find(x=>x.id===id);if(i)openEditor(i)}
function applyDeadlineEstimate(){
  const result=ReceiptEngine.estimateDeadlines({purchaseDate:$('purchaseDate').value,deliveryDate:$('deliveryDate').value,channel:$('channel').value,manualReturnDays:$('manualReturnDays').value,warrantyMonths:$('warrantyMonths').value});
  if(result.returnDate)$('returnDate').value=result.returnDate;if(result.warrantyDate)$('warrantyDate').value=result.warrantyDate;
  const parts=[];if(result.returnReason)parts.push(`${result.returnReason} → ${fmtDate(result.returnDate)}`);parts.push(...result.notes);$('deadlineHint').textContent=parts.join(' ');if(parts.length)showToast('Échéances estimées — à vérifier')
}
async function savePurchase(){
  const product=$('product').value.trim();const price=Number($('price').value||0);if(!product){showToast('Indique un produit');return}
  let id=$('editId').value||uid();const old=items.find(x=>x.id===id);
  const item={id,product,store:$('store').value.trim(),price,purchaseDate:$('purchaseDate').value,channel:$('channel').value,deliveryDate:$('deliveryDate').value,status:$('status').value,returnDate:$('returnDate').value,warrantyDate:$('warrantyDate').value,refundAmount:Number($('refundAmount').value||0),protectedAmount:Number($('protectedAmount').value||0),icon:old?.icon||'🛍️',confidence:old?.confidence??scannerResult?.confidence??null,ocrText:old?.ocrText||scannerRawText||''};
  const idx=items.findIndex(x=>x.id===id);if(idx>=0)items[idx]=item;else items.unshift(item);
  if(scannerBlob){try{await putReceipt(id,scannerBlob)}catch(e){showToast('Achat sauvegardé, mais photo non stockée')}}
  scannerBlob=null;scannerRawText='';scannerResult=null;closeEditor();persist();switchView('purchases');showToast('Achat enregistré ✓')
}
async function removePurchase(id){if(!confirm('Supprimer cet achat et sa photo de reçu ?'))return;items=items.filter(i=>i.id!==id);await deleteReceipt(id);persist();showToast('Achat supprimé')}
function markRefund(id){const i=items.find(x=>x.id===id);if(!i)return;i.protectedAmount=Number(i.protectedAmount||0)+Number(i.refundAmount||0);i.refundAmount=0;i.status='done';persist();showToast('Remboursement ajouté à Money Protected ✓')}

function openScanner(){resetScanner();$('scanWrap').style.display='flex'}
function closeScanner(){$('scanWrap').style.display='none'}
function resetScanner(){scannerBlob=null;scannerRawText='';scannerResult=null;if(scannerObjectUrl)URL.revokeObjectURL(scannerObjectUrl);scannerObjectUrl='';$('scanPreview').style.display='none';$('scanExtract').style.display='none';$('scanStatus').textContent='Prends une photo nette du ticket ou choisis une image.';$('scanProgressBar').style.width='0%';$('useScanBtn').style.display='none';$('cameraInput').value='';$('galleryInput').value=''}
async function handleReceiptFile(file){
  if(!file)return;if(file.size>18*1024*1024){showToast('Image trop lourde');return}
  try{scannerBlob=await compressReceipt(file);scannerObjectUrl=URL.createObjectURL(scannerBlob);$('scanImage').src=scannerObjectUrl;$('scanPreview').style.display='block';$('scanStatus').textContent='Préparation OCR…';await runOCR(scannerBlob)}catch(e){console.error(e);$('scanStatus').textContent='Impossible d’analyser cette image. Essaie avec plus de lumière et un ticket bien à plat.';showToast('Échec de l’analyse OCR')}
}
async function compressReceipt(file){
  const bmp=await createImageBitmap(file);const max=1800;const scale=Math.min(1,max/Math.max(bmp.width,bmp.height));const w=Math.max(1,Math.round(bmp.width*scale)),h=Math.max(1,Math.round(bmp.height*scale));const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bmp,0,0,w,h);const img=ctx.getImageData(0,0,w,h);const d=img.data;for(let i=0;i<d.length;i+=4){const y=.299*d[i]+.587*d[i+1]+.114*d[i+2];const c=Math.max(0,Math.min(255,(y-128)*1.25+128));d[i]=d[i+1]=d[i+2]=c}ctx.putImageData(img,0,0);return await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82))}
async function runOCR(blob){
  if(!window.Tesseract){$('scanStatus').textContent='Le moteur OCR n’a pas pu être chargé. Vérifie la connexion internet.';return}
  $('scanProgressBar').style.width='4%';$('scanStatus').textContent='Lecture du ticket… le premier scan peut prendre quelques secondes.';
  let result;try{result=await Tesseract.recognize(blob,'fra+eng',{logger:m=>{if(m.status==='recognizing text'){const p=Math.max(5,Math.round((m.progress||0)*100));$('scanProgressBar').style.width=p+'%';$('scanStatus').textContent=`OCR en cours… ${p}%`}}})}catch(e){result=await Tesseract.recognize(blob,'eng',{logger:m=>{if(m.status==='recognizing text')$('scanProgressBar').style.width=Math.round((m.progress||0)*100)+'%'}})}
  scannerRawText=result.data.text||'';scannerResult=ReceiptEngine.analyse(scannerRawText);$('scanProgressBar').style.width='100%';showScanResult(scannerResult)
}
function showScanResult(r){
  $('scanMerchant').textContent=r.merchant.value||'Non reconnu';$('scanTotal').textContent=r.total.value!=null?eur(r.total.value):'Non détecté';$('scanDate').textContent=r.date.value?fmtDate(r.date.value):'Non détectée';$('scanChannel').textContent=r.channel.value==='online'?'En ligne':r.channel.value==='store'?'Magasin':'À confirmer';$('scanConfidence').textContent=`Confiance globale ~${Math.round((r.confidence||0)*100)}%`;$('scanExtract').style.display='block';$('useScanBtn').style.display='block';$('scanStatus').textContent='Analyse terminée. Vérifie toujours les informations avant d’enregistrer.'
}
function useScanResult(){
  if(!scannerResult)return;const r=scannerResult;closeScanner();openEditor({product:r.merchant.value?`Achat ${r.merchant.value}`:'Achat scanné',store:r.merchant.value||'',price:r.total.value??'',purchaseDate:r.date.value||new Date().toISOString().slice(0,10),channel:r.channel.value||'unknown',status:'watch',returnDate:'',warrantyDate:'',refundAmount:0,protectedAmount:0,confidence:r.confidence,ocrText:scannerRawText});$('deadlineHint').textContent='OCR appliqué. Corrige le nom du produit et vérifie le montant/date avant validation.'
}
async function showReceipt(id){
  const blob=await getReceipt(id);if(!blob){showToast('Aucune photo de reçu pour cet achat');return}if(receiptPreviewUrl)URL.revokeObjectURL(receiptPreviewUrl);receiptPreviewUrl=URL.createObjectURL(blob);$('receiptViewImage').src=receiptPreviewUrl;$('receiptViewWrap').style.display='flex'
}
function closeReceiptView(){$('receiptViewWrap').style.display='none';if(receiptPreviewUrl){URL.revokeObjectURL(receiptPreviewUrl);receiptPreviewUrl=''}}

function installHandlers(){
  $('cameraInput').addEventListener('change',e=>handleReceiptFile(e.target.files?.[0]));$('galleryInput').addEventListener('change',e=>handleReceiptFile(e.target.files?.[0]));
  ['purchaseDate','deliveryDate','channel','manualReturnDays','warrantyMonths'].forEach(id=>$(id).addEventListener('change',()=>{$('deadlineHint').textContent='Les dates ont changé : touche « Estimer les échéances » pour recalculer.'}));
}
function registerSW(){if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{})}
window.addEventListener('DOMContentLoaded',()=>{installHandlers();renderAll();registerSW()});
