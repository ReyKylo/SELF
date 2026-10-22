#!/usr/bin/env node
'use strict';
// Real Chromium smoke tests of the Director Review module and its DOM interactions.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const moduleText=fs.readFileSync('career-director-review.js','utf8');
const content=fs.readFileSync('content/career-director-review/review-panels.json','utf8');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const track of ['PE','VC','CONSULTING']){
   const page=await browser.newPage({acceptDownloads:true});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('http://self.test/**',route=>{
    const url=route.request().url();
    if(url.endsWith('/content/career-director-review/review-panels.json'))return route.fulfill({status:200,contentType:'application/json',body:content});
    return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html lang="id"><body><main id="root"></main></body></html>'});
   });
   await page.goto('http://self.test/');
   await page.addScriptTag({content:moduleText});
   await page.evaluate(()=>{
    const render=()=>document.getElementById('root').innerHTML=window.SELFDirectorReview.render();
    window.__directorRender=render;
    window.SELFDirectorReview.init({render});
    document.addEventListener('click',event=>window.SELFDirectorReview.action(event));
    document.addEventListener('input',event=>window.SELFDirectorReview.input(event));
    document.addEventListener('change',event=>window.SELFDirectorReview.change(event));
    render();
   });
   await page.locator('[data-director-action="track"]').first().waitFor();
   if(track!=='PE')await page.locator('[data-director-action="track"][data-track="'+track+'"]').click();
   const submit=page.locator('[data-director-action="submit"]');
   assert.equal(await submit.isEnabled(),false,'initial submit starts disabled');
   const initial='Proceed conditionally <img src=x onerror=alert(1)> ('+track+')';
   await page.locator('#director-initial').fill(initial);
   assert.equal(await submit.isEnabled(),false,'reference is also required');
   await page.locator('#director-reference').fill('Model exhibit 01; Rp bn; assumed example');
   assert.equal(await submit.isEnabled(),true,'submit unlocks without blur');
   await submit.click();
   assert.equal(await page.locator('#director-initial').count(),0,'original answer input must be locked');
   assert.equal(await page.locator('img').count(),0,'user HTML must be escaped');
   assert.match(await page.locator('section').first().innerText(),/LOCKED ORIGINAL DECISION/);
   const prefix=track==='CONSULTING'?'CO':track;
   for(let i=1;i<=5;i++){
    const next=page.locator('[data-director-action="next"]');
    assert.equal(await next.isEnabled(),false,track+' answer required at '+i);
    await page.locator('#director-answer-'+prefix+'-D'+i).fill('Defense '+i+': model evidence and tradeoff '+track);
    assert.equal(await next.isEnabled(),true,track+' next unlocks without blur');
    await next.click();
   }
   assert.equal(await page.locator('[data-director-action="export"]').isEnabled(),false,'no partial final dossier export');
   await page.locator('#director-twist').fill('Revise assumptions with new information');
   await page.locator('#director-opposite').fill('Strongest credible downside case');
   assert.equal(await page.locator('[data-director-action="export"]').isEnabled(),false,'final required');
   await page.locator('#director-final').fill('Conditional approval with numeric diligence gates');
   assert.equal(await page.locator('[data-director-action="export"]').isEnabled(),true,'export unlocks only when complete');
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-director-action="export"]').click()]);
   assert.match(download.suggestedFilename(),new RegExp(track+'\\.txt$'));
   const data=fs.readFileSync(await download.path(),'utf8');
   assert.ok(data.includes('MODEL EVIDENCE'),'dossier generated');
   for(let i=1;i<=5;i++)assert.ok(data.includes(prefix+'-D'+i),'all challenges exported');
   assert.ok(data.includes('Conditional approval'),'final recommendation exported');
   await page.locator('[data-director-action="reset"]').first().click();
   await page.locator('#director-initial').waitFor();
   assert.equal(await page.locator('#director-initial').inputValue(),'','reset clears initial decision');
   assert.deepEqual(errors,[],'no browser page errors');
   await page.close();
   process.stdout.write('PASS: '+track+' full browser review / lock / 5 defenses / twist / export / reset / XSS escape\\n');
  }
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
