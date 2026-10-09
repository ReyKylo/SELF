from pathlib import Path
import re
BASE=Path(__file__).resolve().parents[1]
original=(BASE/'source_snapshots'/'Rey_Workspace_original.html').read_text()
script_add=(BASE/'tools'/'career_additions.js').read_text()
css=(BASE/'tools'/'professional.css').read_text()
assert original.count('const pages=')==1
assert original.count('function career(){')==1
assert original.count("career:career,")==1
assert original.count("worlds:worldMap,")==1
assert original.count('function render(){document.body.dataset.page=page;')==1
# Patches are intentionally narrow.
original=original.replace('<body>', '<body class="rey-pro">',1)
original=original.replace('href="#today" class="brand"', 'href="#desk" class="brand"',1)
original=original.replace('＋ New thought</button>', '＋ Quick capture</button>',1)
original=original.replace("const pages=[['desk','✦','Blue Desk'],['today','◷','Dashboard'],['worlds','◈','Nested Worlds'],['calendar','▦','Calendar'],['planning','◎','Planning'],['journal','✎','Journal'],['learning','◇','Learning'],['library','▤','Reading & watchlist'],['career','↗','Career tracker'],['people','♧','Relationship Garden'],['trails','〰','Curiosity Trails'],['postcards','▧','Memory Postcards'],['backpack','✧','Biu’s Backpack'],['vault','▣','Vault'],['contacts','↗','Networking tracker'],['templates','❞','Template chat'],['spark','✧','Rey Spark'],['inbox','▣','Inbox ide'],['settings','⚙','Pengaturan']];", "const pages=[['desk','▦','Desk'],['career','↗','Career'],['calendar','◷','Calendar'],['backpack','⇥','Capture inbox'],['more','▦','More']];")
original=original.replace("p==='inbox'?`<em>${active('inbox').length}</em>`:''", "p==='backpack'?`<em>${active('inbox').filter(x=>!x.deletedAt).length}</em>`:''")
original=original.replace("page===p?'active':''", "(page===p||(p==='more'&&!pages.some(([id])=>id===page)))?'active':''")
original=original.replace('worlds:worldMap,','worlds:worldMapProfessional,',1)
original=original.replace('career:career,','career:careerStudio,more:moreHub,',1)
original=original.replace("if(page!=='desk')$('#main').insertAdjacentHTML('beforeend',desk.companion(page==='journal'));", "/* Biu companion hidden for professional mode; do not mutate existing data */",1)
# Append the module before render so it has data declarations in scope by runtime. Function declaration hoisting makes it callable by route table.
anchor='function render(){document.body.dataset.page=page;'
original=original.replace(anchor,script_add+'\n'+anchor,1)
# Mobile drawer retains easy entry to Career. More is the discovery hub.
original=original.replace('<button data-page="today">⌂<small>Desk</small></button>','<button data-page="desk">⌂<small>Desk</small></button>',1)
original=original.replace('<button data-page="people">♧<small>People</small></button>','<button data-page="more">▦<small>More</small></button>',1)
original=original.replace('<button data-page="calendar">▦<small>Calendar</small></button>','<button data-page="career">↗<small>Career</small></button>',1)
# Change presentation copy only (never schema, assets, or existing user records).
replacements={
 'YOUR LITTLE CORNER OF THE WORLD':'YOUR PERSONAL WORKSPACE',
 'Ada yang kepikiran, Rey<span>?</span>':'Your ideas, organized<span>.</span>',
 'Taruh di sini. Biar pelan-pelan jadi sesuatu.':'Capture your thinking, connect ideas, and move projects forward.',
 'MAKE ROOM<br>FOR A LITTLE WONDER':'FOCUS<br>AND CREATE',
 'A PLACE FOR YOUR WANDERING THOUGHTS':'YOUR SPATIAL WORKSPACE',
 'Ide kecil juga boleh.':'Start with one idea.',
 'Double-click di mana saja untuk mulai.<br>Belum perlu tahu mau jadi apa.':'Double-click to create a note, or press N.',
 '＋ Tulis ide pertama':'＋ Create first note',
 'BIU’S BACKPACK · SAVE FIRST, ORGANIZE LATER':'CAPTURE INBOX · SAVE FIRST, ORGANIZE LATER',
}
for old,new in replacements.items():
    original=original.replace(old,new)
# Style, nothing touching original storage/data semantics
original=original.replace('</head>','<style id="rey-professional-styles">\n'+css+'\n</style>\n</head>',1)
# route alias from old URLs continue to work
out=BASE/'app'/'index.html';out.write_text(original)
print('created',out,'bytes',out.stat().st_size)
