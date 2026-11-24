const panels = [...document.querySelectorAll('[data-panel]')];
const tabs = [...document.querySelectorAll('[data-tab]')];
let activePanel = 'lighting';
let sheetLevel = 0;
function setSheet(level) {
  sheetLevel = Math.max(0,Math.min(2,level));
  $('controls').dataset.level = sheetLevel;
  $('lower').disabled = sheetLevel===0;
  $('raise').disabled = sheetLevel===2;
  $('panels').inert = sheetLevel===0;
  $('settings').setAttribute('aria-expanded',String(activePanel==='settingsPanel' && sheetLevel>0));
}
function openPanel(id,level=1) {
  activePanel=id;
  for(const panel of panels) panel.hidden=panel.id!==id;
  for(const tab of tabs) tab.setAttribute('aria-current',String(tab.dataset.tab===id));
  $('panels').scrollTop=0;
  setSheet(level);
}
for(const tab of tabs) tab.onclick=()=>openPanel(tab.dataset.tab,activePanel===tab.dataset.tab && sheetLevel ? 0 : Math.max(1,sheetLevel));
$('settings').onclick=()=>openPanel('settingsPanel',activePanel==='settingsPanel' && sheetLevel ? 0 : 1);
$('lower').onclick=()=>setSheet(sheetLevel-1);
$('raise').onclick=()=>setSheet(sheetLevel+1);
const grip=$('sheetGrip');
let drag;
grip.onpointerdown=e=>{
  if(e.target.closest('button') || e.button!==0 || drag) return;
  drag={id:e.pointerId,y:e.clientY};
  grip.setPointerCapture(e.pointerId);
};
grip.onpointerup=e=>{
  if(drag?.id!==e.pointerId) return;
  const dy=e.clientY-drag.y;
  if(Math.abs(dy)>25) setSheet(sheetLevel-Math.sign(dy));
  drag=null;
};
grip.onpointercancel=grip.onlostpointercapture=()=>drag=null;

$('mode').onchange=()=>{
  mode=$('mode').value;
  $('context').hidden=true;
  placing=null;
  if(mode==='interior'){
    selectedFurniture=$('furniture').value;
    openPanel('interior');
  } else if(mode==='director') openPanel('director');
  else openPanel('lighting',0);
  refresh(false);
};
$('mapToggle').onclick=()=>{
  $('navigation').hidden=!$('navigation').hidden;
  $('mapToggle').setAttribute('aria-expanded',String(!$('navigation').hidden));
};
$('previous').onclick=()=>{
  if(previousCamera) jump(previousCamera);
  else notice('Brak poprzedniego położenia.');
};
$('furniture').onchange=()=>{selectedFurniture=$('furniture').value;refresh(false);};
function replayFurniture(from,to,field) {
  const edit=from[from.length-1];
  if(edit && place(edit.key,edit[field],false)){
    from.pop();to.push(edit);
    $('furniture').value=selectedFurniture=edit.key;
    studioSync();
  }
}
$('undo').onclick=()=>replayFurniture(undoStack,redoStack,'before');
$('redo').onclick=()=>replayFurniture(redoStack,undoStack,'after');

function currentRoom(c=effectiveCamera(state)) {
  if(c.x<3.52) return c.y<5.25?'user':'bath';
  if(c.x>4.68) return c.y<5.25?'yrliet':'kitchen';
  return c.y<1.71?'utility':'hall';
}
let displayedRoom;
studioDraw=()=>{
  const room=currentRoom();
  $('room').textContent=lightingRooms.find(([id])=>id===room)[1];
  $('topTime').textContent=formatTime(state.timeOfDay);
  $('topWeather').textContent=weatherProfiles[state.weather][0];
  if(room!==displayedRoom){
    const current=roomLightControls.find(entry=>entry.id===room);
    for(const entry of roomLightControls) entry.section.setAttribute('aria-current',String(entry===current));
    $('lights').prepend(current.section);
    displayedRoom=room;
  }
  syncPrecision();
};

for(const [id,[name]] of Object.entries(weatherProfiles)) option($('weather'),id,name);
$('weather').onchange=()=>{state.weather=$('weather').value;refresh();};
$('sceneDate').onchange=()=>{state.date=$('sceneDate').value;refresh();};
for(const [name,time] of [['Świt',6],['Rano',8],['Południe',12],['Zmierzch',18.25],['Noc',23]]){
  button($('timePresets'),name,()=>{state.timeOfDay=time;syncControls();refresh();});
}

