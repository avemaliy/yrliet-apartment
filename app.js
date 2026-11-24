const $ = id => document.getElementById(id);
const canvas = $('c');
const map = $('map');
const ctx = map.getContext('2d');
let state = defaultScene();
let slots = Object.create(null);
let engine;
let pendingFrame;
let saveTimer;

function notice(message) {
  $('notice').textContent=message;
}
function inside(x,y) {
  return x>=.2 && x<=8 && y>=.2 && y<=8.2;
}
function inBox(x,y,a,b,w,d,padding=.10) {
  return x>a-padding && x<a+w+padding && y>b-padding && y<b+d+padding;
}
function itemPosition(s,key) {
  const [,x,y]=editable[key];
  return s.furniture[key] || {x,y,rotation:0};
}
function doorHit(x,y,s) {
  return doorDefinitions.some(([key,,a,b,axis,w])=>{
    const angle=doorAngle(key,axis,s.doors[key]);
    const dx=x-a, dy=y-b;
    const localX=dx*Math.cos(angle)-dy*Math.sin(angle);
    const localY=dx*Math.sin(angle)+dy*Math.cos(angle);
    return inBox(localX,localY,0,-.025,w,.05);
  });
}
function blocked(x,y,s,allowSofa=false) {
  return !inside(x,y) || walls.some(([a,b,w,d])=>{
    if(allowSofa && a===.18 && b===1.3) return false;
    return inBox(x,y,a,b,w,d);
  }) || doorHit(x,y,s) || (!allowSofa && s.sofaUnfolded && inBox(x,y,.18,1.3,1.6,2.2)) ||
    Object.keys(editable).some(key=>{
      const [,,,w,d,height]=editable[key];
      if(height!==.90) return false;
      const item=itemPosition(s,key), dx=x-item.x,dy=y-item.y;
      return inBox(dx*Math.cos(item.rotation)-dy*Math.sin(item.rotation),
        dx*Math.sin(item.rotation)+dy*Math.cos(item.rotation),-w/2,-d/2,w,d,.035);
    });
}
function onSofa(c) {
  return inBox(c.x,c.y,.18,1.3,1.6,2.2);
}
function canPlace(key,item,s) {
  const [,,,w,d,height]=editable[key];
  const cosine=Math.cos(item.rotation), sine=Math.sin(item.rotation);
  if(key==='vase') return inBox(item.x,item.y,5.77,6.77,1.01,.56,0);
  const extentX=(Math.abs(cosine)*w+Math.abs(sine)*d)/2;
  const extentY=(Math.abs(sine)*w+Math.abs(cosine)*d)/2;
  if(key==='userRug') return item.x-extentX>.15 && item.x+extentX<3.4 && item.y-extentY>.15 && item.y+extentY<5.2;
  if(key==='yrlietRug') return item.x-extentX>4.8 && item.x+extentX<8.06 && item.y-extentY>.15 && item.y+extentY<5.2;
  if(item.x-extentX<4.8 || item.x+extentX>8.06 || item.y-extentY<5.32 || item.y+extentY>8.25) return false;
  if(walls.some(([x,y,a,b])=>inBox(item.x,item.y,x-extentX+.015,y-extentY+.015,a+extentX*2-.03,b+extentY*2-.03,0))) return false;
  return !Object.keys(editable).some(other=>{
    if(other===key || editable[other][5]!==height) return false;
    const target=itemPosition(s,other);
    return Math.abs(target.x-item.x)<extentX+.21 && Math.abs(target.y-item.y)<extentY+.21;
  });
}
function verifyScene(data) {
  const candidate=validateScene(data);
  for(const [key,item] of Object.entries(candidate.furniture)) {
    if(!canPlace(key,item,candidate)) throw new Error('Niedozwolone położenie: '+editable[key][0]);
  }
  const c=candidate.camera;
  if(blocked(c.x,c.y,candidate,c.seatedOnSofa && onSofa(c)) && data.schemaVersion===undefined){
    for(const [dx,dy] of [[.34,0],[-.34,0],[0,-.34],[0,.34]]) {
      if(!blocked(c.x+dx,c.y+dy,candidate)){c.x+=dx;c.y+=dy;c.seatedOnSofa=false;break;}
    }
  }
  if(blocked(c.x,c.y,candidate,c.seatedOnSofa && onSofa(c))) throw new Error('Aparat znajduje się wewnątrz przeszkody.');
  return candidate;
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer=0;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({active:state,slots}));
    return true;
  } catch {
    notice('Zapis lokalny niedostępny. Możesz wyeksportować scenę jako JSON.');
    return false;
  }
}
function refresh(saved=true) {
  if(saved){
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>{saveTimer=0;persist();},200);
  }
  if(!pendingFrame) pendingFrame=requestAnimationFrame(draw);
}
window.addEventListener('pagehide',()=>{if(saveTimer) persist();});
function button(host,label,handler) {
  const el=document.createElement('button');
  el.type='button'; el.textContent=label; el.onclick=handler;
  host.append(el);
  return el;
}
function option(select,value,label) {
  select.add(new Option(label,value));
}
function formatTime(hour) {
  return String(Math.floor(hour)).padStart(2,'0')+':'+String(Math.round(hour%1*60)).padStart(2,'0');
}
function cameraText(c) {
  const deg = angle => (angle*180/Math.PI).toFixed(2);
  return 'x '+c.x.toFixed(3)+' m, y '+c.y.toFixed(3)+' m, wysokość '+c.height.toFixed(2)+
    ' m · obrót '+deg(c.yaw)+'° · pochylenie '+deg(c.pitch)+'° · pionowe FOV '+c.verticalFov+'° · '+$('aspect').selectedOptions[0].textContent;
}
function summaryText() {
  const lights=lightDefinitions.filter(([key])=>state.lights[key].on).map(([key,label])=>
    label+' ('+Math.round(state.lights[key].intensity*100)+'%, '+state.lights[key].kelvin+' K)');
  const list=(record,names,value)=>Object.keys(names).filter(key=>record[key]===value).map(key=>names[key]).join(', ')||'brak';
  const changed=Object.entries(state.furniture).map(([key,item])=>editable[key][0]+' x='+item.x.toFixed(2)+
    ' m, y='+item.y.toFixed(2)+' m, obrót='+(-item.rotation*180/Math.PI).toFixed(1)+'°');
  return [
    state.name+' · Yrliet Apartment '+VERSION+' · Nowy Kleparz, Kraków',
    'Pora: '+formatTime(state.timeOfDay)+' · Aparat: '+cameraText(state.camera),
    'Światła: '+(lights.join(', ')||'wyłączone'),
    'Otwarte drzwi: '+list(state.doors,Object.fromEntries(doorDefinitions.map(([key,label])=>[key,label])),true),
    'Otwarte okna: '+list(state.windows,windowNames,true)+' · zasłonięte okna: '+list(state.curtains,windowNames,true),
    'Kanapa '+(state.sofaUnfolded?'rozłożona':'złożona')+' · telewizor '+(state.televisionOn?'włączony':'wyłączony'),
    'Zmienione wyposażenie: '+(changed.join(', ')||'brak'),
  ].join('\n');
}

