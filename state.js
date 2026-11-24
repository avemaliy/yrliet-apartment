const VERSION = '1.1.1';
const SAVE_KEY = 'yrliet-apartment-v1';
const TAU = Math.PI * 2;
const frames = {landscape: 4/3, portrait: 3/4, square: 1};
const lightDefinitions = [
  ['kitchen', 'Sufit · kuchnia', 6.3, 6.8, 2.7, 3000, 18, 5],
  ['user', 'Sufit · twój pokój', 1.7, 2.6, 2.73, 3000, 16, 5],
  ['yrliet', 'Sufit · pokój Yrliet', 6.5, 2.6, 2.73, 3000, 16, 5],
  ['hall', 'Sufit · korytarz', 4.1, 4.5, 2.73, 3000, 13, 4],
  ['bath', 'Sufit · łazienka', 1.6, 6.8, 2.73, 3500, 15, 4],
  ['utility', 'Sufit · schowek', 4.05, .95, 2.73, 3500, 10, 3],
  ['floor', 'Lampa podłogowa', .56, 3.72, 1.36, 2700, 8, 3.5],
  ['userDesk', 'Lampa biurkowa · twój pokój', 2.19, .48, 1.12, 4000, 2.8, 1.8],
  ['bedside', 'Lampa nocna · Yrliet', 7.64, .77, .75, 2400, 3, 2.3],
  ['yrlietDesk', 'Lampa biurkowa · Yrliet', 6.44, .54, 1.13, 3900, 2.8, 1.8],
  ['bookshelf', 'Podświetlenie książek', 7.34, 4.39, 1.46, 2700, 1.8, 1.8],
  ['counter', 'Oświetlenie blatu', 5.75, 5.71, 1.56, 2900, 4, 2.4],
];
const doorDefinitions = [
  ['user','Twój pokój',3.46,3.4,0,.9], ['yrliet','Pokój Yrliet',4.74,3.4,0,.9],
  ['bath','Łazienka',3.46,6.45,0,.9], ['utility','Schowek',3.74,1.71,1,.74],
  ['entry','Wejście',3.65,8.33,1,.9],
];
const windowNames = {kitchen:'Kuchnia', user:'Twój pokój', yrliet:'Pokój Yrliet'};
const editable = {
  userRug:['Dywan · twój pokój',1.875,2.475,1.25,1.65,.004],
  yrlietRug:['Dywan · Yrliet',5.575,3,1.05,1.7,.004],
  chair1:['Krzesło północne',6.16,6.36,.42,.42,.90],
  chair2:['Krzesło południowe',6.16,7.81,.42,.42,.90],
  chair3:['Krzesło zachodnie',5.31,7.04,.42,.42,.90],
  chair4:['Krzesło wschodnie',7.26,7.04,.42,.42,.90],
  vase:['Wazon na stole',6.28,7.02,.15,.15,.78],
};
const keyed = (keys, value) => Object.fromEntries(keys.map(key => [key, value(key)]));
const keysFor = (definitions) => definitions.map(([key]) => key);
const wrapAngle = (angle) => ((angle % TAU) + TAU) % TAU;
const clone = (value) => JSON.parse(JSON.stringify(value));

const weatherProfiles = {
  sunny:['Słonecznie','#afcfdf',0,1,0], overcast:['Pochmurno','#8f9ba5',.65,.62,.018],
  rainy:['Deszcz','#596a7b',.72,.42,.043], snowy:['Śnieg','#dce7ee',.65,.81,.05],
  foggy:['Mgła','#aeb7b8',.76,.55,.14],
};
const postures = {standing:.94, sitting:.42, lying:.10};
const characterNames = {user:'Ty',yrliet:'Yrliet'};
const perspectives = {independent:'Niezależny',user:'POV użytkownika',yrliet:'POV Yrliet'};
function defaultCharacter(id) {
  return {x:id==='user'?1.85:5.75,y:3,z:0,height:1.7,yaw:0,headYaw:0,headPitch:0,
    gazeYaw:0,gazePitch:0,posture:'standing',visible:false,guides:false,
    eyeOffsets:{standing:0,sitting:0,lying:0}};
}