const lightingDefaults=[
  ['Poranna kawa',8,['kitchen','counter']],['Wieczorny film',19,['floor']],
  ['Późna rozmowa',22,['floor','bedside','bookshelf']],['Noc',23,['bookshelf']],
  ['Rano',8,[]],['Popołudnie',14,[]],['Wieczór',18.25,['floor','bedside','counter']],
  ['Wszystkie włączone',null,keysFor(lightDefinitions)],['Wszystkie wyłączone',null,[]],
];
const presetKey='yrliet-apartment-light-presets';
let customPresets=[];
try {
  const entries=JSON.parse(localStorage.getItem(presetKey));
  if(Array.isArray(entries)){
    for(const entry of entries.slice(0,40)){
      try {
        const scene=validateScene({...defaultScene(),name:entry.name,lights:entry.lights,...entry.atmosphere});
        customPresets.push({name:scene.name,lights:scene.lights,
          atmosphere:entry.atmosphere?{timeOfDay:scene.timeOfDay,weather:scene.weather}:null});
      } catch { /* Skip an invalid local preset. */ }
    }
  }
} catch { /* Presets remain available for the session. */ }
const presetHost=$('lightingPresets');
const presetSelect=document.createElement('select');
presetSelect.setAttribute('aria-label','Zapisane ustawienia światła');
presetHost.append(presetSelect);
const atmosphereLabel=document.createElement('label'), includeAtmosphere=document.createElement('input');
includeAtmosphere.type='checkbox';
atmosphereLabel.append(includeAtmosphere,'Zapisz również porę i pogodę');
function syncPresets() {
  updateOptions(presetSelect,[
    ...lightingDefaults.map(([name,time],i)=>['default'+i,name+(time===null?' · światło':' · światło i atmosfera')]),
    ...customPresets.map((p,i)=>[String(i),p.name+(p.atmosphere?' · światło i atmosfera':' · światło')]),
  ]);
}
function savePresets(index) {
  syncPresets();
  if(index!==undefined) presetSelect.value=String(index);
  try {localStorage.setItem(presetKey,JSON.stringify(customPresets));}
  catch {notice('Ustawienia zapisano tylko na czas tej sesji.');}
}
function requestName(title,value='') {
  return window.prompt(title,value)?.trim().slice(0,80);
}
function snapshotLights(name) {
  return {name,lights:clone(state.lights),atmosphere:includeAtmosphere.checked?
    {timeOfDay:state.timeOfDay,weather:state.weather}:null};
}
button(presetHost,'Włącz ustawienie',()=>{
  const value=presetSelect.value;
  if(value.startsWith('default')){
    const [,time,enabled]=lightingDefaults[Number(value.slice(7))];
    for(const [key] of lightDefinitions) state.lights[key].on=enabled.includes(key);
    if(time!==null) state.timeOfDay=time;
  } else {
    const preset=customPresets[Number(value)];
    state.lights=clone(preset.lights);
    if(preset.atmosphere) Object.assign(state,preset.atmosphere);
  }
  syncControls();refresh();
});
presetHost.append(atmosphereLabel);
button(presetHost,'Nowe własne',()=>{
  if(customPresets.length>=40){notice('Limit ustawień: 40.');return;}
  const name=requestName('Nazwa ustawienia światła');
  if(name){customPresets.push(snapshotLights(name));savePresets(customPresets.length-1);}
});
function editPreset(change) {
  const index=Number(presetSelect.value), preset=customPresets[index];
  if(!preset){notice('Wybierz własne ustawienie.');return;}
  change(preset,index);
}
button(presetHost,'Zmień nazwę',()=>editPreset((preset,index)=>{
  const name=requestName('Nazwa ustawienia światła',preset.name);
  if(name){preset.name=name;savePresets(index);}
}));
button(presetHost,'Aktualizuj',()=>editPreset((preset,index)=>{
  customPresets[index]=snapshotLights(preset.name);savePresets(index);
}));
button(presetHost,'Usuń ustawienie',()=>editPreset((preset,index)=>{
  if(window.confirm('Usunąć „'+preset.name+'”?')){customPresets.splice(index,1);savePresets();}
}));
syncPresets();

