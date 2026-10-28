'use strict';
const menu=document.querySelector('.menu');
const nav=document.querySelector('#main-nav');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');nav.classList.remove('open')}));
const hk=document.body.dataset.region==='HK';
const data=hk?[
 {net:19950,gross:21000,deduction:1050,rows:[20000,1000,-1050,1050],date:'2026-10-30'},
 {net:19000,gross:20000,deduction:1000,rows:[20000,0,-1000,1000],date:'2026-09-30'}
]:[
 {net:17000,gross:20600,deduction:3600,rows:[18000,2000,600,-3090,-510],date:'2026-10-30'},
 {net:16530,gross:20000,deduction:3470,rows:[18000,2000,0,-3090,-380],date:'2026-09-30'}
];
let current=0,hidden=false;
const money=new Intl.NumberFormat('en-HK',{minimumFractionDigits:2,maximumFractionDigits:2});
function show(value){return hidden?'••••••':money.format(value)}
function render(){
 const record=data[current];
 for(const field of ['net','gross','deduction'])document.querySelector(`[data-${field}]`).textContent=show(record[field]);
 document.querySelectorAll('[data-row]').forEach((row,i)=>{row.textContent=show(record.rows[i])});
 document.querySelector('[data-date]').textContent=record.date;
 document.querySelectorAll('[data-month]').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===current)));
}
document.querySelectorAll('[data-month]').forEach(button=>button.addEventListener('click',()=>{current=Number(button.dataset.month);render()}));
const eye=document.querySelector('.eye');
eye.addEventListener('click',()=>{hidden=!hidden;eye.setAttribute('aria-pressed',String(hidden));eye.setAttribute('aria-label',hidden?eye.dataset.showLabel:eye.dataset.hideLabel);render()});
const privacy=document.querySelector('#privacy');
document.querySelector('[data-privacy]').addEventListener('click',event=>{event.preventDefault();privacy.showModal()});
document.querySelector('.close-dialog').addEventListener('click',()=>privacy.close());
privacy.addEventListener('click',event=>{if(event.target===privacy){const r=privacy.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)privacy.close()}});
render();
