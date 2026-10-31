'use strict';
(() => {
const words=JSON.parse(document.getElementById('page-copy').textContent);
const money=value=>new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value/100);
const $=selector=>document.querySelector(selector);
const all=selector=>Array.from(document.querySelectorAll(selector));
let month=0,amountsHidden=false,protectedScreen=false,toastTimer;
const amounts=()=>Array.from({length:15},(_,i)=>({no:'E'+String(1001+i),name:words.names[i],meal:30000,withheld:68000+i*2000,net:480000+i*72000-(month?30000:0),employer:135000+i*5000,status:i<10?0:i<14?1:2}));
function renderPayroll(){
const data=amounts(),body=$('#demo-payroll-rows');body.replaceChildren();
for(const row of data){const tr=document.createElement('tr');[row.no,row.name,'¥'+money(row.meal),'¥'+money(row.withheld),'¥'+money(row.net),words.statuses[row.status]].forEach((value,i)=>{const td=document.createElement('td');td.textContent=value;if(i===5&&row.status)td.className=row.status===1?'pending':'disputed';tr.append(td)});body.append(tr)}
for(const key of ['meal','withheld','net']){const total=data.reduce((sum,row)=>sum+row[key],0);document.querySelector(`[data-column-total="${key}"]`).textContent='¥'+money(total);if(key==='net')$('[data-payroll-total]').textContent='¥'+money(total)}
const person=data[6];$('[data-phone-net]').textContent=amountsHidden?'••••••':'¥'+money(person.net);
[person.meal,person.withheld,person.employer].forEach((value,i)=>{document.querySelector(`[data-phone-detail="${i}"]`).textContent=amountsHidden?'••••':'¥'+money(value)});
$('[data-phone-period]').textContent=words.months[month];$('[data-batch-label]').textContent=words.batch.replace(words.months[0],words.months[month]);
if(!month)$('[data-batch-label]').textContent=words.batch;
all('[data-month]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.month)===month)));
$('#demo-confirm').disabled=false;$('#demo-confirm span').textContent=words.receipt;
}
all('[data-month]').forEach(button=>button.addEventListener('click',()=>{month=Number(button.dataset.month);renderPayroll()}));
$('#toggle-amounts').addEventListener('click',()=>{amountsHidden=!amountsHidden;$('#toggle-amounts').setAttribute('aria-pressed',String(amountsHidden));renderPayroll()});
$('#demo-confirm').addEventListener('click',()=>{$('#demo-confirm span').textContent=words.receiptDone;$('#demo-confirm').disabled=true;toast(words.receiptDone)});
$('#capture-demo').addEventListener('click',()=>{protectedScreen=!protectedScreen;$('.capture-mask').hidden=!protectedScreen;$('#capture-demo').setAttribute('aria-pressed',String(protectedScreen));$('#capture-demo span').textContent=protectedScreen?words.captureOff:words.capture});
const menu=$('.menu-button'),nav=$('#main-nav');
function closeMenu(){menu.setAttribute('aria-expanded','false');nav.classList.remove('open')}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});
function showStep(index,focus=false){all('[data-step]').forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;if(focus&&i===index)button.focus();$('#step-panel-'+i).hidden=i!==index})}
all('[data-step]').forEach((button,i)=>{button.addEventListener('click',()=>showStep(i));button.addEventListener('keydown',event=>{let target;if(event.key==='ArrowRight')target=(i+1)%4;if(event.key==='ArrowLeft')target=(i+3)%4;if(event.key==='Home')target=0;if(event.key==='End')target=3;if(target!==undefined){event.preventDefault();showStep(target,true)}})});
$('#approve-demo').addEventListener('click',()=>{$('#approve-demo span').textContent=words.deviceApproved;$('#approve-demo').disabled=true;toast(words.deviceApproved)});
const qr=$('#demo-qr'),NS='http://www.w3.org/2000/svg';
function square(x,y,w,color){const r=document.createElementNS(NS,'rect');r.setAttribute('x',String(x));r.setAttribute('y',String(y));r.setAttribute('width',String(w));r.setAttribute('height',String(w));r.setAttribute('fill',color);qr.append(r)}
for(let x=2;x<23;x++)for(let y=2;y<23;y++){const finder=(x<10&&y<10)||(x>14&&y<10)||(x<10&&y>14);if(!finder&&(x*17+y*11+x*y)%7<3)square(x,y,1,'#14203a')}
for(const [x,y]of [[2,2],[16,2],[2,16]]){square(x,y,7,'#14203a');square(x+1,y+1,5,'#d8e5fd');square(x+2,y+2,3,'#14203a')}
function toast(text){clearTimeout(toastTimer);$('#site-toast').textContent=text;$('#site-toast').hidden=false;toastTimer=setTimeout(()=>{$('#site-toast').hidden=true},3000)}
function deploymentConfig(){let url;try{url=new URL($('#deploy-domain').value.trim())}catch{return null}
const host=url.hostname;
if(url.protocol!=='https:'||url.username||url.password||url.port||(url.pathname!=='/'&&url.pathname!=='')||url.search||url.hash||!host.includes('.')||/[^a-z0-9.-]/i.test(host)||/^[\d.]+$/.test(host)||!/^v?\d+\.\d+\.\d+$/.test($('#deploy-version').value.trim()))return null;
return{origin:url.origin,host,image:'opshomenoc/payroll-server:'+$('#deploy-version').value.trim()};}
function updateCommands(){const config=deploymentConfig();$('#deploy-domain').setAttribute('aria-invalid',String(!config));if(!config)return false;
const {origin,host,image}=config;
$('#deploy-command').textContent=`docker run -d --name opshome-payroll \\\n  --restart unless-stopped \\\n  -p 127.0.0.1:8080:8000 \\\n  -v /opt/payroll/data:/data \\\n  -e PAYROLL_PUBLIC_URL=${origin} \\\n  -e PAYROLL_TRUSTED_HOSTS=${host} \\\n  -e PAYROLL_PROXY_HOPS=1 \\\n  -e PAYROLL_TRUSTED_PROXY_CIDRS="$(docker network inspect bridge --format '{{(index .IPAM.Config 0).Gateway}}')/32" \\\n  ${image}`;
$('#init-command').textContent=`docker pull ${image}\n\ndocker run --rm \\\n  -v /opt/payroll/data:/data \\\n  ${image} db-upgrade\n\ndocker run --rm \\\n  -v /opt/payroll/data:/data \\\n  ${image} init-company \\\n  --name 'Your Company' --region CN\n\ndocker run -it --rm \\\n  -v /opt/payroll/data:/data \\\n  ${image} create-admin --username admin`;
return true;}
for(const field of ['#deploy-domain','#deploy-version'])$(field).addEventListener('input',updateCommands);
all('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{if(!updateCommands()){toast(words.domainError);return}const value=document.getElementById(button.dataset.copy).textContent;const label=button.querySelector('span'),initial=button.dataset.originalLabel||(button.dataset.originalLabel=label.textContent);
try{if(!navigator.clipboard||!window.isSecureContext)throw new Error('clipboard unavailable');await navigator.clipboard.writeText(value);label.textContent=words.copied;toast(words.copied);setTimeout(()=>{label.textContent=initial},2200)}catch{const selection=window.getSelection(),range=document.createRange();range.selectNodeContents(document.getElementById(button.dataset.copy));selection.removeAllRanges();selection.addRange(range);let fallbackCopied=false;try{fallbackCopied=document.execCommand('copy')}catch{}if(fallbackCopied){label.textContent=words.copied;toast(words.copied);setTimeout(()=>{label.textContent=initial},2200)}else{toast(words.copyFailed)}}}));
all('[data-dialog]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.dialog).showModal()));
all('dialog').forEach(dialog=>{dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}})});
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)nav.querySelectorAll('a').forEach(link=>link.classList.toggle('active',link.hash==='#'+entry.target.id))},{rootMargin:'-20% 0px -55% 0px'});all('#solution,#deployment,#security,#faq').forEach(section=>observer.observe(section))}
renderPayroll();updateCommands();
})();
