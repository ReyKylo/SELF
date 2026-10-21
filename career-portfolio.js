/* Private portfolio workbench; self-check != expert review. */
(function(){
'use strict';
let host;const keys=['PE','VC','Consulting'],checks={
 PE:['Model dan Sources & Uses reconcile','Asumsi dan downside disampaikan','Memo konsisten dengan return model'],
 VC:['Cohort, CAC, NRR dan ownership dicek','Market/exit assumptions diberi label','Memo punya keputusan dan diligence gates'],
 Consulting:['Profit bridge dan economics dicek','Overlap, risiko, implementasi diuji','Deck berisi keputusan dan 90-day plan']
};
const st={owner:null,track:null,loading:false,busy:false,error:'',files:[],record:null,decision:'',review:{},dirty:false};
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const current=(o,t)=>!!o&&host?.state()?.user?.id===o&&st.owner===o&&st.track===t;
const url=(table,o,t)=>'/rest/v1/'+table+'?user_id=eq.'+encodeURIComponent(o)+'&track=eq.'+encodeURIComponent(t);
const redraw=()=>host?.render();
function reset(owner){Object.assign(st,{owner:owner||null,track:null,loading:false,busy:false,error:'',files:[],record:null,decision:'',review:{},dirty:false})}
async function open(track){
 const o=host?.state()?.user?.id;if(!o||!keys.includes(track))return;
 reset(o);st.track=track;st.loading=true;redraw();
 try{const [cases,files]=await Promise.all([host.request(url('career_portfolio_cases',o,track)+'&select=*'),host.request(url('career_portfolio_files',o,track)+'&select=*&order=created_at.desc')]);
 if(!current(o,track))return;st.record=cases[0]||null;st.decision=st.record?.decision||'';st.review=st.record?.review_checks||{};st.files=files||[];
 }catch(e){if(current(o,track))st.error='Portfolio gagal dimuat: '+e.message}
 finally{if(current(o,track)){st.loading=false;redraw()}}
}
const types={PE:'workbook XLSX + memo PDF/DOCX',VC:'workbook XLSX + memo PDF/DOCX',Consulting:'workbook XLSX + deck PPTX'};
function valid(){const ext=st.files.map(f=>f.filename.split('.').pop().toLowerCase());return ext.includes('xlsx')&&(st.track==='Consulting'?ext.includes('pptx'):ext.some(x=>['pdf','docx'].includes(x)))&&st.decision.trim().length>0}
function render(track){
 if(!current(st.owner,track))return '';
 if(st.loading)return '<section class="portfolio-workspace" role="status">Memuat portfolio privat…</section>';
 const status=st.record?.status==='self_checked'?'Self-reviewed':st.record?.status==='submitted'?'Submitted':'Draft';
 const files=st.files.length?st.files.map(f=>'<div class="portfolio-file-row"><div><strong>'+h(f.filename)+'</strong><small>'+h(new Date(f.created_at).toLocaleDateString('id-ID'))+' · '+Math.round(f.bytes/1024)+' KB</small></div><div class="portfolio-file-buttons"><button type="button" data-portfolio="openfile" data-id="'+h(f.id)+'">Buka ↗</button><button type="button" data-portfolio="deletefile" data-id="'+h(f.id)+'">Hapus</button></div></div>').join(''):'<p class="portfolio-empty">Belum ada hasil kerja yang diupload.</p>';
 return '<section class="portfolio-workspace" aria-label="Private portfolio workspace"><div class="portfolio-heading"><div><span class="learning-label">YOUR PROOF OF WORK</span><h3>'+h(track)+' · Portfolio Workspace</h3><p>File milik akun lu, tersimpan privat dan bisa dibuka lagi setelah login.</p></div><strong class="portfolio-status">'+status+'</strong></div>'+
 (st.error?'<p role="alert" class="portfolio-error">'+h(st.error)+'</p>':'')+
 '<div class="portfolio-upload"><label for="portfolio-upload-file">Upload '+h(types[track])+'</label><input id="portfolio-upload-file" type="file" data-portfolio-upload accept=".pdf,.docx,.xlsx,.pptx" '+(st.busy?'disabled':'')+'><small>File nyata · privat · maksimum 15 MB per file · upload baru harus dikonfirmasi server.</small></div><div class="portfolio-files">'+files+'</div>'+
 '<label class="portfolio-label" for="portfolio-decision">Keputusan / tesis lu sendiri</label><textarea id="portfolio-decision" rows="5" placeholder="Recommendation, supporting economics, downside, diligence...">'+h(st.decision)+'</textarea>'+
 '<div class="portfolio-review"><h4>Self-review checklist</h4><p>Bukan penilaian AI atau persetujuan investment professional.</p>'+checks[track].map((t,i)=>'<label><input type="checkbox" data-portfolio-check="'+i+'" '+(st.review[i]?'checked':'')+'> '+h(t)+'</label>').join('')+'</div>'+
 '<div class="portfolio-actions"><button type="button" data-portfolio="save" '+(st.busy?'disabled':'')+'>Simpan draft</button><button type="button" data-portfolio="submit" '+(st.busy?'disabled':'')+'>Submit case</button><button type="button" data-portfolio="checked" '+(st.busy?'disabled':'')+'>Tandai self-reviewed</button></div><p class="portfolio-disclaimer">Submitted = file dan keputusan tersimpan. Self-reviewed = checklist lu sendiri lengkap, bukan expert-approved.</p></section>';
}
async function save(status){
 const o=st.owner,t=st.track;if(!current(o,t)||st.busy)return;
 if(status!=='draft'&&!valid()){st.error='Untuk submit wajib '+types[t]+' dan keputusan tertulis.';redraw();return}
 if(status==='self_checked'&&(!(checks[t].every((_,i)=>st.review[i]))||st.record?.status!=='submitted')){st.error='Submit dulu, lalu centang tiga self-check.';redraw();return}
 st.busy=true;st.error='';redraw();
 try{const res=await host.request('/rest/v1/career_portfolio_cases?on_conflict=user_id,track',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:{user_id:o,track:t,decision:st.decision.trim(),review_checks:st.review,status,updated_at:new Date().toISOString()}});
 if(!current(o,t))return;if(!res?.[0]?.user_id)throw Error('Penyimpanan tidak dikonfirmasi server.');
 st.record=res[0];host.notify('Portfolio case tersimpan: '+status)}
 catch(e){if(current(o,t))st.error='Belum tersimpan: '+e.message}
 finally{if(current(o,t)){st.busy=false;redraw()}}
}
async function upload(file){
 const o=st.owner,t=st.track;if(!current(o,t)||st.busy||!file)return;
 const ext=file.name.split('.').pop().toLowerCase();if(!['pdf','docx','xlsx','pptx'].includes(ext)||!file.size||file.size>15728640){st.error='Pilih PDF/DOCX/XLSX/PPTX hingga 15 MB';redraw();return}
 st.busy=true;st.error='';redraw();let obj;
 try{obj=await host.uploadPortfolioFile(file,t);if(!current(o,t))return;
 const res=await host.request('/rest/v1/career_portfolio_files',{method:'POST',headers:{Prefer:'return=representation'},body:{user_id:o,track:t,object_path:obj.path,filename:file.name,mime_type:obj.mime,bytes:obj.bytes}});
 if(!current(o,t))return;if(!res?.[0]?.id)throw Error('Metadata file belum tersimpan');st.files.unshift(res[0]);
 if(st.record){st.record.status='draft';await host.request(url('career_portfolio_cases',o,t),{method:'PATCH',headers:{Prefer:'return=minimal'},body:{status:'draft',updated_at:new Date().toISOString()}})}
 host.notify('File tersimpan di portfolio')}
 catch(e){if(obj?.path)try{await host.removePortfolioFile(obj.path)}catch{}if(current(o,t))st.error='Upload belum terkonfirmasi: '+e.message}
 finally{if(current(o,t)){st.busy=false;redraw()}}
}
async function view(id){
 const f=st.files.find(f=>f.id===id);if(!f)return;const o=st.owner,t=st.track;
 const tab=window.open('about:blank','_blank');try{const u=await host.signPortfolioFile(f.object_path);if(current(o,t)&&tab)tab.location.replace(u);else tab?.close()}
 catch(e){tab?.close();host.notify('Tidak dapat membuka file: '+e.message,true)}
}
async function remove(id){
 const f=st.files.find(f=>f.id===id),o=st.owner,t=st.track;if(!f||st.busy||!window.confirm('Hapus '+f.filename+'?'))return;
 st.busy=true;redraw();
 try{await host.removePortfolioFile(f.object_path);await host.request('/rest/v1/career_portfolio_files?id=eq.'+encodeURIComponent(id),{method:'DELETE'});if(current(o,t)){st.files=st.files.filter(x=>x.id!==id);host.notify('File dihapus')}}
 catch(e){if(current(o,t))st.error='Hapus tidak terkonfirmasi: '+e.message}
 finally{if(current(o,t)){st.busy=false;redraw()}}
}
function action(e){const b=e.target.closest?.('[data-portfolio]');if(!b)return false;e.preventDefault();e.stopPropagation();
 const a=b.dataset.portfolio;if(a==='save'||a==='submit'||a==='checked')void save(a==='save'?'draft':a==='submit'?'submitted':'self_checked');
 if(a==='openfile')void view(b.dataset.id);if(a==='deletefile')void remove(b.dataset.id);return true}
function change(e){const x=e.target;if(x?.dataset?.portfolioUpload!==undefined){void upload(x.files?.[0]);return true}
 if(x?.dataset?.portfolioCheck!==undefined){st.review[x.dataset.portfolioCheck]=!!x.checked;st.dirty=true;return true}return false}
function input(e){if(e.target?.id==='portfolio-decision'){st.decision=e.target.value;st.dirty=true;return true}return false}
window.SELFCareerPortfolio={init(x){host=x},reset,open,render,action,change,input,state:st};
})();
