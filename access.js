/* SELF access: who gets Study (the personal finance-career curriculum). Everyone else gets Today, Work, Hunt and Studio:
   no Study door, palette entry, page or synced progress. Hunt (Tracker, Pipeline, Outreach, Companies) is for every account.
   This is a UI gate, not a security boundary: the lesson files are public static assets and Career tables are RLS-private. */
(function(root){
'use strict';
const OWNERS=['4e02f8ef-4c27-4547-94a5-176476815a16'];
const extra=()=>Array.isArray(root.__SELF_CAREER_OWNERS)?root.__SELF_CAREER_OWNERS:[];
const study=user=>!!user&&typeof user.id==='string'&&(OWNERS.includes(user.id)||extra().includes(user.id));
root.SELFAccess={study,radar:study,OWNERS};
if(typeof module!=='undefined')module.exports=root.SELFAccess;
})(typeof window!=='undefined'?window:globalThis);