function effectiveCamera(state) {
  const c=state.camera, marker=state.characters[state.perspective];
  if(!marker) return c;
  return {...c,x:marker.x,y:marker.y,height:marker.z+marker.height*postures[marker.posture]+marker.eyeOffsets[marker.posture],
    yaw:wrapAngle(marker.yaw+marker.headYaw),pitch:marker.headPitch};
}

function defaultScene() {
  return {
    schemaVersion:2, appVersion:VERSION, name:'Mieszkanie', timeOfDay:8,
    weather:'sunny',date:'',perspective:'independent',characters:keyed(Object.keys(characterNames),defaultCharacter),
    camera:{x:6.50, y:7.82, yaw:0, pitch:0, height:1.2, verticalFov:75, framing:'landscape', grid:false, seatedOnSofa:false},
    exposure:{ev:0, automatic:false},
    lights:Object.fromEntries(lightDefinitions.map(([key,,,,,kelvin]) => [key,{on:false,intensity:1,kelvin}])),
    doors:keyed(keysFor(doorDefinitions), key => key !== 'entry'),
    windows:keyed(Object.keys(windowNames), () => false),
    curtains:keyed(Object.keys(windowNames), () => false),
    sofaUnfolded:false, televisionOn:false, furniture:{}, bookmarks:[],
  };
}