function drawMap() {
  ctx.fillStyle='#c4b59c';ctx.fillRect(0,0,328,336);
  ctx.fillStyle='#ece3d1';ctx.fillRect(0,0,136,208);ctx.fillRect(192,0,136,208);
  ctx.fillStyle='#393c36';
  for(const [x,y,w,d] of walls) ctx.fillRect(x*40,y*40,w*40,d*40);
  if(state.sofaUnfolded) ctx.fillRect(.18*40,1.3*40,1.6*40,2.2*40);
  for(const [key,[,,,w,d,height]] of Object.entries(editable)){
    if(height!==.90) continue;
    const item=itemPosition(state,key);
    ctx.save();ctx.translate(item.x*40,item.y*40);ctx.rotate(-item.rotation);
    ctx.fillRect(-w*20,-d*20,w*40,d*40);ctx.restore();
  }
  const {x,y,yaw}=state.camera;
  ctx.strokeStyle='#795f46';ctx.lineWidth=2;
  for(const [key,,a,b,axis,w] of doorDefinitions) {
    const angle=doorAngle(key,axis,state.doors[key]);
    ctx.beginPath(); ctx.moveTo(a*40,b*40);
    ctx.lineTo((a+w*Math.cos(angle))*40,(b-w*Math.sin(angle))*40);ctx.stroke();
  }
  ctx.fillStyle='#167e70';ctx.beginPath();ctx.arc(x*40,y*40,5,0,TAU);ctx.fill();
  ctx.strokeStyle='#167e70';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x*40,y*40);
  ctx.lineTo(x*40+Math.sin(yaw)*20,y*40-Math.cos(yaw)*20);ctx.stroke();
}
function draw() {
  pendingFrame=0;
  drawMap();
  const view=$('view'), frame=$('frame');
  const ratio=frames[state.camera.framing];
  const baseWidth=ratio===4/3?4:ratio===3/4?3:1;
  const baseHeight=baseWidth/ratio;
  const units=Math.floor(Math.min(view.clientWidth/baseWidth,view.clientHeight/baseHeight));
  const width=units*baseWidth, height=units*baseHeight;
  frame.style.width=width+'px'; frame.style.height=height+'px';
  $('grid').hidden=!state.camera.grid;
  if(width>0 && height>0 && engine && !contextLost) engine.render(state,width,height);
  $('status').textContent=cameraText(state.camera);
  $('summary').value=summaryText();
  $('clock').textContent=formatTime(state.timeOfDay);
  $('ev').textContent=state.camera.height.toFixed(2)+' m';
  $('fv').textContent=state.camera.verticalFov+'°';
}
function jump(camera) {
  if(blocked(camera.x,camera.y,state,camera.seatedOnSofa && onSofa(camera))){
    notice('To ujęcie koliduje z wyposażeniem lub drzwiami.');
    return;
  }
  state.camera=clone(camera);
  syncControls();
  refresh();
}
function move(direction) {
  const c=state.camera;
  const a=c.yaw+direction*Math.PI/2;
  for(let step=0;step<3;step++) {
    const x=c.x+Math.sin(a)*.06,y=c.y-Math.cos(a)*.06;
    if(blocked(x,y,state,c.seatedOnSofa)) break;
    Object.assign(c,{x,y});
    if(c.seatedOnSofa && !blocked(x,y,state)) c.seatedOnSofa=false;
  }
  refresh();
}
map.onclick=e=>{
  const r=map.getBoundingClientRect();
  jump({...state.camera,x:(e.clientX-r.left)/r.width*8.2,y:(e.clientY-r.top)/r.height*8.4,seatedOnSofa:false});
};
for(const [name,x,y,yaw,height,seatedOnSofa=false] of presets){
  button($('presets'),name,()=>{
    const pose={...state.camera,x,y,yaw,pitch:0,height,seatedOnSofa};
    if(blocked(x,y,state,seatedOnSofa)){
      for(const [dx,dy] of [[0,-.20],[0,.22],[-.34,0],[.34,0],[0,-.4],[0,.4]]){
        if(!blocked(x+dx,y+dy,state,seatedOnSofa)){pose.x=x+dx;pose.y=y+dy;break;}
      }
    }
    jump(pose);
  });
}
document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>move(Number(b.dataset.m)));
let pointer;
canvas.onpointerdown=e=>{
  if(pointer) return;
  pointer={id:e.pointerId,x:e.clientX,y:e.clientY,distance:0};
  canvas.setPointerCapture(e.pointerId);
};
canvas.onpointermove=e=>{
  if(!pointer || pointer.id!==e.pointerId) return;
  const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
  pointer.distance+=Math.abs(dx)+Math.abs(dy);
  pointer.x=e.clientX;pointer.y=e.clientY;
  state.camera.yaw=wrapAngle(state.camera.yaw+dx*.006);
  state.camera.pitch=Math.max(-1.45,Math.min(1.45,state.camera.pitch+dy*.005));
  refresh();
};
canvas.onpointerup=e=>{
  if(pointer?.id!==e.pointerId) return;
  if(pointer.distance<5 && document.body.classList.contains('photo')) $('photoTools').hidden=!$('photoTools').hidden;
  pointer=null;
};
canvas.onpointercancel=canvas.onlostpointercapture=()=>pointer=null;
window.addEventListener('keydown',e=>{
  if(e.key==='Escape' && document.body.classList.contains('photo')) { photoMode(false); return; }
  if(e.target.closest?.('input,select,textarea,button,[contenteditable]')||e.metaKey||e.ctrlKey||e.altKey) return;
  const k={w:0,arrowup:0,a:-1,arrowleft:-1,d:1,arrowright:1,s:2,arrowdown:2}[e.key.toLowerCase()];
  if(typeof k==='number'){e.preventDefault();move(k);}
});
for(const [id,field] of [['eye','height'],['fov','verticalFov']]){
  $(id).oninput=()=>{state.camera[field]=Number($(id).value);refresh();};
}
$('light').oninput=()=>{state.timeOfDay=Number($('light').value);refresh();};
$('aspect').onchange=()=>{state.camera.framing=$('aspect').value;refresh();};
$('showGrid').onchange=()=>{state.camera.grid=$('showGrid').checked;refresh();};
for(const [label,height] of [['Stojąca',1.65],['Siedząca',1.15],['Leżąca',.55]]){
  button($('heights'),label,()=>{state.camera.height=height;syncControls();refresh();});
}
const lightingRooms = [
  ['kitchen', 'Kuchnia', ['kitchen', 'counter']],
  ['user', 'Twój pokój', ['user', 'floor', 'userDesk']],
  ['yrliet', 'Pokój Yrliet', ['yrliet', 'bedside', 'yrlietDesk', 'bookshelf']],
  ['hall', 'Korytarz', ['hall']],
  ['bath', 'Łazienka', ['bath']],
  ['utility', 'Schowek', ['utility']],
];
const lightingRoomsKey = 'yrliet-apartment-lighting-rooms';
let expandedLightingRooms = [];
try {
  const saved = JSON.parse(localStorage.getItem(lightingRoomsKey));
  if (Array.isArray(saved)) expandedLightingRooms = saved;
} catch {
  // The lighting panel still works when local storage is unavailable.
}
const roomLightControls = lightingRooms.map(([id, name, keys]) => {
  const section = document.createElement('details');
  section.open = expandedLightingRooms.includes(id);
  const summary = document.createElement('summary');
  summary.textContent = name;
  const masterLabel = document.createElement('label');
  masterLabel.className = 'room-light-master';
  const master = document.createElement('input');
  master.type = 'checkbox';
  master.setAttribute('aria-label', 'Wszystkie światła: ' + name);
  masterLabel.append(master, 'Wszystkie światła');
  const fixtures = document.createElement('div');
  fixtures.className = 'room-light-fixtures';
  section.append(summary, masterLabel, fixtures);
  $('lights').append(section);
  master.onchange = () => {
    for (const key of keys) state.lights[key].on = master.checked;
    syncControls();
    refresh();
  };
  return {id, keys, section, fixtures, master};
});
for (const {section} of roomLightControls) {
  section.addEventListener('toggle', () => {
    const openRooms = roomLightControls.filter(room => room.section.open).map(room => room.id);
    try {
      localStorage.setItem(lightingRoomsKey, JSON.stringify(openRooms));
    } catch {
      // Expansion remains available for this visit.
    }
  });
}
const lightControls={};
for(const [key,label] of lightDefinitions) {
  const group=document.createElement('fieldset'), legend=document.createElement('legend');
  legend.textContent=label;group.append(legend);
  roomLightControls.find(room => room.keys.includes(key)).fixtures.append(group);
  const toggle=button(group,'Wyłączone',()=>{state.lights[key].on=!state.lights[key].on;syncControls();refresh();});
  toggle.setAttribute('aria-label',label);
  function range(title,field,min,max,step) {
    const label=document.createElement('label'), input=document.createElement('input'), out=document.createElement('output');
    input.type='range'; Object.assign(input,{min,max,step});
    label.append(title,input,out);group.append(label);
    input.oninput=()=>{
      state.lights[key][field]=Number(input.value);
      out.textContent=field==='kelvin'?input.value+' K':Math.round(input.value*100)+'%';
      refresh();
    };
    return {input,out};
  }
  lightControls[key]={toggle,intensity:range('Moc','intensity',0,2,.05),kelvin:range('Barwa','kelvin',2200,5500,50)};
}
for(const [label,hour,enabled] of [['Rano',8,[]],['Popołudnie',14,[]],['Wieczór',18.25,['floor','bedside','counter']],['Noc',23,['bookshelf']]]){
  button($('lightingPresets'),label,()=>{
    state.timeOfDay=hour;
    for(const [key] of lightDefinitions) state.lights[key].on=enabled.includes(key);
    syncControls();refresh();
  });
}
const toggles=[];
function interaction(el,label,read,change,collision=false){
  el.onclick=()=>{
    change();
    const c=state.camera;
    if(collision && blocked(c.x,c.y,state,c.seatedOnSofa && onSofa(c))){
      change();notice('Odsuń aparat przed zmianą.');
    }
    syncControls();refresh();
  };
  toggles.push({el,label,read});
}
for(const [key,label] of doorDefinitions) {
  interaction(button($('switches'),''),
    open=>'Drzwi · '+label+' · '+(open?'otwarte':'zamknięte'),
    ()=>state.doors[key],()=>state.doors[key]=!state.doors[key],true);
}
for(const [key,label] of Object.entries(windowNames)){
  interaction(button($('switches'),''),open=>'Okno · '+label+' · '+(open?'otwarte':'zamknięte'),
    ()=>state.windows[key],()=>state.windows[key]=!state.windows[key]);
  interaction(button($('switches'),''),closed=>'Zasłony · '+label+' · '+(closed?'zasłonięte':'odsłonięte'),
    ()=>state.curtains[key],()=>state.curtains[key]=!state.curtains[key]);
}
interaction($('sofa'),open=>open?'Złóż kanapę':'Rozłóż kanapę',()=>state.sofaUnfolded,()=>state.sofaUnfolded=!state.sofaUnfolded,true);
interaction($('tv'),on=>on?'Wyłącz telewizor':'Włącz telewizor',()=>state.televisionOn,()=>state.televisionOn=!state.televisionOn);
for(const [key,[label]] of Object.entries(editable)) option($('furniture'),key,label);
for(const [label,x,y,turn] of [['Północ',0,-.10,0],['Południe',0,.10,0],['Zachód',-.10,0,0],['Wschód',.10,0,0],['Obróć w lewo',0,0,Math.PI/12],['Obróć w prawo',0,0,-Math.PI/12]]){
  button($('editActions'),label,()=>{
    const key=$('furniture').value, item=itemPosition(state,key);
    place(key,{x:item.x+x,y:item.y+y,rotation:wrapAngle(item.rotation+turn)});
  });
}
function place(key,item) {
  const previous=state.furniture[key];
  if(item && !canPlace(key,item,state)) {notice('Przedmiot musi pozostać w swoim pomieszczeniu lub na blacie.');return;}
  if(item) state.furniture[key]=item;
  else delete state.furniture[key];
  const c=state.camera;
  if(blocked(c.x,c.y,state,c.seatedOnSofa)){
    if(previous) state.furniture[key]=previous;
    else delete state.furniture[key];
    notice('Odsuń aparat przed zmianą.');return;
  }
  notice(item?'Zmieniono położenie.':'Przywrócono położenie.');refresh();
}
$('resetFurniture').onclick=()=>place($('furniture').value,null);

