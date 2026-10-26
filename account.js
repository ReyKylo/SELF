/* SELF account: forgot password, set a new password from the emailed link, change password in Settings.
   Pure helpers (parseRecovery, checkPassword) are unit-tested without a DOM. All requests go through the host's `request`.
   Reset mail is sent by Supabase Auth; the redirect URL must be allow-listed in the Supabase dashboard. Recovery tokens are never persisted. */
(function(root){
'use strict';
const MIN=8;
const S={busy:false,msg:'',error:false,recovery:null,email:''};

/* "#access_token=…&refresh_token=…&type=recovery" -> {access_token,refresh_token}, otherwise null. */
function parseRecovery(hash){
 const q=new URLSearchParams(String(hash||'').replace(/^#/,''));
 if(q.get('type')!=='recovery'||!q.get('access_token'))return null;
 return {access_token:q.get('access_token'),refresh_token:q.get('refresh_token')||''};
}
function checkPassword(pw,confirm){
 if(typeof pw!=='string'||pw.length<MIN)return 'Password needs at least '+MIN+' characters.';
 if(pw.length>72)return 'Password can be at most 72 characters.';
 if(pw!==confirm)return 'The two passwords do not match.';
 return '';
}
const validEmail=e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim());

let host=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function say(msg,error=false){S.msg=msg;S.error=error}

function frame(title,sub,body,bottom){
 return '<div class="auth-shell"><div class="auth-visual"><div class="brand" style="color:#fff;padding-left:0"><span class="brand-square">'+host.ic('sparkle')+'</span> SELF</div><div><div class="eyebrow" style="color:#a8c4ff">Your space to think</div><h1>One place for<br/>all the things<br/>on your mind.</h1></div><div class="small-sub">✳ Made for a mind that never stops.</div></div>'+
  '<div class="auth-login"><div class="auth-box"><div class="brand" style="padding-left:0"><span class="brand-square">'+host.ic('sparkle')+'</span> SELF</div><h2>'+esc(title)+'</h2><p class="subtitle" style="margin-bottom:30px">'+esc(sub)+'</p>'+
  (S.msg?'<p class="message'+(S.error?' error':'')+'" role="'+(S.error?'alert':'status')+'">'+esc(S.msg)+'</p>':'')+body+'<div class="auth-bottom">'+bottom+'</div></div></div></div>';
}
const pwField=(label,name)=>'<label class="form-label">'+label+'<input class="field" type="password" name="'+name+'" autocomplete="new-password" required minlength="'+MIN+'" maxlength="72" placeholder="At least '+MIN+' characters"/></label>';
function authScreen(mode){
 if(mode==='forgot')return frame('Reset your password','Enter your email and we will send a link to choose a new password.',
  '<form id="forgot-form" class="form-stack"><label class="form-label">Email address<input class="field" type="email" name="email" autocomplete="email" required value="'+esc(S.email)+'" placeholder="you@example.com"/></label><button class="primary-btn" type="submit"'+(S.busy?' disabled':'')+'>Send reset link</button></form>',
  'Remembered it? <button data-action="auth-back">Back to sign in</button>');
 return frame('Choose a new password','Use at least '+MIN+' characters. You will be signed in right after.',
  '<form id="reset-form" class="form-stack">'+pwField('New password','password')+pwField('Repeat new password','confirm')+'<button class="primary-btn" type="submit"'+(S.busy?' disabled':'')+'>Save password</button></form>',
  'Link expired? <button data-action="auth-forgot">Send a new one</button>');
}
function settingsRow(){
 return '<div class="settings-row"><div><strong>Password</strong><small>Choose a new password for '+esc(host.state().user.email)+'.</small>'+(S.msg?'<small class="'+(S.error?'error':'')+'" role="status">'+esc(S.msg)+'</small>':'')+'</div>'+
  '<form id="password-form" class="form-stack" style="min-width:260px">'+pwField('New password','password')+pwField('Repeat new password','confirm')+'<button class="ghost-btn" type="submit"'+(S.busy?' disabled':'')+'>Change password</button></form></div>';
}

async function setPassword(password){
 return host.request('/auth/v1/user',{method:'PUT',body:{password}});
}
async function submit(e){
 const form=e.target,id=form?.id;
 if(!['forgot-form','reset-form','password-form'].includes(id))return false;
 e.preventDefault();if(S.busy)return true;
 const v=Object.fromEntries(new FormData(form).entries());
 S.busy=true;say('');
 try{
  if(id==='forgot-form'){
   S.email=String(v.email||'').trim();
   if(!validEmail(S.email)){say('Enter a valid email address.',true);return true}
   const redirect=root.location?root.location.origin+(root.location.pathname||'/'):'';
   await host.request('/auth/v1/recover'+(redirect?'?redirect_to='+encodeURIComponent(redirect):''),{method:'POST',body:{email:S.email},auth:false});
   say('If that email has an account, a reset link is on its way. It can take a minute; check spam too.');
  }else{
   const bad=checkPassword(v.password,v.confirm);
   if(bad){say(bad,true);return true}
   if(id==='reset-form'){
    const t=S.recovery;if(!t){say('This reset link is not valid anymore. Request a new one.',true);return true}
    const st=host.state();st.session={access_token:t.access_token,refresh_token:t.refresh_token};
    try{st.user=await setPassword(v.password)}catch(err){st.session=null;throw err}
    S.recovery=null;host.setSession(st.session);st.loginMode='signin';say('');
    await host.enter();return true;
   }
   await setPassword(v.password);form.reset();say('Password changed.');host.toast('Password changed');
  }
 }catch(err){say(/expired|invalid|jwt/i.test(err.message)?'This reset link has expired. Request a new one.':'Could not complete that: '+err.message,true)}
 finally{S.busy=false;host.render()}
 return true;
}
/* Called once at start-up: a recovery link opens the "choose a new password" screen and never signs in on its own. */
function boot(hash){
 const t=parseRecovery(hash);if(!t)return false;
 S.recovery=t;host.state().loginMode='reset';host.state().session=null;
 try{root.history?.replaceState?.(null,'',root.location.pathname+root.location.search)}catch{}
 return true;
}
function action(a){
 const st=host.state();
 if(a==='auth-forgot'){say('');st.loginMode='forgot';st.authMessage='';host.render();return true}
 if(a==='auth-back'){say('');st.loginMode='signin';host.render();return true}
 return false;
}
function init(h){host=h}
root.SELFAccount={init,boot,submit,action,authScreen,settingsRow,parseRecovery,checkPassword,validEmail,MIN,state:S};
if(typeof module!=='undefined')module.exports=root.SELFAccount;
})(typeof window!=='undefined'?window:globalThis);