const toDegrees = 180/Math.PI;
function numeric(host,title,min,max,step,onChange) {
  const label=document.createElement('label'), input=document.createElement('input');
  input.type='number';
  Object.assign(input,{min,max,step});
  input.onchange=()=>{
    if(input.value!=='' && Number.isFinite(input.valueAsNumber)){
      onChange(Math.max(min,Math.min(max,input.valueAsNumber)));
    }
    syncControls();refresh();
  };
  label.append(title,input);host.append(label);
  return input;
}
function head(field,value) {
  const marker=state.characters[state.perspective];
  const angle=value/toDegrees;
  if(!marker) state.camera[field]=angle;
  else if(field==='yaw') marker.headYaw=wrapAngle(angle-marker.yaw+Math.PI)-Math.PI;
  else marker.headPitch=angle;
}
const precision={
  height:numeric($('precision'),'Wysokość (m)',.3,2,.01,value=>state.camera.height=value),
  yaw:numeric($('precision'),'Obrót (°)',0,360,.1,value=>head('yaw',value)),
  pitch:numeric($('precision'),'Pochylenie (°)',-83.07,83.07,.01,value=>head('pitch',value)),
  verticalFov:numeric($('precision'),'Pionowe FOV (°)',30,100,1,value=>state.camera.verticalFov=value),
};
function syncPrecision() {
  const c=effectiveCamera(state);
  for(const [field,input] of Object.entries(precision)){
    if(input===document.activeElement) continue;
    input.value=Number((c[field]*(field==='yaw' || field==='pitch'?toDegrees:1)).toFixed(2));
  }
}
for(const [key,name] of Object.entries(perspectives)) option($('perspective'),key,name);
$('perspective').onchange=()=>{
  state.perspective=$('perspective').value;
  syncControls();refresh();
};

let placing;
const markerControls={};
const postureNames={standing:'Stojąca',sitting:'Siedząca',lying:'Leżąca'};
function markerPlacement(id,anchor,hit) {
  if(mode!=='director') return;
  const marker=state.characters[id];
  if(anchor==='floor'){
    if(!hit || !inside(hit.x,hit.y) || hit.z>.07 || blocked(hit.x,hit.y,state)){
      notice('Wskaż wolne miejsce na podłodze.');return;
    }
    Object.assign(marker,{x:hit.x,y:hit.y,z:0,posture:'standing'});
  } else if(anchor==='bed'){
    Object.assign(marker,{x:7.06,y:1.92,z:.59,yaw:0,posture:'lying'});
  } else if(anchor==='sofa'){
    Object.assign(marker,{x:state.sofaUnfolded?1:.67,y:2.35,z:.53,yaw:Math.PI/2,posture:'sitting'});
  } else {
    const chair=itemPosition(state,anchor);
    const baseYaw={chair1:Math.PI,chair2:0,chair3:Math.PI/2,chair4:Math.PI*1.5}[anchor];
    Object.assign(marker,{x:chair.x,y:chair.y,z:.49,yaw:wrapAngle(baseYaw-chair.rotation),posture:'sitting'});
  }
  marker.visible=true;
  placing=null;syncControls();refresh();
}
for(const [id,name] of Object.entries(characterNames)){
  const group=document.createElement('details'), title=document.createElement('summary');
  title.textContent=name;group.append(title);$('characters').append(group);
  const fields={};
  markerControls[id]=fields;
  for(const [key,label] of [['visible','Widoczna postać'],['guides','Kierunek ciała i spojrzenia']]){
    const control=document.createElement('label'), input=document.createElement('input');
    input.type='checkbox';fields[key]=input;control.append(input,label);group.append(control);
    input.onchange=()=>{state.characters[id][key]=input.checked;refresh();};
  }
  const posture=document.createElement('select');
  posture.setAttribute('aria-label','Pozycja ciała: '+name);
  for(const [key,label] of Object.entries(postureNames)) option(posture,key,label);
  fields.posture=posture;
  posture.onchange=()=>{state.characters[id].posture=posture.value;refresh();};
  group.append(posture);
  const anchors=document.createElement('select');
  anchors.setAttribute('aria-label','Miejsce: '+name);
  for(const [key,label] of [['floor','Podłoga'],['bed','Łóżko Yrliet'],['sofa','Kanapa'],
    ...Object.keys(editable).filter(key=>key.startsWith('chair')).map(key=>[key,editable[key][0]])]) option(anchors,key,label);
  group.append(anchors);
  button(group,'Ustaw postać',()=>{
    if(mode!=='director'){
      $('mode').value='director';$('mode').onchange();
    }
    if(anchors.value==='floor'){
      placing=id;setSheet(0);notice('Dotknij miejsca na podłodze.');
    } else markerPlacement(id,anchors.value);
  });
  for(const [key,label,min,max,step] of [
    ['x','X (m)',.2,8,.01],['y','Y (m)',.2,8.2,.01],['z','Nad podłogą (m)',0,1.2,.01],
    ['height','Wzrost (m)',.8,2.1,.01],['yaw','Ciało (°)',0,360,.1],
    ['headYaw','Głowa (°)',-180,180,.1],['headPitch','Głowa góra/dół (°)',-83.07,83.07,.01],
    ['gazeYaw','Spojrzenie (°)',-180,180,.1],['gazePitch','Spojrzenie góra/dół (°)',-83.07,83.07,.01],
  ]){
    const angular=label.includes('°');
    fields[key]=numeric(group,label,min,max,step,value=>state.characters[id][key]=angular?value/toDegrees:value);
    fields[key].dataset.angular=String(angular);
  }
  for(const [key,label] of Object.entries(postureNames)){
    fields['eye:'+key]=numeric(group,'Korekta oczu · '+label+' (m)',-.08,.35,.01,
      value=>state.characters[id].eyeOffsets[key]=value);
  }
}
onViewportTap=(x,y,longPress)=>{
  $('context').hidden=true;
  if(!engine || contextLost) return;
  if(pendingFrame){cancelAnimationFrame(pendingFrame);draw();}
  const rect=canvas.getBoundingClientRect();
  if(!rect.width || !rect.height) return;
  const hit=engine.pick((x-rect.left)/rect.width,(y-rect.top)/rect.height);
  if(placing && mode==='director' && !longPress){markerPlacement(placing,'floor',hit);return;}
  const action=hit?.action;
  if(!action) return;
  const {kind,key}=action;
  if(mode==='interior'){
    if(kind==='furniture'){
      $('furniture').value=selectedFurniture=key;
      openPanel('interior');refresh(false);
    }
    return;
  }
  if(mode!=='explore') return;
  const entry=objectActions.get(kind+':'+key);
  if(!entry) return;
  if(!longPress){
    entry.el.click();notice(entry.name ? entry.name+' · '+entry.el.textContent : entry.el.textContent);
    return;
  }
  const menu=$('context');
  menu.replaceChildren();
  const title=document.createElement('strong');title.textContent=entry.name??entry.el.textContent;menu.append(title);
  button(menu,entry.el.textContent,()=>{entry.el.click();menu.hidden=true;});
  if(kind==='lights') button(menu,'Moc i barwa',()=>{
    const room=roomLightControls.find(room=>room.keys.includes(key));
    room.section.open=true;openPanel('lighting');menu.hidden=true;
    room.section.scrollIntoView({block:'nearest'});
  });
  button(menu,'Zamknij',()=>menu.hidden=true);
  menu.hidden=false;
};