function validateScene(input) {
  const bad = field => { throw new Error('Nieprawidłowe pole: ' + field); };
  function record(value, field) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) bad(field);
    return value;
  }
  function number(value, min, max, field) {
    if (!Number.isFinite(value) || value < min || value > max) bad(field);
    return value;
  }
  function bool(value, field) {
    if (typeof value !== 'boolean') bad(field);
    return value;
  }
  function name(value, max, field) {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max) bad(field);
    return value.trim();
  }
  function camera(value, field) {
    const c = record(value, field);
    if (!Object.prototype.hasOwnProperty.call(frames,c.framing)) bad(field + '.framing');
    return {
      x:number(c.x,.2,8,field+'.x'), y:number(c.y,.2,8.2,field+'.y'),
      yaw:wrapAngle(number(c.yaw,-1e6,1e6,field+'.yaw')),
      pitch:number(c.pitch,-1.45,1.45,field+'.pitch'),
      height:number(c.height,.3,2,field+'.height'),
      verticalFov:number(c.verticalFov,30,100,field+'.verticalFov'),
      framing:c.framing, grid:bool(c.grid,field+'.grid'),
      seatedOnSofa:bool(c.seatedOnSofa ?? false,field+'.seatedOnSofa'),
    };
  }
  let t = record(input,'scene');
  if (t.schemaVersion === undefined && Array.isArray(t.lampOn) && Array.isArray(t.doors)) {
    if (t.lampOn.length !== 6 || t.doors.length !== 5) bad('v0.5');
    const legacy = defaultScene();
    const aspect = Math.max(.4, Math.min(2, (typeof innerWidth === 'number' ? Math.min(innerWidth-24,1000)/Math.min(innerHeight*.58,540) : 4/3)));
    Object.assign(legacy.camera,{x:t.X,y:t.Y,yaw:t.A,pitch:t.P,height:Number(t.eye),
      verticalFov:Math.max(30,Math.min(100,2*Math.atan(Math.tan(Number(t.fov)*Math.PI/360)/aspect)*180/Math.PI)),
      seatedOnSofa:t.X >= .5 && t.X <= 1.7 && t.Y >= 1.48 && t.Y <= 3.31});
    legacy.timeOfDay = Number(t.hour);
    t.lampOn.forEach((on,i) => legacy.lights[lightDefinitions[i][0]].on = on);
    t.doors.forEach((open,i) => legacy.doors[doorDefinitions[i][0]] = open);
    legacy.sofaUnfolded = t.unfolded;
    t = legacy;
  }
  if (![1,2].includes(t.schemaVersion)) bad('schemaVersion');
  name(t.appVersion,32,'appVersion');
  const scene = defaultScene();
  scene.name = name(t.name,80,'name');
  scene.timeOfDay = number(t.timeOfDay,0,23.75,'timeOfDay');
  scene.camera = camera(t.camera,'camera');
  if (t.exposure !== undefined) {
    const exposure = record(t.exposure,'exposure');
    scene.exposure = {
      ev:number(exposure.ev,-2,2,'exposure.ev'),
      automatic:bool(exposure.automatic,'exposure.automatic'),
    };
  }
  scene.lights = keyed(keysFor(lightDefinitions), key => {
    const field = 'lights.'+key;
    const light = record(record(t.lights,'lights')[key],field);
    return {on:bool(light.on,field+'.on'),intensity:number(light.intensity,0,2,field+'.intensity'),
      kelvin:number(light.kelvin,2200,5500,field+'.kelvin')};
  });
  for (const field of ['doors','windows','curtains']) {
    const value = record(t[field],field);
    scene[field] = keyed(Object.keys(scene[field]), key => bool(value[key],field+'.'+key));
  }
  scene.sofaUnfolded = bool(t.sofaUnfolded,'sofaUnfolded');
  scene.televisionOn = bool(t.televisionOn,'televisionOn');
  for (const [key,value] of Object.entries(record(t.furniture,'furniture'))) {
    if (!Object.prototype.hasOwnProperty.call(editable,key)) bad('furniture.'+key);
    const object = record(value,'furniture.'+key);
    scene.furniture[key] = {x:number(object.x,.2,8,'furniture.x'),
      y:number(object.y,.2,8.2,'furniture.y'), rotation:wrapAngle(number(object.rotation,-1e6,1e6,'furniture.rotation'))};
  }
  if (!Array.isArray(t.bookmarks) || t.bookmarks.length > 40) bad('bookmarks');
  scene.bookmarks = t.bookmarks.map(item => {
    const b = record(item,'bookmark');
    return {name:name(b.name,64,'bookmark.name'), camera:camera(b.camera,'bookmark.camera')};
  });
  if(t.schemaVersion===2){
    for(const [field,choices] of [['weather',weatherProfiles],['perspective',perspectives]]){
      if(!Object.prototype.hasOwnProperty.call(choices,t[field])) bad(field);
      scene[field]=t[field];
    }
    if(typeof t.date!=='string' || (t.date && (!/^\d{4}-\d{2}-\d{2}$/.test(t.date) ||
      new Date(t.date).toJSON()?.slice(0,10)!==t.date))) bad('date');
    scene.date=t.date;
    for(const id of Object.keys(characterNames)){
      const m=record(record(t.characters,'characters')[id],id);
      if(!Object.prototype.hasOwnProperty.call(postures,m.posture)) bad(id+'.posture');
      const marker={posture:m.posture,visible:bool(m.visible,id+'.visible'),guides:bool(m.guides,id+'.guides')};
      for(const [key,min,max] of [['x',.2,8],['y',.2,8.2],['z',0,1.2],['height',.8,2.1],
        ['yaw',0,TAU],['headYaw',-Math.PI,Math.PI],['headPitch',-1.45,1.45],
        ['gazeYaw',-Math.PI,Math.PI],['gazePitch',-1.45,1.45]]){
        marker[key]=number(m[key],min,max,id+'.'+key);
      }
      marker.eyeOffsets=keyed(Object.keys(postures),key=>number(record(m.eyeOffsets,id+'.eyeOffsets')[key],-.08,.35,id+'.eyeOffsets.'+key));
      scene.characters[id]=marker;
    }
  }
  return scene;
}
