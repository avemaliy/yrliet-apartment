const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const stateSource = readFileSync(path.join(__dirname,'..','state.js'),'utf8');
function loadState() {
  const context = vm.createContext({});
  return vm.runInContext(stateSource + '\n({ defaultScene, validateScene, effectiveCamera });',context);
}

test('schema 1 migrates while retaining fixture, prop, camera and bookmark data',()=>{
  const { defaultScene, validateScene } = loadState();
  const original = defaultScene();
  original.schemaVersion = 1;
  original.appVersion = '1.0.0';
  for(const key of ['weather','date','perspective','characters']) delete original[key];
  Object.assign(original.lights.floor,{on:true,intensity:.5,kelvin:2500});
  original.doors.entry = true;
  original.windows.user = true;
  original.curtains.yrliet = true;
  original.televisionOn = true;
  original.sofaUnfolded = true;
  original.furniture.userRug = {x:1.875,y:2.375,rotation:0};
  original.bookmarks.push({name:'Kitchen',camera:{...original.camera}});
  const migrated = validateScene(original);
  for(const field of ['camera','lights','doors','windows','curtains','televisionOn','sofaUnfolded','furniture','bookmarks']){
    assert.equal(JSON.stringify(migrated[field]),JSON.stringify(original[field]),field);
  }
  assert.equal(migrated.schemaVersion,2);
  assert.equal(migrated.weather,'sunny');
  assert.equal(migrated.perspective,'independent');
  assert.equal(migrated.characters.yrliet.visible,false);
});

test('schema 2 round trips director data and derives POV without modifying the independent pose',()=>{
  const { defaultScene, validateScene, effectiveCamera } = loadState();
  const scene = defaultScene();
  const independent = JSON.stringify(scene.camera);
  Object.assign(scene,{perspective:'yrliet',weather:'snowy',date:'2026-11-24'});
  const marker = scene.characters.yrliet;
  Object.assign(marker,{posture:'sitting',visible:true,z:.49,yaw:1,headYaw:.2,headPitch:.3,gazeYaw:.4,gazePitch:.1});
  marker.eyeOffsets.sitting = .04;
  const restored = validateScene(JSON.parse(JSON.stringify(scene)));
  assert.equal(JSON.stringify(restored.characters),JSON.stringify(validateScene(scene).characters));
  const eye = effectiveCamera(restored);
  assert.equal(eye.x,marker.x);
  assert.equal(eye.pitch,.3);
  assert.ok(Math.abs(eye.yaw-1.2)<1e-9);
  assert.ok(Math.abs(eye.height-(.49+1.7*.42+.04))<1e-9);
  restored.perspective = 'independent';
  assert.equal(JSON.stringify(effectiveCamera(restored)),independent);
});

test('invalid director fields and unknown versions are rejected',()=>{
  const { defaultScene, validateScene } = loadState();
  assert.throws(()=>validateScene({...defaultScene(),schemaVersion:3}),/schemaVersion/);
  assert.throws(()=>validateScene({...defaultScene(),weather:'constructor'}),/weather/);
  assert.throws(()=>validateScene({...defaultScene(),date:'2026-02-30'}),/date/);
  const scene = defaultScene();
  scene.characters.user.eyeOffsets.lying = 3;
  assert.throws(()=>validateScene(scene),/eyeOffsets/);
});

test('missing exposure defaults to neutral and valid camera exposure survives a scene round trip',()=>{
  const { defaultScene, validateScene } = loadState();
  for(const schemaVersion of [1,2]){
    const legacy=defaultScene();
    legacy.schemaVersion=schemaVersion;
    delete legacy.exposure;
    assert.equal(JSON.stringify(validateScene(legacy).exposure),'{"ev":0,"automatic":false}');
  }
  const scene=defaultScene();
  scene.exposure={ev:-1.35,automatic:true};
  assert.equal(JSON.stringify(validateScene(JSON.parse(JSON.stringify(scene))).exposure),
    JSON.stringify(scene.exposure));
  for(const exposure of [null,{ev:2.1,automatic:false},{ev:-2.1,automatic:false},{ev:0,automatic:'on'}]){
    assert.throws(()=>validateScene({...scene,exposure}),/exposure/);
  }
});

test('v0.5 snapshots retain camera and fixture state and use neutral exposure',()=>{
  const { validateScene } = loadState();
  const legacy={X:6.5,Y:7.82,A:1,P:.1,eye:1.2,fov:75,hour:9,
    lampOn:[true,false,false,false,false,false],
    doors:[true,true,true,true,false],unfolded:false};
  const scene=validateScene(legacy);
  assert.equal(scene.camera.x,legacy.X);
  assert.equal(scene.camera.yaw,legacy.A);
  assert.equal(scene.lights.kitchen.on,true);
  assert.equal(JSON.stringify(scene.exposure),'{"ev":0,"automatic":false}');
});
