const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = ['geometry.js','state.js','render.js']
  .map(file=>readFileSync(path.join(__dirname,'..',file),'utf8')).join('\n');
const { daylightAt, appliedExposure, defaultScene } = vm.runInNewContext(
  source+'\n({ daylightAt, appliedExposure, defaultScene })'
);

test('daylight follows the east and north openings and is zero at night',()=>{
  assert.equal(daylightAt(2).elevation,0);
  assert.equal(daylightAt(20).elevation,0);
  assert.ok(daylightAt(8).east>daylightAt(12.5).east);
  assert.ok(daylightAt(6).north>daylightAt(12.5).north);
  assert.equal(daylightAt(16).east,0);
});

test('auto exposure responds to weather and fixtures while respecting EV limits and dark nights',()=>{
  const scene=defaultScene();
  scene.exposure={ev:0,automatic:true};
  scene.timeOfDay=12.5;
  const sunny=appliedExposure(scene);
  scene.weather='rainy';
  assert.ok(appliedExposure(scene)>sunny);
  scene.lights.kitchen.on=true;
  assert.ok(appliedExposure(scene)<.75*daylightAt(scene.timeOfDay).elevation);
  assert.equal(scene.lights.kitchen.intensity,1);
  scene.lights.kitchen.on=false;
  scene.exposure.ev=2;
  assert.equal(appliedExposure(scene),2);
  scene.exposure.ev=0;
  scene.timeOfDay=22;
  assert.equal(appliedExposure(scene),0);
  scene.exposure={ev:-2,automatic:false};
  assert.equal(appliedExposure(scene),-2);
});