function syncControls() {
  const c=state.camera;
  $('eye').value=c.height;$('fov').value=c.verticalFov;$('aspect').value=c.framing;
  $('showGrid').checked=c.grid;$('light').value=state.timeOfDay;$('sceneName').value=state.name;
  for(const [key,controls] of Object.entries(lightControls)){
    const l=state.lights[key];
    controls.toggle.textContent=l.on?'Włączone':'Wyłączone';
    controls.toggle.setAttribute('aria-pressed',l.on);
    controls.intensity.input.value=l.intensity;controls.intensity.out.textContent=Math.round(l.intensity*100)+'%';
    controls.kelvin.input.value=l.kelvin;controls.kelvin.out.textContent=l.kelvin+' K';
  }
  for (const {keys, master} of roomLightControls) {
    const enabled = keys.filter(key => state.lights[key].on).length;
    master.checked = enabled === keys.length;
    master.indeterminate = enabled > 0 && enabled < keys.length;
  }
  for(const {el,label,read} of toggles){el.textContent=label(read());el.setAttribute('aria-pressed',read());}
  updateOptions($('bookmarks'),state.bookmarks.map((b,i)=>[String(i),b.name]));
  updateOptions($('slots'),Object.keys(slots).map(key=>[key,key]));
}
function updateOptions(select,items) {
  const old=select.value;
  select.replaceChildren();
  if(!items.length) option(select,'','Brak zapisów');
  else items.forEach(item=>option(select,...item));
  if(items.some(([key])=>key===old)) select.value=old;
}
function apply(data,message) {
  state=verifyScene(data);syncControls();refresh();notice(message);
}
$('sceneName').onchange=()=>{
  const name=$('sceneName').value.trim();
  if(name) state.name=name;
  $('sceneName').value=state.name;
  refresh();
};
$('store').onclick=()=>{
  if(!slots[state.name] && Object.keys(slots).length>=40){notice('Limit zapisanych scen: 40.');return;}
  if(slots[state.name] && !window.confirm('Zastąpić zapisaną scenę „'+state.name+'”?')) return;
  slots[state.name]=clone(state);
  syncControls();$('slots').value=state.name;
  if(persist()) notice('Scena zapisana.');
};
$('restore').onclick=()=>{
  const saved=slots[$('slots').value];
  if(!saved) return;
  try {apply(saved,'Scena wczytana.');} catch(error){notice(error.message);}
};
$('deleteSlot').onclick=()=>{
  if(!$('slots').value || !window.confirm('Usunąć wybraną zapisaną scenę?')) return;
  delete slots[$('slots').value];syncControls();persist();
};
$('reset').onclick=()=>{
  if(window.confirm('Przywrócić ustawienia domyślne bieżącej sceny?')) apply(defaultScene(),'Przywrócono mieszkanie.');
};
$('addBookmark').onclick=()=>{
  const name=$('bookmarkName').value.trim();
  if(!name || state.bookmarks.length>=40){notice('Wpisz nazwę ujęcia. Limit ujęć: 40.');return;}
  state.bookmarks.push({name,camera:clone(state.camera)});$('bookmarkName').value='';
  syncControls();$('bookmarks').value=state.bookmarks.length-1;refresh();notice('Ujęcie zapisane.');
};
$('loadBookmark').onclick=()=>{
  const saved=state.bookmarks[$('bookmarks').value];
  if(saved) jump(saved.camera);
};
$('deleteBookmark').onclick=()=>{
  if($('bookmarks').value==='') return;
  state.bookmarks.splice(Number($('bookmarks').value),1);syncControls();refresh();
};
function download(url,name) {
  const a=document.createElement('a');a.href=url;a.download=name;
  document.body.append(a);a.click();a.remove();
}
$('export').onclick=()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)+'\n'],{type:'application/json'}));
  download(url,'Yrliet_Apartment.json');setTimeout(()=>URL.revokeObjectURL(url),30000);
};
$('import').onclick=()=>$('file').click();
$('file').onchange=async()=>{
  const file=$('file').files[0];$('file').value='';
  if(!file) return;
  try {
    if(file.size>250000) throw new Error('Plik przekracza limit 250 kB.');
    const data=verifyScene(JSON.parse(await file.text()));
    if(window.confirm('Wczytać „'+data.name+'” jako bieżącą scenę?')) apply(data,'Scena zaimportowana.');
  } catch(error){notice('Import nieudany. '+error.message);}
};
$('copy').onclick=async()=>{
  $('summary').value=summaryText();
  try {await navigator.clipboard.writeText($('summary').value);notice('Opis skopiowany.');}
  catch {$('summary').focus();$('summary').select();notice('Zaznaczony opis można skopiować ręcznie.');}
};

