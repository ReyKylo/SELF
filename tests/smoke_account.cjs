const assert=require('assert');
const A=require('../account.js');

// recovery link parsing
assert.deepStrictEqual(A.parseRecovery('#access_token=tok&refresh_token=ref&type=recovery&expires_in=3600'),{access_token:'tok',refresh_token:'ref'});
assert.strictEqual(A.parseRecovery('#access_token=tok&type=signup'),null);
assert.strictEqual(A.parseRecovery('#type=recovery'),null);
assert.strictEqual(A.parseRecovery(''),null);assert.strictEqual(A.parseRecovery(undefined),null);

// password rules
assert(A.checkPassword('short','short'));assert(A.checkPassword('longenough','different'));assert(A.checkPassword('x'.repeat(73),'x'.repeat(73)));
assert.strictEqual(A.checkPassword('longenough1','longenough1'),'');
assert(A.validEmail('a@b.co')&&!A.validEmail('a@b')&&!A.validEmail(''));

(async()=>{
 const calls=[],state={loginMode:'signin',session:{access_token:'old'},user:null,authMessage:''};let renders=0,saved=null,entered=0,fail=null;
 const host={state:()=>state,ic:()=>'',render:()=>renders++,toast(){},formData:f=>f.values,
  request:async(path,o={})=>{calls.push([path,o.method,o.body,state.session?.access_token]);if(fail)throw new Error(fail);return path.endsWith('/user')?{id:'u1',email:'a@b.co'}:null},
  setSession:s=>{saved=s},enter:async()=>{entered++}};
 A.init(host);
 const ev=(id,values)=>({target:{id,values,reset(){}},preventDefault(){this.stopped=true}});

 // unrelated forms are ignored
 assert.strictEqual(await A.submit(ev('auth-form',{})),false);

 // forgot: generic success message (no account enumeration), recover call without auth
 let e=ev('forgot-form',{email:'  a@b.co '});assert.strictEqual(await A.submit(e),true);
 assert(e.stopped);assert.strictEqual(calls[0][0].startsWith('/auth/v1/recover'),true);assert.deepStrictEqual(calls[0][2],{email:'a@b.co'});
 assert.match(A.state.msg,/If that email has an account/);assert.strictEqual(A.state.error,false);
 calls.length=0;await A.submit(ev('forgot-form',{email:'nope'}));assert.strictEqual(calls.length,0);assert.strictEqual(A.state.error,true);

 // recovery link boots the reset screen and never signs in
 assert.strictEqual(A.boot('#access_token=rec&refresh_token=rr&type=recovery'),true);
 assert.strictEqual(state.loginMode,'reset');assert.strictEqual(state.session,null);
 assert.match(A.authScreen('reset'),/id="reset-form"/);assert.match(A.authScreen('forgot'),/id="forgot-form"/);

 // reset: mismatch and weak passwords never hit the network
 calls.length=0;await A.submit(ev('reset-form',{password:'abcdefgh1',confirm:'zzz'}));await A.submit(ev('reset-form',{password:'abc',confirm:'abc'}));
 assert.strictEqual(calls.length,0);
 // reset success: PUT /auth/v1/user with the recovery token, then session is saved and the app loads
 await A.submit(ev('reset-form',{password:'newpassword1',confirm:'newpassword1'}));
 assert.deepStrictEqual(calls[0].slice(0,4),['/auth/v1/user','PUT',{password:'newpassword1'},'rec']);
 assert.deepStrictEqual(saved,{access_token:'rec',refresh_token:'rr'});assert.strictEqual(entered,1);assert.strictEqual(state.loginMode,'signin');
 // the recovery token is single use in the UI
 calls.length=0;await A.submit(ev('reset-form',{password:'newpassword1',confirm:'newpassword1'}));assert.strictEqual(calls.length,0);assert.match(A.state.msg,/not valid anymore/);

 // expired link: server error becomes a clear message and the session is cleared
 A.boot('#access_token=rec2&type=recovery');fail='JWT expired';
 await A.submit(ev('reset-form',{password:'newpassword1',confirm:'newpassword1'}));
 assert.match(A.state.msg,/expired/);assert.strictEqual(state.session,null);fail=null;

 // expired link arriving as an error hash opens "forgot" with an explanation
 state.loginMode='signin';assert.strictEqual(A.boot('#error=access_denied&error_code=otp_expired&error_description=x'),true);
 assert.strictEqual(state.loginMode,'forgot');assert.match(A.state.msg,/expired or was already used/);
 assert.strictEqual(A.boot('#something=else'),false);

 // change password while signed in uses the live session
 state.user={id:'u1',email:'a@b.co'};state.session={access_token:'live'};calls.length=0;
 await A.submit(ev('password-form',{password:'anotherpass1',confirm:'anotherpass1'}));
 assert.deepStrictEqual(calls[0].slice(0,4),['/auth/v1/user','PUT',{password:'anotherpass1'},'live']);assert.match(A.state.msg,/Password changed/);
 assert.match(A.settingsRow(),/id="password-form"/);

 // actions
 assert.strictEqual(A.action('auth-forgot'),true);assert.strictEqual(state.loginMode,'forgot');
 assert.strictEqual(A.action('auth-back'),true);assert.strictEqual(state.loginMode,'signin');assert.strictEqual(A.action('other'),false);
 console.log('smoke_account OK');
})().catch(e=>{console.error(e);process.exit(1)});