function saveSlotChange(action) {
  const old=$('slots').value;
  if(!slots[old]){notice('Wybierz zapisaną scenę.');return;}
  let name=old;
  if(action!=='update'){
    name=requestName('Nazwa sceny',old);
    if(!name || name===old) return;
    if(slots[name]) {notice('Ta nazwa jest już zajęta.');return;}
  }
  if(action==='duplicate' && Object.keys(slots).length>=40){notice('Limit zapisanych scen: 40.');return;}
  slots[name]={...clone(action==='update'?state:slots[old]),name};
  if(action==='rename') delete slots[old];
  syncControls();$('slots').value=name;
  if(persist()) notice('Zapisano scenę „'+name+'”.');
}
for(const [label,action] of [['Zmień nazwę','rename'],['Duplikuj','duplicate'],['Aktualizuj','update']]){
  button($('slotActions'),label,()=>saveSlotChange(action));
}

const slotPreview=$('slotPreview');
$('slots').onchange=()=>slotPreview.hidden=true;
$('previewSlot').onclick=()=>{
  const saved=slots[$('slots').value];
  if(!saved || !engine || contextLost){notice('Wybierz zapisaną scenę przy aktywnym WebGL.');return;}
  const preview=document.createElement('canvas');
  preview.width=144;preview.height=Math.round(preview.width/frames[saved.camera.framing]);
  if(pendingFrame) cancelAnimationFrame(pendingFrame);
  draw();
  try {
    engine.render(saved,canvas.clientWidth,canvas.clientHeight);
    preview.getContext('2d').drawImage(canvas,0,0,preview.width,preview.height);
    slotPreview.alt=saved.name;
    slotPreview.height=preview.height;
    slotPreview.src=preview.toDataURL('image/jpeg',.7);
    slotPreview.hidden=false;
  } catch {notice('Nie udało się przygotować podglądu.');}
  finally {refresh(false);}
};

