function temperatureRGB(kelvin) {
  const t = kelvin / 100;
  const clamp = value => Math.max(0, Math.min(255, value)) / 255;
  return [
    clamp(t <= 66 ? 255 : 329.6987 * (t-60)**-.1332),
    clamp(t <= 66 ? 99.4708*Math.log(t)-161.1196 : 288.1222*(t-60)**-.0755),
    clamp(t >= 66 ? 255 : t <= 19 ? 0 : 138.5177*Math.log(t-10)-305.0448),
  ];
}

function doorAngle(key, axis, open) {
  if (!open) return axis ? 0 : -Math.PI/2;
  return key === 'user' || key === 'bath' ? Math.PI : axis ? Math.PI/2 : 0;
}

function createApartment(canvas) {
  if (!window.THREE) throw new Error('Nie udało się załadować Three.js.');
  const T = window.THREE;
  const renderer = new T.WebGLRenderer({canvas, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene();
  scene.background = new T.Color();
  const camera = new T.PerspectiveCamera(75,1,.035,58);
  const ambient = new T.HemisphereLight(0xe6edff,0x9b8065,1);
  const sun = new T.DirectionalLight(0xffe6c0,1);
  scene.add(ambient,sun);
  const materials = new Map();
  const cube = new T.BoxGeometry(1,1,1);
  let seed = 2101;
  function random() {
    seed = (1664525*seed + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  function texture(size, draw) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = size;
    draw(tile.getContext('2d'), size);
    const map = new T.CanvasTexture(tile);
    map.colorSpace = T.SRGBColorSpace;
    map.wrapS = map.wrapT = T.RepeatWrapping;
    map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return map;
  }
  const surfaceTextures = {};
  for (const kind of ['plaster','wood','cloth']) {
    surfaceTextures[kind] = texture(128,(g,n) => {
      g.fillStyle = '#f6f3ed'; g.fillRect(0,0,n,n);
      for (let i=0; i<750; i++) {
        g.fillStyle = 'rgba(65,51,37,'+(random()*.13).toFixed(3)+')';
        const x=random()*n, y=random()*n;
        g.fillRect(x,y,kind==='wood' ? 8+random()*45 : 1+random()*2,kind==='cloth' ? 1 : 2);
      }
    });
  }
  const parquet = texture(512,(g,n) => {
    g.fillStyle='#68533c'; g.fillRect(0,0,n,n);
    const colors=['#a78a66','#b39470','#b79a75','#a68c6c','#bd9c72','#a38864'];
    for(let y=-8;y<24;y++) for(let x=-8;x<24;x++) {
      const k=((x-y)%8+8)%8;
      if(k!==0 && k!==7) continue;
      const vertical = k===7;
      const color=colors[Math.floor(random()*colors.length)];
      g.save(); g.translate(x*32,y*32);
      if(vertical){g.translate(32,0);g.rotate(Math.PI/2);}
      g.fillStyle=color; g.fillRect(0,0,127,31);
      for(let i=0;i<37;i++){
        g.fillStyle=i%3===0?'#ebd2a215':'#50361520';
        g.fillRect(random()*100,random()*31,8+random()*26,1);
      }
      g.restore();
    }
  });
  parquet.repeat.set(5,5);
  function material(color,kind='') {
    const key=color+kind;
    if(!materials.has(key)) {
      materials.set(key,new T.MeshStandardMaterial({color, map:surfaceTextures[kind] || null,
        roughness:kind==='metal'?.33:kind==='ceramic'?.42:kind==='glass'?.18:.86, metalness:kind==='metal'?.45:0,
        transparent:kind==='glass', opacity:kind==='glass'?.26:1, depthWrite:kind!=='glass'}));
    }
    return materials.get(key);
  }
  function finish(b) {
    if (['#a5b7b6','#b6c7c6'].includes(b.col)) return 'glass';
    if (['#d9d4c7','#e6e0d4'].includes(b.col)) return 'plaster';
    if (['#aeb5b3','#b8c1bd','#a6a9a4','#aaa9a5','#9a8051'].includes(b.col)) return 'metal';
    if (['#d3d0c4','#c7c4b9','#d9cbb5','#c9baa4','#eeeae2'].includes(b.col)) return 'ceramic';
    if ([oak,wood,'#a28b72','#92765d','#9a7b60'].includes(b.col)) return 'wood';
    if ([green,'#24574d','#205047',linen,'#8b9b8e','#b8a59c','#e1d9cb'].includes(b.col)) return 'cloth';
    return '';
  }
  function block(x,y,z,w,d,h,color,parent=scene,kind='') {
    const mesh=new T.Mesh(cube,material(color,kind));
    mesh.position.set(x+w/2,z+h/2,y+d/2);
    mesh.scale.set(w,h,d);
    parent.add(mesh);
    return mesh;
  }
  function cylinder(x,y,z,r,h,color,top=r,parent=scene) {
    const mesh=new T.Mesh(new T.CylinderGeometry(top,r,h,10),material(color));
    mesh.position.set(x,z+h/2,y);
    parent.add(mesh);
    return mesh;
  }
  const floor = new T.Mesh(new T.PlaneGeometry(8.2,8.4),new T.MeshStandardMaterial({map:parquet,roughness:.84}));
  floor.rotation.x=-Math.PI/2; floor.position.set(4.1,.003,4.2); scene.add(floor);
  const batch = new Map();
  const movableIndices = new Set();
  const furnishings = {};
  for(const [key,[,x,y]] of Object.entries(editable)) {
    const group = new T.Group();
    furnishings[key]=group;
    group.position.set(x,0,y);
    scene.add(group);
    const range=furnitureGroups[key];
    if(!range) continue;
    for(let i=range[0];i<range[1];i++){
      movableIndices.add(i);
      const b=B[i];
      block(b.x-x,b.y-y,b.z,b.w,b.d,b.h,b.col,group,finish(b));
    }
  }
  for(let i=0;i<B.length;i++) {
    if((i>=sofaStart && i<sofaEnd)||movableIndices.has(i)) continue;
    const b=B[i];
    const mat=material(b.col,finish(b));
    if(!batch.has(mat)) batch.set(mat,[]);
    batch.get(mat).push(b);
  }
  const transform=new T.Object3D();
  for(const [mat,items] of batch){
    const mesh=new T.InstancedMesh(cube,mat,items.length);
    items.forEach((b,i)=>{
      transform.position.set(b.x+b.w/2,b.z+b.h/2,b.y+b.d/2);
      transform.scale.set(b.w,b.h,b.d);
      transform.updateMatrix();
      mesh.setMatrixAt(i,transform.matrix);
    });
    scene.add(mesh);
  }
  for(const item of details){
    const [x,y,z,r,h,color,top]=item;
    if(Math.abs(x-6.28)<.08 && y===7.02 && z>=.78) cylinder(x-6.28,y-7.02,z,r,h,color,top,furnishings.vase);
    else cylinder(...item);
  }
  const folded=new T.Group(), extended=new T.Group();
  scene.add(folded,extended);
  for(let i=sofaStart;i<sofaEnd;i++){
    const b=B[i];
    const parent=i<sofaStart+8?scene:folded;
    block(b.x,b.y,b.z,b.w,b.d,b.h,b.col,parent,finish(b));
  }
  block(.23,1.3,.12,1.55,2.2,.25,green,extended,'cloth');
  for(let i=0;i<3;i++){
    block(.24,1.49+i*.61,.37,1.54,.59,.145,'#24574d',extended,'cloth');
    block(.28,1.52+i*.61,.513,.52,.51,.06,'#275b50',extended,'cloth');
  }
  block(.51,1.57,.52,.49,.39,.12,'#897656',folded,'cloth').rotation.y=.17;
  block(.52,3.05,.52,.47,.23,.075,'#b9ac94',folded,'cloth').rotation.y=-.14;
  block(1.49,1.58,.514,.24,1.63,.047,'#b9ac94',extended,'cloth');
  const doors3d = keyed(keysFor(doorDefinitions),key=>{
    const [,,x,y,,w]=doorDefinitions.find(d=>d[0]===key);
    const pivot=new T.Group();
    pivot.position.set(x,0,y); scene.add(pivot);
    block(0,-.025,.02,w,.05,2.07,'#e5dfd1',pivot,'plaster');
    block(.09,-.031,.25,w-.18,.012,1.63,'#d8d2c4',pivot,'wood');
    block(w-.12,-.065,1.02,.08,.13,.045,'#9a8051',pivot,'metal');
    return pivot;
  });
  const glass=new T.MeshStandardMaterial({color:'#bfd9df',roughness:.13,transparent:true,opacity:.13,depthWrite:false});
  const glazing = {};
  const drapes = {};
  const fills=[];
  windows.forEach(({x,y,w,d},i)=>{
    const key=Object.keys(windowNames)[i], east=i===0, span=east?d:w;
    const base=new T.Group();
    base.position.set(x+(east?.065:0),0,y+(east?0:.105));
    base.rotation.y=east?-Math.PI/2:0;
    scene.add(base);
    const sash=new T.Group(); base.add(sash); glazing[key]=sash;
    const glassPanel=block(.036,-.008,.91,span/2-.055,.016,1.55,'#bfd9df',sash);
    glassPanel.material=glass;
    const fixed=block(span/2+.015,-.008,.91,span/2-.052,.016,1.55,'#bfd9df',base);
    fixed.material=glass;
    for(const z of [.88,1.94,2.46]) block(0,-.025,z,span/2,.05,.05,'#eae1d0',sash,'wood');
    for(const z of [.88,1.94,2.46]) block(span/2,-.025,z,span/2,.05,.05,'#eae1d0',base,'wood');
    for(const a of [span/2,span-.045]) block(a,-.025,.88,.045,.05,1.63,'#eae1d0',base,'wood');
    for(const a of [0,span/2-.045]) block(a,-.025,.88,.045,.05,1.63,'#eae1d0',sash,'wood');
    block(span/2-.1,.015,1.58,.026,.035,.15,'#9a8051',sash,'metal');
    const rod=cylinder(span/2,east?.21:.27,2.62,.013,span+.18,'#766a56',.013,base);
    rod.rotation.z=Math.PI/2; rod.position.y=2.62;
    const panels=[];
    for(let side=0;side<2;side++){
      const panel=new T.Group(); base.add(panel); panels.push(panel);
      panel.position.set(side?span:0,0,east?.27:.34);
      for(let j=0;j<14;j++) {
        block((side?-1:1)*j*span/28-(side?span/27:0),Math.sin(j*2)*.03,east?.87:.63,span/27,.042,east?1.72:1.95,['#d0c5ae','#c4b69d','#dcd0b8'][j%3],panel,'cloth');
      }
    }
    drapes[key]=panels;
    const light=new T.SpotLight('#e0eaff',0,7,Math.PI/3,.72,2);
    light.position.set(east?7.88:x+w/2,1.86,east?y+d/2:.28);
    light.target.position.set(east?6.4:x+w/2,.35,east?y+d/2:2);
    scene.add(light,light.target);
    fills.push([key,light,east]);
  });
  const exterior = new Map();
  const darkPane = material('#52606a');
  const litPane = new T.MeshStandardMaterial({color:'#59646b',roughness:.72,emissive:'#ae7641'});
  block(-13,-20,-3.3,39,47,.2,'#646557',scene,'plaster');
  function facade(x,y,length,east) {
    const add=(u,z,w,h,mat,depth=.15,back=0)=>{
      if(!exterior.has(mat)) exterior.set(mat,[]);
      exterior.get(mat).push(east?[x+back-depth,y+u,z,depth,w,h]:[x+u,y-back,z,w,depth,h]);
    };
    add(0,-3.2,length,13.5,material('#b6a58b','plaster'),.6,.6);
    for(const z of [-.4,2.75,5.8,8.9,10.1]) add(0,z,length,.13,material('#d1bfa4'),.24);
    let index=0;
    for(let u=.85;u<length-1.3;u+=2.35) for(let level=0;level<4;level++){
      const z=-2+level*3.02;
      add(u-.13,z-.13,1.23,1.93,material('#c9b99c'),.21);
      add(u,z,.97,1.66,(index++%7===1)?litPane:darkPane,.24);
      add(u+.46,z,.052,1.66,material('#a49a86'),.29);
      add(u,z+1.13,.97,.052,material('#a49a86'),.29);
      add(u-.08,z-.08,1.13,.09,material('#b9ad96'),.36);
    }
  }
  facade(-8,-10.6,28,false);
  facade(17,-10.6,25,true);
  for(const [material,items] of exterior){
    const mesh=new T.InstancedMesh(cube,material,items.length);
    items.forEach(([x,y,z,w,d,h],i)=>{
      transform.position.set(x+w/2,z+h/2,y+d/2);
      transform.scale.set(w,h,d);
      transform.updateMatrix();
      mesh.setMatrixAt(i,transform.matrix);
    });
    scene.add(mesh);
  }
  const nightSky=new T.Color('#172338'), duskSky=new T.Color('#bda3a0'), daySky=new T.Color('#afcfdf');
  const nightTint=new T.Color('#9bafd3'), dayTint=new T.Color('#e6edff');
  const warmSun=new T.Color('#ffb47c'), coolSun=new T.Color('#fff2dc');
  const shadeMap=texture(64,(g,n)=>{
    const fade=g.createRadialGradient(n/2,n/2,2,n/2,n/2,n/2);
    fade.addColorStop(0,'rgba(28,23,19,.36)');
    fade.addColorStop(1,'rgba(28,23,19,0)');
    g.fillStyle=fade;g.fillRect(0,0,n,n);
  });
  const contact=new T.MeshBasicMaterial({map:shadeMap,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
  for(const [x,y,w,d] of [[.66,2.4,1.85,2.9],[7.1,2.6,2.5,2.8],[6.27,7.05,2.5,2.05],[1.65,.47,2.1,1.3],[5.83,.48,2.1,1.3]]){
    const mesh=new T.Mesh(new T.PlaneGeometry(w,d),contact);
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.0045,y);scene.add(mesh);
  }
  for(const [x,y,z,r,h] of [[.56,3.72,0,.125,1.23],[2.19,.48,.78,.074,.31],[7.64,.77,.54,.073,.16],[6.44,.54,.78,.075,.31]]) {
    cylinder(x,y,z,r,.035,'#574c3b');
    cylinder(x,y,z+.035,.014,h,'#766352');
    cylinder(x,y,z+h,r*1.44,.14,'#d9c7a1',r*.95);
  }
  block(7.32,4.02,1.48,.025,.72,.022,'#d2baa1');
  block(5.19,5.66,1.59,1.15,.04,.025,'#ddd0b5');
  block(.91,4.97,1.48,.47,.055,.56,'#6a5845',scene,'wood');
  block(.945,4.93,1.51,.40,.035,.49,'#b1a191');
  block(.96,4.91,1.56,.3,.025,.21,'#727c69');
  block(1.83,7.96,1.08,.41,.13,.42,'#939c87',scene,'cloth');
  cylinder(.31,7.84,.9,.046,.145,'#a7b2a1',.039);
  cylinder(6.65,6.96,.78,.09,.017,'#ddd3bd');
  block(5.06,.63,.777,.22,.15,.026,'#9b7166');
  block(1.88,.51,.777,.18,.14,.018,'#8a7e6b');
  const screen=block(3.030,1.69,.565,.009,1.42,.80,'#111517');
  screen.material=new T.MeshStandardMaterial({color:'#10161a',emissive:'#557789',roughness:.25});
  const screenImage=texture(128,(g,n)=>{
    const gradient=g.createLinearGradient(0,0,n,n);
    gradient.addColorStop(0,'#26404c');gradient.addColorStop(1,'#7c9699');
    g.fillStyle=gradient;g.fillRect(0,0,n,n);
    g.fillStyle='#aac0bc';g.fillRect(52,60,24,3);g.fillRect(58,69,12,2);
  });
  const lamps = keyed(keysFor(lightDefinitions),key=>{
    const [,,x,y,z,,,range]=lightDefinitions.find(d=>d[0]===key);
    const source=new T.PointLight('#fff4db',0,range,2);
    source.position.set(x,z,y);
    scene.add(source);
    return source;
  });

  function render(state,w,h) {
    const {camera:c,timeOfDay:hour}=state;
    if(canvas.clientWidth!==w || canvas.clientHeight!==h) return;
    const ratio=renderer.getPixelRatio();
    if(canvas.width!==Math.floor(w*ratio)||canvas.height!==Math.floor(h*ratio)) renderer.setSize(w,h,false);
    camera.aspect=frames[c.framing];camera.fov=c.verticalFov;camera.updateProjectionMatrix();
    camera.position.set(c.x,c.height,c.y);
    camera.lookAt(c.x+Math.sin(c.yaw)*Math.cos(c.pitch),c.height+Math.sin(c.pitch),c.y-Math.cos(c.yaw)*Math.cos(c.pitch));
    const day=Math.max(0,Math.sin((hour-5.5)*Math.PI/14));
    const transit=Math.max(0,Math.min(1,(hour-5.5)/14));
    if(day<.37) scene.background.copy(nightSky).lerp(duskSky,day/.37);
    else scene.background.copy(duskSky).lerp(daySky,(day-.37)/.63);
    ambient.color.copy(nightTint).lerp(dayTint,day);
    ambient.intensity=.24+1.28*day;
    sun.position.set(10*Math.cos(transit*Math.PI),3+8*day,-6);
    sun.intensity=day*.85;
    sun.color.copy(warmSun).lerp(coolSun,day);
    litPane.emissiveIntensity=(1-day)**3*.36;
    for(const [key,light,east] of fills){
      light.intensity=day*(east?7*(1-transit)+1.5:4.7)*(state.curtains[key]?.19:1);
      light.color.copy(warmSun).lerp(dayTint,day);
    }
    for(const [key,,,,,,power] of lightDefinitions){
      const l=state.lights[key];
      lamps[key].color.setRGB(...temperatureRGB(l.kelvin),T.SRGBColorSpace);
      lamps[key].intensity=l.on?power*l.intensity:0;
    }
    for(const [key,,,,axis] of doorDefinitions) doors3d[key].rotation.y=doorAngle(key,axis,state.doors[key]);
    for(const key of Object.keys(windowNames)){
      glazing[key].rotation.y=state.windows[key]?-1:0;
      for(const panel of drapes[key]) panel.scale.x=state.curtains[key]?1:.18;
    }
    for(const [key,[,x,y]] of Object.entries(editable)){
      const item=state.furniture[key]||{x,y,rotation:0};
      furnishings[key].position.set(item.x,0,item.y);
      furnishings[key].rotation.y=item.rotation;
    }
    folded.visible=!state.sofaUnfolded;extended.visible=state.sofaUnfolded;
    if(Boolean(screen.material.emissiveMap)!==state.televisionOn){
      screen.material.emissiveMap=state.televisionOn?screenImage:null;
      screen.material.needsUpdate=true;
    }
    screen.material.emissiveIntensity=state.televisionOn?.48:0;
    renderer.render(scene,camera);
  }
  return {render};
}
