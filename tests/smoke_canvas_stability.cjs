/* SELF Photosensitivity / Canvas Stability regression. Run: node tests/smoke_canvas_stability.cjs */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const canvas=fs.readFileSync(path.join(root,'canvas-v3.js'),'utf8');
const css=fs.readFileSync(path.join(root,'canvas-v3.css'),'utf8');
assert(app.includes("state.view==='board-editor'&&window.SELFBoards?.updateInPlace?.()"),'board render must update in-place before #app replacement');
assert(canvas.includes('function updateInPlace(){'),'canvas must implement in-place update');
assert(css.includes('accessibility hotfix'),'canvas must include no-flash CSS');
assert(css.includes('backdrop-filter: none !important'),'modal must not blur/darken page');
assert(css.includes('animation: none !important'),'no canvas entrance flashes');
assert(css.includes('filter: none !important'),'objects must not brightness-pulse');
const world={querySelectorAll(){return []},querySelector(){return null},insertAdjacentHTML(){}};
const canvasElement={querySelector(){return {remove(){}}}};
const shell={dataset:{boardId:'b1'},querySelector(){return null}};
const wires={innerHTML:''};
const document={
 addEventListener(){},
 querySelector(q){return ({
 '.c3-shell':shell,
 '#c3-world':world,
 '#c3-canvas':canvasElement,
 '#c3-wires':wires
 })[q]||null},
 querySelectorAll(){return []},
 activeElement:null
};
const window={location:{search:''},addEventListener(){}};
vm.runInNewContext(canvas,{
 window,document,URL,URLSearchParams,crypto:require('node:crypto').webcrypto,
 queueMicrotask(){},setTimeout(){},clearTimeout(){},confirm:()=>true
});
const state={
 view:'board-editor',
 spaces:[],boards:[{id:'b1',title:'Visual',pan_x:0,pan_y:0,zoom:1}],
 tasks:[],knowledgeCards:[],boardItems:[],boardEdges:[]
};
const host={
 state:()=>state,render(){throw Error('Should not remount app for this test')},
 navigate(v){state.view=v},notify(){},async reload(){},async insert(){},
 async patch(){},async patchSimple(){},async del(){}
};
// Fake initial opening without a DOM rebuild:
window.SELFBoards.init({...host,render(){}});
window.SELFBoards.open('b1');
assert.match(window.SELFBoards.renderEditor(),/data-board-id="b1"/);
const beforeShell=shell;
assert.equal(window.SELFBoards.updateInPlace(),true,'update succeeds on same board');
assert.equal(shell,beforeShell,'original mounted shell preserved');
state.boards[0].title='Changed';
assert.equal(window.SELFBoards.updateInPlace(),true,'changing board metadata does not replace shell');
state.view='home';
assert.equal(window.SELFBoards.updateInPlace(),false,'other pages still use normal navigation');
console.log('PASS: no full canvas re-mount, no dark overlays, no brightness flash, existing shell remains stable.');
