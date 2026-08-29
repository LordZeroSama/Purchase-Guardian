(function(){
  const merchants=[
    {name:'Fnac',re:/\bfnac\b/i},{name:'Darty',re:/\bdarty\b/i},{name:'Boulanger',re:/\bboulanger\b/i},
    {name:'Amazon.fr',re:/amazon(?:\.fr)?|amzn/i},{name:'Cdiscount',re:/\bcdiscount\b/i},{name:'Carrefour',re:/\bcarrefour\b/i},
    {name:'E.Leclerc',re:/e\.?\s*leclerc|leclerc/i},{name:'Auchan',re:/\bauchan\b/i},{name:'Intermarché',re:/intermarche|intermarch[ée]/i},
    {name:'Lidl',re:/\blidl\b/i},{name:'Aldi',re:/\baldi\b/i},{name:'Monoprix',re:/\bmonoprix\b/i},{name:'Franprix',re:/\bfranprix\b/i},
    {name:'Decathlon',re:/\bdecathlon\b/i},{name:'IKEA',re:/\bikea\b/i},{name:'Leroy Merlin',re:/leroy\s*merlin/i},
    {name:'Castorama',re:/\bcastorama\b/i},{name:'Brico Dépôt',re:/brico\s*d[eé]p[oô]t/i},{name:'Sephora',re:/\bsephora\b/i},
    {name:'Zara',re:/\bzara\b/i},{name:'H&M',re:/\bh\s*&\s*m\b|\bhm\b/i},{name:'Uniqlo',re:/\buniqlo\b/i},
    {name:'Apple',re:/apple\s*store|apple\.com|\bapple\b/i},{name:'Samsung',re:/\bsamsung\b/i},{name:'Micromania',re:/\bmicromania\b/i},
    {name:'Cultura',re:/\bcultura\b/i},{name:'Action',re:/\baction\b/i},{name:'Normal',re:/\bnormal\b/i},{name:'Vinted',re:/\bvinted\b/i}
  ];
  const badAmountWords=/sous[- ]?total|subtotal|tva|taxe|vat|rendu|monnaie|esp[eè]ces?|cash|remise|reduction|r[ée]duction|econom|[ée]conom|avoir|acompte|frais/i;
  const goodAmountWords=[
    [/net\s*[àa]\s*payer/i,16],[/total\s*ttc/i,15],[/montant\s*total/i,14],[/total\s*[àa]\s*payer/i,14],[/\btotal\b/i,12],
    [/[àa]\s*payer/i,11],[/montant/i,7],[/carte|cb|visa|mastercard|paiement/i,4]
  ];
  function cleanText(s){return String(s||'').replace(/\u00a0/g,' ').replace(/[|]/g,'I').replace(/[ ]{2,}/g,' ').trim()}
  function normalize(s){return cleanText(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
  function parseAmount(raw){
    if(!raw)return null;let s=String(raw).replace(/[^0-9,.-]/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.');
    const n=Number(s);return Number.isFinite(n)&&n>=0&&n<1000000?Math.round(n*100)/100:null;
  }
  function findMerchant(text){
    for(const m of merchants){if(m.re.test(text))return {value:m.name,confidence:.96,source:'recognized'}}
    const lines=cleanText(text).split(/\n+/).map(x=>x.trim()).filter(Boolean).slice(0,8);
    const fallback=lines.find(l=>l.length>=3&&l.length<=36&&/[A-Za-zÀ-ÿ]{3}/.test(l)&&!/^ticket|^facture|^re[cç]u|^date|^merci/i.test(l)&&((l.match(/\d/g)||[]).length<5));
    return fallback?{value:fallback.replace(/[^A-Za-zÀ-ÿ0-9 &.'_-]/g,'').trim(),confidence:.45,source:'header'}:{value:'',confidence:0,source:'none'};
  }
  function findTotal(text){
    const lines=cleanText(text).split(/\n+/).map(x=>x.trim()).filter(Boolean);let candidates=[];
    lines.forEach((line,idx)=>{
      const matches=[...line.matchAll(/(?:€|eur\s*)?(-?\d{1,5}(?:[ .]\d{3})*[,.]\d{2})(?:\s*(?:€|eur))?/ig)];
      for(const match of matches){
        const amount=parseAmount(match[1]);if(amount===null||amount<=0)continue;
        let score=0;for(const [re,w] of goodAmountWords)if(re.test(line))score+=w;if(badAmountWords.test(line))score-=8;
        const rel=idx/Math.max(1,lines.length-1);if(rel>.55)score+=2;if(rel>.75)score+=2;if(/€|eur/i.test(line))score+=1;
        candidates.push({amount,line,score,idx});
      }
    });
    if(!candidates.length)return {value:null,confidence:0,source:'none'};
    candidates.sort((a,b)=>b.score-a.score||b.idx-a.idx||b.amount-a.amount);
    let best=candidates[0];
    if(best.score<=1){const lower=candidates.filter(c=>c.idx>=Math.floor(lines.length*.55));if(lower.length)best=lower.sort((a,b)=>b.amount-a.amount)[0]}
    const confidence=best.score>=13?.96:best.score>=8?.86:best.score>=4?.72:.48;
    return {value:best.amount,confidence,source:best.line,candidates:candidates.slice(0,5)};
  }
  function toISO(y,m,d){
    y=Number(y);m=Number(m);d=Number(d);if(y<100)y+=y>=70?1900:2000;if(y<2000||y>2100||m<1||m>12||d<1||d>31)return null;
    const dt=new Date(Date.UTC(y,m-1,d));if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d)return null;
    return `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  function findDate(text){
    const lines=cleanText(text).split(/\n+/).map(x=>x.trim()).filter(Boolean);let found=[];
    lines.forEach((line,idx)=>{
      if(/expiration|expire|validit|valable|garantie|best before|dlc|ddm/i.test(normalize(line)))return;
      let m;
      const rx1=/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/g;while((m=rx1.exec(line))){const iso=toISO(m[3],m[2],m[1]);if(iso)found.push({iso,line,idx,score:(/date|achat|transaction|ticket|commande/i.test(line)?5:0)+(idx<8?2:0)})}
      const rx2=/(20\d{2})[\/.\-](\d{1,2})[\/.\-](\d{1,2})/g;while((m=rx2.exec(line))){const iso=toISO(m[1],m[2],m[3]);if(iso)found.push({iso,line,idx,score:(/date|achat|transaction|ticket|commande/i.test(line)?5:0)+(idx<8?2:0)})}
    });
    if(!found.length)return {value:'',confidence:0,source:'none'};
    found.sort((a,b)=>b.score-a.score||a.idx-b.idx);const best=found[0];return {value:best.iso,confidence:best.score>=5?.9:.65,source:best.line};
  }
  function guessChannel(text){const n=normalize(text);if(/commande|order|livraison|expedition|expedition|shipping|amazon\.fr|cdiscount|vinted|www\.|\.com/.test(n))return {value:'online',confidence:.68};if(/caisse|ticket de caisse|magasin|terminal|tpe|caissier/.test(n))return {value:'store',confidence:.66};return {value:'unknown',confidence:.2}}
  function analyse(text){
    text=cleanText(text);const merchant=findMerchant(text),total=findTotal(text),date=findDate(text),channel=guessChannel(text);
    const weighted=[merchant.confidence,total.confidence,date.confidence].filter(x=>x>0);const confidence=weighted.length?weighted.reduce((a,b)=>a+b,0)/weighted.length:0;
    return {merchant,total,date,channel,confidence,rawText:text};
  }
  function addDays(iso,days){if(!iso)return'';const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+Number(days||0));return d.toISOString().slice(0,10)}
  function addMonths(iso,months){if(!iso)return'';const d=new Date(iso+'T12:00:00');const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+Number(months||0));const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return d.toISOString().slice(0,10)}
  function estimateDeadlines(opts){
    opts=opts||{};const out={returnDate:'',warrantyDate:'',returnReason:'',returnConfidence:'none',notes:[]};
    const channel=opts.channel||'unknown';const anchor=opts.deliveryDate||opts.purchaseDate||'';
    if(Number(opts.manualReturnDays)>0&&anchor){out.returnDate=addDays(anchor,Number(opts.manualReturnDays));out.returnReason=`Politique saisie : ${opts.manualReturnDays} jours`;out.returnConfidence='user'}
    else if(channel==='online'&&opts.deliveryDate){out.returnDate=addDays(opts.deliveryDate,14);out.returnReason='Estimation standard de rétractation pour un achat à distance';out.returnConfidence='medium';out.notes.push('Certaines catégories et situations sont exclues. Vérifie les conditions du vendeur avant d’agir.')}
    else if(channel==='online'&&!opts.deliveryDate){out.notes.push('Ajoute la date de réception pour estimer le délai de rétractation.')}
    else if(channel==='store'){out.notes.push('Pour un achat en magasin, le retour commercial dépend généralement de la politique de l’enseigne : renseigne le délai indiqué sur le ticket.')}
    if(Number(opts.warrantyMonths)>0&&anchor){out.warrantyDate=addMonths(anchor,Number(opts.warrantyMonths));out.notes.push('La date de garantie est indicative : le type de produit, le vendeur et le contrat peuvent modifier les droits applicables.')}
    return out;
  }
  window.ReceiptEngine={analyse,estimateDeadlines,addDays,addMonths,parseAmount,merchants:merchants.map(m=>m.name)};
})();
