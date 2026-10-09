/* Career Reference V3 — additive presentation. Does not change Rey data, routes or persistence. */
const RX_ICON_PATHS={
 building:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 21v-4h8v4M7 7h2m6 0h2M7 11h2m6 0h2"/>',
 briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13c4 3 14 3 18 0M12 13v3"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m14-18.1a4 4 0 0 1 0 7.8M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
 application:'<path d="M8 3h9l4 4v14H3V3h5zM16 3v5h5M7 12h10M7 16h7"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 arrow:'<path d="M4 12h16m-7-7 7 7-7 7"/>',
 sparkle:'<path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z"/>',
 note:'<path d="M13 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8M11 13l9-9 2 2-9 9-4 1z"/>',
 send:'<path d="m22 2-7 20-4-9-9-4 20-7ZM11 13l11-11"/>',
 trend:'<path d="m3 17 6-6 4 4 8-8m-6 0h6v6"/>',
 search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.5-4.5"/>',
 document:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
 check:'<path d="m5 12 4 4L19 6"/>'
};
function rxIcon(name, extra=''){return `<svg class="rx-icon ${extra}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${RX_ICON_PATHS[name]||RX_ICON_PATHS.sparkle}</svg>`}
function rxCareerNav(){return `<nav class="rx-navigation" aria-label="Career Studio sections">${CAREER_TABS.map(([key,label])=>`<button type="button" data-cr="tab" data-id="${key}" class="rx-tab ${careerTab===key?'active':''}" ${careerTab===key?'aria-current="page"':''}>${label==='today'?'Overview':label==='discover'?'Companies':label==='pursue'?'Opportunities':label==='connect'?'Networking':label}</button>`).join('')}</nav>`}
function careerStudioReference(){
 const c=active('companies'),o=active('opportunities'),p=active('contacts'),t=careerTargets(),companyOpen=careerCompanyId&&find('companies',careerCompanyId);
 const content=companyOpen?`<div class="rx-interior"><div class="rx-interior-top"><div class="rx-kicker">REY / CAREER STUDIO</div><h1>Company workspace</h1></div>${rxCareerNav()}<div class="rx-interior-body">${careerCompanyWorkspace(companyOpen)}</div></div>`:
 careerTab==='today'?careerTodayReference(c,o,p,t):`<div class="rx-interior"><div class="rx-interior-top"><div><div class="rx-kicker">REY / CAREER STUDIO</div><h1>${careerTab==='discover'?'Your target companies':careerTab==='pursue'?'Your opportunities':careerTab==='connect'?'Your network':'Your documents'}</h1><p>Keep the research organized. Make every next action easier.</p></div><button class="rx-outline-btn" data-cr="import">${rxIcon('document')} Import CSV</button></div>${rxCareerNav()}<div class="rx-interior-body">${careerTab==='discover'?careerDiscover(c,o):careerTab==='pursue'?careerPursue(o):careerTab==='connect'?careerConnect(p):careerDocuments()}</div></div>`;
 return `<section class="career-shell rx-career">${content}<input id="careerCsv" type="file" accept=".csv,text/csv" hidden aria-label="Import research CSV"/></section>`
}
function careerTodayReference(c,o,p,t){
 const sent=o.filter(x=>['Dikirim','Applied','Interview','Offer'].includes(String(x.stage||''))).length;
 const totalNext=t.follow.length+t.deadlines.length;
 const tasks=[
  ...t.follow.map(x=>({type:'contact',id:x.id,title:`Follow up ${x.title||'contact'}`,detail:company(x.companyId)||x.role||'Networking',date:x.followup,overdue:x.followup<today()})),
  ...t.deadlines.map(x=>({type:'opp',id:x.id,title:x.title||'Application deadline',detail:careerCompanyName(x),date:x.deadline,overdue:false}))
 ].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
 const activities=(Array.isArray(activity)?activity:[]).filter(x=>x&&x.title).slice(0,5);
 const stats=[
  ['building',c.length,'Perusahaan dipantau','Company directory','discover'],
  ['briefcase',o.length,'Peluang tersimpan','Status perlu diverifikasi','pursue'],
  ['users',p.length,'Kontak networking','Networking CRM','connect'],
  ['send',sent,'Aplikasi terkirim','Berdasarkan status tersimpan','pursue']
 ];
 const taskList=tasks.length?tasks.slice(0,5).map(x=>`<div class="rx-follow-row"><div class="rx-datecell"><strong>${h(careerDate(x.date))}</strong><small>${x.overdue?'Lewat jadwal':x.type==='opp'?'Deadline':'Follow-up'}</small></div><span class="rx-action-symbol">${rxIcon(x.type==='contact'?'users':'briefcase')}</span><div class="rx-follow-desc"><strong>${h(x.title)}</strong><small>${h(x.detail)}</small></div><button class="rx-open-record" data-cr="${x.type}" data-id="${h(x.id)}" aria-label="Buka ${h(x.title)}">${rxIcon('arrow')}</button></div>`).join(''):
 `<div class="rx-calm-empty"><span class="rx-empty-icon">${rxIcon('check')}</span><h4>Belum ada follow-up mendesak</h4><p>Tambahkan tanggal follow-up ke kontak atau deadline ke lamaran untuk melihatnya di sini.</p><button class="rx-link" data-cr="add" data-type="contacts">Tambah kontak ${rxIcon('arrow')}</button></div>`;
 const activityList=activities.length?activities.map((x,i)=>`<div class="rx-activity-row"><span class="rx-timeline-dot"></span><div class="rx-activity-text"><strong>${h(x.title)}</strong><small>${x.date?h(dateLabel(x.date)):'Aktivitas tersimpan'}</small></div></div>`).join(''):
 `<div class="rx-activity-empty"><p>Aktivitas yang tersimpan akan muncul di sini setelah lu mulai menggunakan Rey.</p></div>`;
 return `<div class="rx-dashboard">
 <div class="rx-main-column">
   <header class="rx-hero"><div class="rx-hero-content"><div class="rx-hero-kicker">${rxIcon('sparkle')} REY CAREER STUDIO</div><h1>Halo, Rey! <span class="rx-waving" aria-hidden="true">✳</span></h1><h2>Selangkah lebih dekat ke karier impianmu.</h2><p>Kelola peluang, bangun jaringan, dan catat progres dalam satu tempat yang terorganisir.</p><div class="rx-hero-buttons"><button class="rx-blue-btn" data-cr="tab" data-id="pursue">${rxIcon('search')} Lihat peluang</button><button class="rx-white-btn" data-cr="tab" data-id="discover">${rxIcon('target')} Target perusahaan</button></div></div><div class="rx-hero-art" aria-hidden="true"></div><div class="rx-hero-quote" aria-hidden="true">Small steps.<br/>Meaningful progress.</div></header>
   ${rxCareerNav()}
   <div class="rx-stats">${stats.map(([ico,n,title,sub,tab])=>`<button class="rx-stat" data-cr="tab" data-id="${tab}"><span class="rx-stat-icon">${rxIcon(ico)}</span><span class="rx-stat-info"><small>${h(title)}</small><strong>${n}</strong><em>${h(sub)}</em></span><span class="rx-stat-arrow">${rxIcon('arrow')}</span></button>`).join('')}</div>
   <div class="rx-work-grid"><section class="rx-card rx-follow-card"><div class="rx-card-heading"><h3>${rxIcon('calendar')} Follow-up mendatang</h3><button class="rx-link" data-cr="tab" data-id="connect">Lihat semua ${rxIcon('arrow')}</button></div><div class="rx-follow-list">${taskList}</div></section><section class="rx-card rx-activity-card"><div class="rx-card-heading"><h3>${rxIcon('activity')} Aktivitas terbaru</h3><span class="rx-soft-label">Riwayat tersimpan</span></div><div class="rx-timeline">${activityList}</div></section></div>
   <section class="rx-card rx-command"><div class="rx-card-heading"><div><h3>${rxIcon('target')} Career Command Center</h3><p>Tindakan berikutnya berdasarkan catatanmu, bukan angka buatan.</p></div><button class="rx-link" data-cr="tab" data-id="pursue">Lihat pipeline ${rxIcon('arrow')}</button></div><div class="rx-command-tiles"><button data-cr="tab" data-id="pursue">${rxIcon('briefcase')} <strong>${o.length}</strong><span>Saved opportunities</span></button><button data-cr="tab" data-id="connect">${rxIcon('calendar')} <strong>${totalNext}</strong><span>Follow-ups & deadlines</span></button><button data-cr="tab" data-id="documents">${rxIcon('document')}<strong>${active('resources').filter(x=>x.category==='Career Document').length}</strong><span>Career documents</span></button></div></section>
   <section class="rx-card rx-recent"><div class="rx-card-heading"><div><h3>${rxIcon('briefcase')} Peluang yang tersimpan</h3><p>Pastikan lowongan masih aktif melalui tautan sumber.</p></div><button class="rx-link" data-cr="tab" data-id="pursue">Lihat semua ${rxIcon('arrow')}</button></div>${o.length?o.slice(0,4).map(x=>careerOpportunityRow(x)).join(''):careerEmpty('Belum ada peluang','Tambahkan peluang pertama atau import CSV hasil riset.')}</section>
 </div>
 <aside class="rx-side-column"><section class="rx-quick"><div class="rx-quick-heading"><h3>${rxIcon('sparkle')} Aksi cepat</h3><p>Langkah kecil, progres nyata.</p></div><button data-cr="add" data-type="contacts">${rxIcon('users')} Tambah kontak ${rxIcon('arrow')}</button><button data-cr="add" data-type="opportunities">${rxIcon('briefcase')} Tambah peluang ${rxIcon('arrow')}</button><button data-cr="add" data-type="companies">${rxIcon('building')} Tambah perusahaan ${rxIcon('arrow')}</button><button data-cr="import">${rxIcon('document')} Import riset CSV ${rxIcon('arrow')}</button></section>
 <section class="rx-side-card rx-side-follow"><div class="rx-side-heading"><h3>${rxIcon('calendar')} Follow-up hari ini</h3><button class="rx-link" data-cr="tab" data-id="connect">Semua ${rxIcon('arrow')}</button></div><div class="rx-side-illustration" aria-hidden="true"></div><div class="rx-side-follow-content"><h4>${totalNext?`${totalNext} hal perlu diperhatikan`:'Satu langkah lebih dekat'}</h4><p>${totalNext?'Lihat follow-up dan deadline yang sudah tercatat.':'Tambahkan follow-up agar peluang baik tidak terlewat.'}</p><button class="rx-blue-btn" data-cr="add" data-type="contacts">${rxIcon('users')} Tambah follow-up</button></div></section>
 <section class="rx-side-card rx-side-insight"><div class="rx-side-heading"><h3>${rxIcon('target')} Focus note</h3></div><p>“Karier yang baik dibangun lewat riset, tindakan, dan koneksi yang tulus.”</p><small>REY CAREER STUDIO</small></section>
 <section class="rx-side-card rx-side-calendar"><button data-cr="page" data-id="calendar">${rxIcon('calendar')} Buka kalender karier ${rxIcon('arrow')}</button></section>
 <div class="rx-privacy">${rxIcon('check')} Ruang pribadi · Data mengikuti penyimpanan Rey.</div></aside>
 </div>`;
}