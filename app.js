const $=s=>document.querySelector(s);
const cats=['كل المشاريع',...new Set(PROJECTS.map(p=>p.category))];
const iconNames=['brain-circuit','kaaba','life-buoy','sprout','shopping-bag','route','bar-chart-3','database'];
const hints=['ذكاء • حماية','حج • سفر','مفقود • طوارئ','زراعة • بيئة','تجارة • مزادات','نقل • خدمات','أعمال • تحليلات','بيانات • برمجيات'];
const grid=$('#grid'),filters=$('#filters'),search=$('#search'),count=$('#count'),empty=$('#empty'),modal=$('#modal');
let active='كل المشاريع';
function categoryCards(){
  $('#categoryGrid').innerHTML=cats.slice(1).map((c,i)=>`<button class="category-card" data-cat="${c}"><span class="cat-num">${String(i+1).padStart(2,'0')}</span><span class="cat-icon"><i data-lucide="${iconNames[i%iconNames.length]}"></i></span><h3>${c}</h3><span>${hints[i]||'Technology'}</span></button>`).join('');
  document.querySelectorAll('.category-card').forEach(x=>x.onclick=()=>{active=x.dataset.cat;renderFilters();render();$('#projects').scrollIntoView({behavior:'smooth'})});
}
function renderFilters(){filters.innerHTML=cats.map(c=>`<button class="filter ${c===active?'active':''}" data-cat="${c}">${c}</button>`).join('');document.querySelectorAll('.filter').forEach(x=>x.onclick=()=>{active=x.dataset.cat;renderFilters();render()});if(window.lucide)lucide.createIcons()}
function list(){const q=search.value.trim().toLowerCase();return PROJECTS.filter(p=>(active==='كل المشاريع'||p.category===active)&&(!q||`${p.title} ${p.description} ${p.category}`.toLowerCase().includes(q)))}
function render(){const data=list();count.textContent=`${data.length} مشروع`;empty.classList.toggle('hidden',data.length>0);grid.innerHTML=data.map((p,i)=>`<article class="project-card" data-id="${p.id}" style="animation-delay:${Math.min(i*18,240)}ms"><div class="card-top"><span class="badge">${p.category}</span><span class="project-id">#${String(p.id).padStart(2,'0')}</span></div><h3>${p.title}</h3><p>${p.description}</p><div class="card-bottom"><span class="details">عرض التفاصيل</span><span class="arrow"><i data-lucide="arrow-left"></i></span></div></article>`).join('');document.querySelectorAll('.project-card').forEach(x=>x.onclick=()=>openProject(+x.dataset.id));if(window.lucide)lucide.createIcons()}
function openProject(id){const p=PROJECTS.find(x=>x.id===id);if(!p)return;$('#mcat').textContent=p.category;$('#mid').textContent=`PROJECT #${String(p.id).padStart(2,'0')}`;$('#mtitle').textContent=p.title;$('#mdesc').textContent=p.description;$('#mcat2').textContent=p.category;$('#mid2').textContent=`#${String(p.id).padStart(2,'0')}`;$('#mwa').href=`https://api.whatsapp.com/send/?phone=967770545327&text=${encodeURIComponent('مرحباً، أريد الاستفسار عن مشروع التخرج رقم '+p.id+': '+p.title)}&type=phone_number&app_absent=0`;modal.classList.remove('hidden');document.body.style.overflow='hidden'}
function closeModal(){modal.classList.add('hidden');document.body.style.overflow=''}
search.oninput=render;
$('#heroSearch').oninput=e=>{search.value=e.target.value;active='كل المشاريع';renderFilters();render()};
$('#heroSearchBtn').onclick=()=>{$('#projects').scrollIntoView({behavior:'smooth'});search.focus()};
$('#clear').onclick=()=>{active='كل المشاريع';search.value='';$('#heroSearch').value='';renderFilters();render()};
$('#close').onclick=closeModal;modal.onclick=e=>{if(e.target===modal)closeModal()};document.onkeydown=e=>{if(e.key==='Escape')closeModal()};
const mobileNav=document.querySelector('.desktop-nav');
$('#menu').onclick=()=>{const open=mobileNav.classList.toggle('mobile-open');Object.assign(mobileNav.style,open?{display:'flex',position:'absolute',top:'67px',right:'14px',left:'14px',padding:'10px 14px',background:'#fff',border:'1px solid #e4eaf0',borderRadius:'14px',boxShadow:'0 18px 40px #183b5f18',flexDirection:'column',alignItems:'stretch',gap:'0'}:{display:'none'});if(open)mobileNav.querySelectorAll('a').forEach(a=>a.onclick=()=>{mobileNav.classList.remove('mobile-open');mobileNav.style.display='none'})};
categoryCards();renderFilters();render();