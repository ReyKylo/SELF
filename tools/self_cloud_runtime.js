/* SELF Cloud Sync V1.
 * Appended inside the existing SELF module at build time; never edits the
 * checksummed 4.5 MB source or browser IndexedDB structure.
 * No Bintang Trader integrations, secrets, repos or shared storage.
 */
let selfCloudOnSave = null;
function selfCloudDidPersist() {
  try { if (typeof selfCloudOnSave === 'function') selfCloudOnSave(); }
  catch (error) { console.warn('SELF cloud queue error', error); }
}

async function initSelfCloudV1() {
  const URL_BASE = 'https://btiwxqjiptbwaunjibjh.supabase.co';
  const API_KEY = 'sb_publishable_rdMRKvMBukGd0Wc42wxbnA_pXn-9usG';
  const SESSION_KEY = 'self-cloud-session-v1';
  const INDEX_PREFIX = 'self-cloud-index-v1:';
  const BATCH_SIZE = 60;
  const BATCH_BYTES = 800000;

  let session = null;
  let user = null;
  let revision = 0;
  let hashes = Object.create(null);
  let ready = false;
  let pushing = false;
  let pushAgain = false;
  let timer = 0;
  let currentEmail = '';

  const style = document.createElement('style');
  style.id = 'self-cloud-style';
  style.textContent = [
    '#scOpen{position:fixed;right:18px;bottom:18px;z-index:23000;padding:11px 16px;',
    'border:1px solid #bfd1e7;border-radius:15px;color:#234875;background:#fff;',
    'box-shadow:0 7px 30px #102d5222;font:600 13px system-ui;cursor:pointer}',
    '#scPanel{position:fixed;right:18px;bottom:68px;z-index:23001;',
    'width:min(355px,calc(100vw - 36px));padding:20px;border-radius:20px;',
    'background:#fff;color:#213f62;border:1px solid #c7d7eb;box-shadow:0 15px 55px #16325238;',
    'font:14px/1.5 system-ui}',
    '#scPanel[hidden]{display:none!important}',
    '#scPanel h2{font-size:18px;margin:0 0 4px;color:#234875}',
    '#scPanel p{margin:7px 0 12px;font-size:12px;color:#536d87}',
    '#scPanel label{display:block;font-size:12px;font-weight:650;margin:9px 0 4px}',
    '#scPanel input{width:100%;box-sizing:border-box;border:1px solid #bccde1;',
    'border-radius:9px;padding:10px;background:#fff;color:#193a60}',
    '#scPanel button{cursor:pointer;border:1px solid #b9cde5;background:#f1f6fc;color:#234875;',
    'border-radius:10px;padding:9px 11px;font-weight:650;font-size:12px}',
    '#scPanel button.primary{background:#2d639e;color:white;border-color:#2d639e}',
    '#scPanel button:disabled{opacity:.5;cursor:wait}',
    '#scPanel .sc-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}',
    '#scPanel .sc-small{font-size:11px;color:#647a8d}',
    '#scPanel #scNotice{min-height:18px;white-space:pre-wrap;overflow-wrap:anywhere}',
    '#scPanel .sc-close{float:right}',
    '#scPanel #scUser{font-size:12px;overflow-wrap:anywhere}',
    '#scPanel #scMember[hidden],#scPanel #scGuest[hidden]{display:none!important}',
    '@media(max-width:600px){#scOpen{right:12px;bottom:12px}#scPanel{right:12px;bottom:60px}}'
  ].join('');
  document.head.appendChild(style);

  const openButton = document.createElement('button');
  openButton.id = 'scOpen';
  openButton.type = 'button';
  openButton.textContent = '☁ SELF Cloud';
  const panel = document.createElement('aside');
  panel.id = 'scPanel';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'SELF cloud backup');
  panel.innerHTML =
    '<button id="scClose" class="sc-close" type="button" aria-label="Close cloud panel">×</button>' +
    '<h2>SELF Cloud</h2><p>Private, local-first backup. Only changed records are uploaded.</p>' +
    '<div id="scNotice" role="status">Local only · cloud not connected.</div>' +
    '<div id="scGuest"><label for="scEmail">Your email</label>' +
    '<input id="scEmail" autocomplete="email" type="email" placeholder="you@example.com"/>' +
    '<div class="sc-row"><button class="primary" id="scMagic" type="button">Email sign-in link</button></div>' +
    '<p class="sc-small">The email usually contains a magic link. If you have an email OTP code, enter it below.</p>' +
    '<label for="scCode">Optional 6-digit email code</label>' +
    '<input id="scCode" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="123456"/>' +
    '<div class="sc-row"><button id="scVerify" type="button">Verify code</button></div></div>' +
    '<div id="scMember" hidden><div id="scUser"></div>' +
    '<div class="sc-row"><button class="primary" id="scNow" type="button">Sync changes</button>' +
    '<button id="scRestore" type="button">Restore from cloud</button></div>' +
    '<div class="sc-row"><button id="scSignOut" type="button">Sign out</button></div></div>' +
    '<p class="sc-small">Changes stay on this device first. Cloud restore downloads a local JSON backup before replacing records. File attachments remain device-local in V1.</p>';
  document.body.appendChild(openButton);
  document.body.appendChild(panel);
  const get = (id) => document.getElementById(id);
  const notice = (text) => {
    get('scNotice').textContent = text;
    openButton.textContent = ready ? '☁ SELF · synced' : '☁ SELF Cloud';
  };
  const setMemberUI = () => {
    get('scGuest').hidden = !!user;
    get('scMember').hidden = !user;
    get('scUser').textContent = user ? 'Signed in: ' + (user.email || user.id) : '';
    get('scNow').disabled = !ready || pushing;
    get('scRestore').disabled = !user || pushing;
  };
  openButton.addEventListener('click', () => { panel.hidden = !panel.hidden; });
  get('scClose').addEventListener('click', () => { panel.hidden = true; });

  function storeSession(newSession) {
    session = newSession ? {
      access_token: newSession.access_token,
      refresh_token: newSession.refresh_token,
      expires_at: newSession.expires_at ||
        (Date.now() + 1000 * Number(newSession.expires_in || 3600))
    } : null;
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch (error) { notice('Browser session storage is unavailable: ' + error.message); }
  }

  async function refreshTokenIfNeeded() {
    if (!session) throw Error('Please sign in first.');
    if (Date.now() < Number(session.expires_at || 0) - 60000) return;
    const res = await fetch(URL_BASE + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: {'apikey':API_KEY,'Content-Type':'application/json'},
      body: JSON.stringify({refresh_token:session.refresh_token})
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.access_token) throw Error('Your session expired; please sign in again.');
    storeSession(body);
  }

  async function api(path, options = {}) {
    const authenticated = options.auth !== false;
    if (authenticated) await refreshTokenIfNeeded();
    const headers = {'apikey':API_KEY};
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.body !== undefined && path.startsWith('/rest/v1/self_investment_documents')) headers.Prefer = 'return=representation';
    if (authenticated) headers.Authorization = 'Bearer ' + session.access_token;
    const response = await fetch(URL_BASE + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: 'no-store'
    });
    const raw = await response.text();
    let body = null;
    try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }
    if (!response.ok) {
      const message = body && (body.message || body.msg || body.error_description || body.error) ||
        ('Cloud request failed: HTTP ' + response.status);
      throw Error(String(message));
    }
    return body;
  }

  function loadIndex(id) {
    try {
      const state = JSON.parse(localStorage.getItem(INDEX_PREFIX + id) || 'null');
      if (!state || !Number.isSafeInteger(state.revision) || !state.hashes ||
          Array.isArray(state.hashes) || typeof state.hashes !== 'object') return null;
      return state;
    } catch { return null; }
  }

  function saveIndex() {
    if (!user) return;
    localStorage.setItem(INDEX_PREFIX + user.id,
      JSON.stringify({revision:revision,hashes:hashes}));
  }

  async function remoteRevision() {
    const rows = await api('/rest/v1/self_sync_state?select=revision&user_id=eq.' +
      encodeURIComponent(user.id));
    return rows && rows[0] ? Number(rows[0].revision) : 0;
  }

  function fingerprint(value) {
    const raw = JSON.stringify(value);
    let a = 2166136261, b = 5381;
    for (let i = 0; i < raw.length; i++) {
      const c = raw.charCodeAt(i);
      a = Math.imul(a ^ c, 16777619);
      b = (Math.imul(b, 33) ^ c) >>> 0;
    }
    return raw.length.toString(36) + ':' + (a >>> 0).toString(36) +
      ':' + (b >>> 0).toString(36);
  }
  const makeKey = (type, id) => type + '\u001f' + id;
  const splitKey = (key) => {
    const split = key.indexOf('\u001f');
    return [key.slice(0, split), key.slice(split + 1)];
  };
  function collect() {
    const local = Object.create(null);
    for (const type of TYPES) {
      for (const record of (Array.isArray(data[type]) ? data[type] : [])) {
        if (!record || typeof record.id !== 'string') continue;
        const key = makeKey(type, record.id);
        local[key] = {collection:type,record_id:record.id,payload:record,hash:fingerprint(record)};
      }
    }
    const meta = {items:activity};
    local[makeKey('activity', 'recent')] =
      {collection:'activity',record_id:'recent',payload:meta,hash:fingerprint(meta)};
    return local;
  }
  function changedRecords(local) {
    const changes = [];
    for (const [key, item] of Object.entries(local)) {
      if (hashes[key] !== item.hash) changes.push({
        collection:item.collection,record_id:item.record_id,
        payload:item.payload,deleted:false,key:key,hash:item.hash
      });
    }
    for (const key of Object.keys(hashes)) {
      if (!Object.hasOwn(local, key)) {
        const pair = splitKey(key);
        changes.push({collection:pair[0],record_id:pair[1],deleted:true,key:key});
      }
    }
    return changes;
  }
  function batchesOf(changes) {
    const batches = [], current = [];
    let size = 2;
    for (const change of changes) {
      const body = {collection:change.collection,record_id:change.record_id,
        deleted:change.deleted,payload:change.deleted ? null : change.payload};
      const bytes = new TextEncoder().encode(JSON.stringify(body)).length;
      if (bytes > 1300000) throw Error('One record is too large to sync safely; export a backup instead.');
      if (current.length && (current.length >= BATCH_SIZE || size + bytes > BATCH_BYTES)) {
        batches.push(current.splice(0)); size = 2;
      }
      current.push({body:body,key:change.key,hash:change.hash,deleted:change.deleted});
      size += bytes + 2;
    }
    if (current.length) batches.push(current);
    return batches;
  }

  function schedule() {
    if (!ready || !user || recoveryBlocked) return;
    if (pushing) { pushAgain = true; return; }
    clearTimeout(timer);
    timer = setTimeout(() => { void push().catch(handleSyncError); }, 3500);
  }

  function handleSyncError(error) {
    const message = String(error && error.message || error);
    if (message.includes('SELF_SYNC_CONFLICT')) {
      ready = false;
      notice('Cloud changed on another device. Local data is safe. Review and restore cloud before syncing again.');
    } else notice('Saved on this device. Cloud sync issue: ' + message);
    setMemberUI();
  }

  async function push() {
    if (!ready || !user || recoveryBlocked) return;
    if (pushing) { pushAgain = true; return; }
    clearTimeout(timer);
    pushing = true;
    setMemberUI();
    try {
      const local = collect();
      const changes = changedRecords(local);
      if (!changes.length) { notice('Cloud up to date · local data preserved.'); return; }
      const batches = batchesOf(changes);
      notice('Syncing ' + changes.length + ' changed record(s)…');
      for (const batch of batches) {
        if (!ready) throw Error('Cloud link is no longer safe to sync.');
        const updated = await api('/rest/v1/rpc/self_apply_changes',
          {method:'POST',body:{p_expected_revision:revision,
            p_changes:batch.map(x => x.body)}});
        const next = Number(updated);
        if (!Number.isSafeInteger(next) || next !== revision + 1)
          throw Error('Unexpected server sync revision.');
        revision = next;
        for (const item of batch) {
          if (item.deleted) delete hashes[item.key];
          else hashes[item.key] = item.hash;
        }
        saveIndex();
      }
      notice('Cloud up to date · ' + changes.length + ' record(s) backed up.');
    } finally {
      pushing = false;
      setMemberUI();
      if (pushAgain) { pushAgain = false; schedule(); }
    }
  }

  async function linkAfterSignIn() {
    const identity = await api('/auth/v1/user');
    if (!identity || !identity.id) throw Error('Could not verify Supabase session.');
    user = {id:identity.id,email:identity.email || ''};
    revision = await remoteRevision();
    const prior = loadIndex(user.id);
    hashes = Object.assign(Object.create(null), prior ? prior.hashes : {});
    ready = (revision === 0 && (!prior || prior.revision === 0)) ||
      (!!prior && prior.revision === revision);
    if (ready) {
      notice('Signed in. Local changes will sync safely to SELF Cloud.');
      schedule();
    } else {
      notice('Cloud has another version. Your local data is untouched. ' +
        'Use Restore from cloud (a local backup is downloaded first).');
    }
    setMemberUI();
  }

  async function fetchCloud() {
    const all = [];
    let offset = 0;
    for (let pageNum = 0; pageNum < 100; pageNum++) {
      const chunk = await api('/rest/v1/self_records?select=collection,record_id,payload,deleted_at' +
        '&user_id=eq.' + encodeURIComponent(user.id) +
        '&order=collection.asc,record_id.asc&limit=500&offset=' + offset);
      if (!Array.isArray(chunk)) throw Error('Invalid cloud response.');
      all.push(...chunk);
      if (chunk.length < 500) return all;
      offset += chunk.length;
    }
    throw Error('Cloud record limit reached: export and review data first.');
  }

  async function restore() {
    if (!user || pushing) return;
    get('scRestore').disabled = true;
    try {
      notice('Reading SELF Cloud records…');
      const beforeRevision = await remoteRevision();
      const rows = await fetchCloud();
      if (beforeRevision !== await remoteRevision()) throw Error('Cloud changed during download. Please retry.');
      if (beforeRevision === 0 && rows.length === 0) {
        notice('No cloud backup exists yet. Sync from this device first.');
        return;
      }
      const replacement = blank();
      let nextActivity = [];
      for (const row of rows) {
        if (row.deleted_at) continue;
        if (row.collection === 'activity') {
          if (row.record_id === 'recent' && Array.isArray(row.payload?.items))
            nextActivity = row.payload.items;
        } else if (TYPES.includes(row.collection)) {
          replacement[row.collection].push(row.payload);
        }
      }
      const candidate = {version:1,data:replacement,activity:nextActivity};
      if (!validBackup(candidate)) throw Error('Cloud backup failed SELF validation; no local changes made.');
      if (!window.confirm('Restore SELF cloud records to this browser? We will DOWNLOAD ' +
          'your current local backup before replacing local records. File attachments are not transferred.'))
        return;

      const archive = await workspaceStorage.exportArchive({version:1,data:data,activity:activity});
      download(JSON.stringify(archive,null,2),'application/json',
        'SELF_Local_Before_Cloud_Restore_' + today() + '.json');
      const oldData = data, oldActivity = activity;
      try {
        data = replacement; activity = nextActivity;
        await workspaceStorage.save(candidate);
      } catch (error) {
        data = oldData; activity = oldActivity;
        throw error;
      }
      recoveryBlocked = false;
      hashes = Object.create(null);
      for (const [key, item] of Object.entries(collect())) hashes[key] = item.hash;
      revision = beforeRevision;
      saveIndex();
      ready = true;
      render();
      notice('Cloud restored to this browser; local backup downloaded.');
      schedule();
    } catch (error) { handleSyncError(error); }
    finally { setMemberUI(); }
  }

  get('scMagic').addEventListener('click', async () => {
    const email = get('scEmail').value.trim();
    if (!email || !get('scEmail').checkValidity()) {
      notice('Enter a valid email address.'); return;
    }
    currentEmail = email;
    get('scMagic').disabled = true;
    try {
      const redirect = location.origin + location.pathname;
      await api('/auth/v1/otp?redirect_to=' + encodeURIComponent(redirect), {
        auth:false,method:'POST',body:{email:email,create_user:true}
      });
      notice('Sign-in email requested. Check your inbox; open the link on this device. ' +
        'Your deployment URL must be allowlisted in Supabase Auth settings.');
    } catch (error) { notice('Sign-in request failed: ' + error.message); }
    finally { get('scMagic').disabled = false; }
  });

  get('scVerify').addEventListener('click', async () => {
    const email = get('scEmail').value.trim() || currentEmail;
    const token = get('scCode').value.trim();
    if (!email || !token) { notice('Enter your email and the code from the email.'); return; }
    get('scVerify').disabled = true;
    try {
      const result = await api('/auth/v1/verify',{
        auth:false,method:'POST',body:{email:email,token:token,type:'email'}
      });
      if (!result.access_token || !result.refresh_token) throw Error('No session returned.');
      storeSession(result);
      await linkAfterSignIn();
    } catch (error) { notice('Could not verify code: ' + error.message); }
    finally { get('scVerify').disabled = false; }
  });

  get('scNow').addEventListener('click', () => { void push().catch(handleSyncError); });
  get('scRestore').addEventListener('click', () => { void restore(); });
  get('scSignOut').addEventListener('click', async () => {
    if (pushing) { notice('Finish the current upload before signing out.'); return; }
    clearTimeout(timer);
    const oldToken = session?.access_token;
    try {
      if (oldToken) await api('/auth/v1/logout',{method:'POST'});
    } catch { /* Client sign-out remains safe if offline. */ }
    storeSession(null);
    user = null; ready = false; revision = 0; hashes = Object.create(null);
    notice('Signed out. Local records are still available on this device.');
    setMemberUI();
  });
  window.addEventListener('online', schedule);
  // Reuse authenticated SELF Cloud session for separately RLS-scoped Investment Vault.
  // The bridge never exposes a secret key or session token to Investment modules.
  window.selfInvestmentCloudBridge = Object.freeze({
    async list(){
      if(!user)throw Error('Sign in using the SELF Cloud panel first.');
      return {userId:user.id,rows:await api('/rest/v1/self_investment_documents?select=document_key,revision,payload,updated_at&user_id=eq.'+encodeURIComponent(user.id))};
    },
    async write(kind,payload,revision){
      if(!user)throw Error('Sign in using the SELF Cloud panel first.');
      if(!['academy','research','model','memo','icdeck','curriculum'].includes(kind))throw Error('Invalid investment document.');
      if(!Number.isSafeInteger(revision)||revision<0)throw Error('Invalid cloud revision.');
      if(JSON.stringify(payload).length>450000)throw Error('Investment document exceeds cloud limit.');
      if(revision===0)return api('/rest/v1/self_investment_documents',{method:'POST',body:{user_id:user.id,document_key:kind,revision:1,payload}});
      const query='?user_id=eq.'+encodeURIComponent(user.id)+'&document_key=eq.'+encodeURIComponent(kind)+'&revision=eq.'+revision;
      return api('/rest/v1/self_investment_documents'+query,{method:'PATCH',body:{payload,revision:revision+1,updated_at:new Date().toISOString()}});
    }
  });
  selfCloudOnSave = schedule;

  // Supabase's implicit magic-link callback arrives in the fragment.
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  if (params.has('access_token') && params.has('refresh_token')) {
    storeSession({
      access_token:params.get('access_token'),
      refresh_token:params.get('refresh_token'),
      expires_in:Number(params.get('expires_in') || 3600)
    });
    history.replaceState(null,'',location.pathname + location.search + '#career');
    navigate('career');
  } else if (params.has('error_description')) {
    notice('Sign-in link failed: ' + params.get('error_description'));
    history.replaceState(null,'',location.pathname + location.search + '#career');
    navigate('career');
  } else {
    try {
      const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (saved?.access_token && saved?.refresh_token) session = saved;
    } catch { session = null; }
  }
  if (session) {
    try { await linkAfterSignIn(); }
    catch (error) {
      storeSession(null);
      user = null; ready = false;
      notice('Cloud sign-in needs renewal: ' + error.message);
      setMemberUI();
    }
  }
}
void initSelfCloudV1().catch(error => {
  console.error('SELF Cloud initialization failed:', error);
});