const baseSummary=summaryText;
summaryText=()=>[
  baseSummary(),
  'Data: '+(state.date||'—')+' · Pogoda: '+weatherProfiles[state.weather][0]+' · '+$('room').textContent,
  'Perspektywa: '+perspectives[state.perspective]+' · '+cameraText(effectiveCamera(state)),
  ...Object.entries(state.characters).map(([id,m])=>characterNames[id]+' · '+postureNames[m.posture]+
    ' · '+[m.x,m.y,m.z].map(v=>v.toFixed(2)).join(', ')+' m · wzrost '+m.height+' m'+
    ' · ciało / głowa / spojrzenie '+[m.yaw,m.headYaw,m.headPitch,m.gazeYaw,m.gazePitch]
      .map(v=>Math.round(v*toDegrees)+'°').join(' / ')),
].join('\n');
function downloadFile(file) {
  const url=URL.createObjectURL(file);
  download(url,file.name);
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
let prepared;
$('prepareShare').onclick=()=>{
  if(!engine || contextLost){notice('Zdjęcie wymaga aktywnego widoku WebGL.');return;}
  if($('prepareShare').disabled) return;
  $('prepareShare').disabled=true;
  $('shareActions').hidden=true;
  if(pendingFrame) cancelAnimationFrame(pendingFrame);
  draw();
  const camera=clone(effectiveCamera(state));
  const description=summaryText();
  const markers=$('includeMarkers').checked;
  const scene={...clone(state),reference:{room:currentRoom(camera),camera,aspectRatio:frames[camera.framing],
    appliedExposureEV:appliedExposure(state,camera),markersInImage:markers,description}};
  try {
    engine.render(state,canvas.clientWidth,canvas.clientHeight,{markers});
    canvas.toBlob(blob=>{
      $('prepareShare').disabled=false;
      if(!blob){notice('Nie udało się przygotować PNG.');return;}
      const files=[new File([blob],'Yrliet_Scene.png',{type:'image/png'}),
        new File([JSON.stringify(scene,null,2)+'\n'],'Yrliet_Scene.json',{type:'application/json'})];
      prepared={files,title:scene.name,text:description};
      $('shareActions').hidden=false;
      $('nativeShare').hidden=!(navigator.share && navigator.canShare?.({files}));
      notice('Przygotowano zdjęcie i plik sceny.');
    },'image/png');
  } catch {
    $('prepareShare').disabled=false;
    notice('Nie udało się przygotować zdjęcia.');
  }
  finally {refresh(false);}
};
$('nativeShare').onclick=async()=>{
  try {await navigator.share({...prepared});}
  catch(error){if(error.name!=='AbortError') notice('Udostępnianie niedostępne. Pobierz pliki poniżej.');}
};
$('sharePNG').onclick=()=>downloadFile(prepared.files[0]);
$('shareJSON').onclick=()=>downloadFile(prepared.files[1]);
button($('shareActions'),'Kopiuj opis zdjęcia',async()=>{
  try {await navigator.clipboard.writeText(prepared.text);notice('Opis skopiowany.');}
  catch {$('summary').value=prepared.text;$('summary').focus();$('summary').select();}
});

studioSync=()=>{
  $('weather').value=state.weather;
  $('sceneDate').value=state.date;
  $('perspective').value=state.perspective;
  const pov=state.perspective!=='independent';
  $('eye').disabled=precision.height.disabled=pov;
  for(const button of $('heights').children) button.disabled=pov;
  for(const button of document.querySelectorAll('[data-m]')) button.disabled=pov;
  slotPreview.hidden=true;
  $('undo').disabled=!undoStack.length;
  $('redo').disabled=!redoStack.length;
  for(const [id,fields] of Object.entries(markerControls)){
    const marker=state.characters[id];
    for(const [key,input] of Object.entries(fields)){
      if(input.type==='checkbox') input.checked=marker[key];
      else if(key.startsWith('eye:')) input.value=marker.eyeOffsets[key.slice(4)];
      else if(input.dataset.angular==='true') input.value=Number((marker[key]*toDegrees).toFixed(2));
      else input.value=Number.isFinite(marker[key])?Number(marker[key].toFixed(3)):marker[key];
    }
  }
  syncPrecision();
};
openPanel('lighting',0);
studioSync();
refresh(false);