let contextLost=false;
function renderMessage(message) {
  $('renderError').hidden=!message;
  $('renderError').textContent=message;
}
try {engine=createApartment(canvas);}
catch(error){renderMessage('Widok WebGL niedostępny. '+error.message);}
canvas.addEventListener('webglcontextlost',event=>{
  event.preventDefault();contextLost=true;
  renderMessage('Widok WebGL został wstrzymany. Jeżeli nie wróci, odśwież stronę.');
});
canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;renderMessage('');refresh(false);});
function screenshot() {
  if(!engine||contextLost){renderMessage('Eksport PNG wymaga aktywnego widoku WebGL.');return;}
  if(pendingFrame) cancelAnimationFrame(pendingFrame);
  draw();
  try {download(canvas.toDataURL('image/png'),'Yrliet_POV.png');}
  catch {renderMessage('Nie udało się zapisać obrazu PNG.');}
}
$('save').onclick=$('photoSave').onclick=screenshot;
function photoMode(active) {
  document.body.classList.toggle('photo',active);
  $('photoTools').hidden=!active;
  refresh(false);
}
$('enterPhoto').onclick=()=>photoMode(true);
$('exitPhoto').onclick=()=>photoMode(false);

try {
  const data=JSON.parse(localStorage.getItem(SAVE_KEY));
  if(data?.slots && typeof data.slots==='object'){
    for(const saved of Object.values(data.slots).slice(0,40)){
      try {const scene=verifyScene(saved);slots[scene.name]=scene;} catch {notice('Pominięto uszkodzony zapis sceny.');}
    }
  }
  if(data?.active) state=verifyScene(data.active);
  else {
    const old=JSON.parse(localStorage.getItem('yrliet-v05'));
    if(old){state=verifyScene(old);notice('Wczytano zapis z wersji 0.5.');refresh();}
  }
} catch {notice('Nie udało się wczytać zapisu lokalnego.');}
syncControls();
if(window.ResizeObserver) new ResizeObserver(()=>refresh(false)).observe($('view'));
else window.addEventListener('resize',()=>refresh(false));
refresh(false);
