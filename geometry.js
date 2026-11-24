const B=[], walls=[], windows=[];function box(x,y,z,w,d,h,col,solid=false){B.push({x,y,z,w,d,h,col});if(solid)walls.push([x,y,w,d])}function wall(x,y,w,d){box(x,y,0,w,d,3.1,'#d9d4c7',true)}function windowWall(x,y,w,d){box(x,y,0,w,d,.85,'#d9d4c7',true);box(x,y,2.55,w,d,.55,'#d9d4c7');windows.push({x,y,w,d});}function furniture(x,y,w,d,h,col){box(x,y,0,w,d,h,col,true)}
// x east, y south. North courtyard; kitchen east courtyard.
box(0,0,-.12,8.2,8.4,.12,'#a88c69');
wall(0,0,.14,8.4);wall(8.06,0,.14,6.1);windowWall(8.06,6.1,.14,1.55);wall(8.06,7.65,.14,.75);wall(0,0,.75,.14);windowWall(.75,0,1.9,.14);wall(2.65,0,2.9,.14);windowWall(5.55,0,1.9,.14);wall(7.45,0,.75,.14);wall(0,8.26,3.65,.14);wall(4.55,8.26,3.65,.14);
wall(3.4,0,.12,3.4);wall(3.4,4.3,.12,2.15);wall(3.4,7.35,.12,1.05);wall(4.68,0,.12,3.4);wall(4.68,4.3,.12,.9);wall(0,5.2,3.4,.12);wall(4.8,5.2,3.4,.12);wall(3.52,1.65,.22,.12);wall(4.48,1.65,.2,.12);
// floors and furniture
// Complete apartment furnishings
const furnitureGroups = {};
const green='#17483f', oak='#967451', linen='#d9d0bf';
function legs(x,y,w,d,h,col){for(let dx of [.04,w-.09])for(let dy of [.04,d-.09])box(x+dx,y+dy,0,.05,.05,h,col)}
function desk(x,y,w,d){legs(x,y,w,d,.73,oak);box(x,y,.73,w,d,.045,oak);walls.push([x,y,w,d])}
function rug(x,y,w,d,col){box(x,y,.007,w,d,.012,col);for(let i=0;i<10;i++)box(x+i*w/10,y,.02,.012,d,.002,'#b3a18c')}
// User room: sofa faces east, TV opposite
let sofaStart=B.length;legs(.18,1.3,.96,2.2,.12,'#292b29');box(.18,1.3,.12,.96,2.2,.26,green);box(.18,1.3,.38,.22,2.2,.48,green);for(let y of [1.3,3.32])box(.18,y,.38,.96,.18,.31,green);for(let i=0;i<3;i++){box(.41,1.49+i*.61,.38,.71,.59,.14,'#24574d');box(.38,1.49+i*.61,.52,.19,.59,.34,'#205047')}let sofaEnd=B.length;walls.push([.18,1.3,.96,2.2]);
legs(2.86,1.58,.46,1.65,.12,'#292929');box(2.86,1.58,.12,.46,1.65,.36,'#383532');box(2.83,1.55,.48,.49,1.71,.04,'#262626');box(2.94,2.12,.52,.24,.62,.035,'#aaa9a5');box(3.04,1.68,.555,.045,1.44,.82,'#151719');box(2.89,1.8,.52,.09,.18,.025,'#222');walls.push([2.83,1.55,.49,1.71]);
desk(.88,.19,1.64,.62);box(1.15,.32,.775,.35,.24,.025,'#363b3d');box(1.15,.32,.8,.35,.025,.24,'#34383a');legs(1.48,.91,.43,.43,.43,'#454541');box(1.48,.91,.43,.43,.43,.06,'#555b55');box(1.48,1.29,.49,.43,.05,.39,'#555b55');furniture(.18,4.46,1.55,.59,2.12,'#a28b72');for(let x of [.22,.98]){box(x,4.43,.12,.72,.03,1.92,'#b3a087');box(x+.62,4.39,1.02,.025,.04,.16,'#514b42')}furnitureGroups.userRug = B.length; rug(1.25,1.65,1.25,1.65,'#c0b19a');
furnitureGroups.userRug = [furnitureGroups.userRug, B.length];
// Yrliet room
furniture(6.25,1.5,1.65,2.1,.28,'#8b725d');box(6.25,1.5,.28,1.65,2.1,.2,'#e1d9cb');box(6.25,1.43,0,1.65,.09,.9,'#9a7b60');box(6.35,1.63,.48,.66,.43,.12,'#e7dfd1');box(7.1,1.65,.48,.66,.43,.12,'#d8d2c7');box(6.27,2.12,.48,1.61,1.45,.09,'#8b9b8e');box(6.28,3.1,.57,1.58,.45,.05,'#b8a59c');desk(5,.18,1.7,.7);box(5.55,.33,.775,.7,.05,.43,'#303536');box(5.77,.38,.775,.26,.18,.035,'#4c4c47');box(5.45,.56,.775,.45,.14,.025,'#333');legs(5.55,1,.45,.45,.43,'#5c5145');box(5.55,1,.43,.45,.45,.06,'#86786c');box(5.55,1.4,.49,.45,.05,.43,'#86786c');furniture(7.65,3.85,.35,1.15,1.8,'#92765d');for(let z of [.3,.7,1.1,1.5]){box(7.28,3.85,z,.38,1.15,.045,oak);for(let i=0;i<8;i++)box(7.3,3.9+i*.13,z+.045,.24,.09,.19+(i%3)*.04,['#6b786b','#a76e59','#d2c1a3','#4e5860'][i%4])}furnitureGroups.yrlietRug = B.length; rug(5.05,2.15,1.05,1.7,'#a99a85');furnitureGroups.yrlietRug = [furnitureGroups.yrlietRug, B.length]; furniture(7.4,.55,.49,.48,.54,oak);box(7.43,.59,.54,.2,.24,.04,'#b6a78d');box(8.005,2.05,1.35,.035,.8,.65,'#66584a');box(7.995,2.1,1.4,.02,.7,.55,'#a8b0a1');
// Bathroom: tiled floor, shower, basin, WC, mirror
box(.15,5.34,.005,3.24,2.9,.02,'#b8b5a5');for(let i=0;i<10;i++)for(let j=0;j<9;j++)box(.16+i*.32,5.35+j*.32,.025,.313,.313,.008,(i+j)%2?'#d3d0c4':'#c7c4b9');furniture(.25,5.5,.95,.95,.12,'#e5e2da');box(.25,5.5,.12,.045,.95,1.95,'#a5b7b6');box(.25,5.5,.12,.95,.045,1.95,'#b6c7c6');box(.28,5.65,1.4,.04,.12,.5,'#aeb5b3');box(.28,5.65,1.88,.27,.12,.035,'#aeb5b3');furniture(.25,7.5,.6,.5,.78,'#a99b87');box(.22,7.46,.78,.66,.57,.12,'#eeeae2');box(.31,7.55,.9,.48,.38,.015,'#c2c5c0');box(.5,7.92,.9,.045,.045,.18,'#aaa');box(.15,7.45,1.12,.035,.6,.72,'#aebdc0');furniture(2.4,5.5,.45,.7,.43,'#eee');box(2.4,5.5,.43,.45,.19,.42,'#e5e3db');box(2.42,5.7,.43,.41,.48,.055,'#f0ede6');box(.18,6.6,.8,.04,.6,.045,'#aaa');box(.21,6.72,.45,.04,.38,.38,'#a5a99a');
// Utility closet and hallway
furniture(3.55,.2,.65,.65,.85,'#e7e7e0');box(3.6,.85,.1,.55,.025,.64,'#b6b9b6');box(3.65,.88,.2,.45,.025,.45,'#53636a');for(let z of [.4,.85,1.3,1.75]){box(4.35,.2,z,.3,1.3,.045,oak);for(let i=0;i<3;i++)box(4.37,.25+i*.38,z+.05,.23,.28,.24,['#b9b5a0','#d5cbb8','#85958a'][i])}box(3.56,7.55,1.5,.035,.55,.055,oak);for(let i=0;i<4;i++)box(3.59,7.59+i*.12,1.42,.08,.035,.08,'#6a6257');box(3.56,7.1,.1,.25,.43,.36,'#8d7861');
// window frames, sills, radiators, door lintels
for(let x of [.75,5.55]){box(x-.08,.14,.81,2.06,.22,.07,'#e7e0d1');for(let i=0;i<15;i++)box(x+.12+i*.11,.18,.15,.075,.12,.6,'#dedbd0')}
for(let [x,y,w,d] of [[3.4,3.4,.12,.9],[4.68,3.4,.12,.9],[3.4,6.45,.12,.9],[3.74,1.65,.74,.12],[3.65,8.26,.9,.14]]){box(x,y,2.15,w,d,.95,'#d9d4c7');box(x,y,2.1,w,d,.055,'#e8e1d4')}
// Kitchen joinery and everyday objects
const cream='#d8cdb5',wood='#9d7954',dark='#655747';
for(let i=0;i<5;i++){let x=5+i*.58; furniture(x,5.34,.56,.58,.86,cream);box(x+.025,5.925,.13,.51,.025,.65,'#e1d7c2');box(x+.19,5.96,.73,.18,.035,.025,dark)}
box(4.98,5.33,.86,2.94,.64,.055,wood);for(let i=0;i<14;i++)for(let j=0;j<4;j++)box(5+i*.205,5.325,.94+j*.15,.199,.018,.144,(i+j)%5?'#d9cbb5':'#c9baa4');
for(let i=0;i<2;i++){let x=5+i*.61;box(x,5.34,1.62,.59,.34,.68,cream);box(x+.03,5.685,1.65,.53,.025,.61,'#e7ddc9');box(x+.46,5.72,1.75,.025,.035,.14,dark)}
for(let z of [1.58,2.02]){box(6.35,5.34,z,1.48,.28,.045,wood);for(let i=0;i<5;i++)box(6.4+i*.22,5.4,z+.05,.13,.13,.13,['#a8b5a2','#e6d7c2','#ad765b','#d4c8b3','#697e82'][i])}
// sink and stove
box(5.19,5.43,.916,.57,.43,.022,'#a6a9a4');box(5.24,5.48,.94,.47,.33,.012,'#626d6c');box(5.43,5.4,.94,.035,.035,.25,'#b8c1bd');box(5.43,5.4,1.17,.035,.15,.035,'#b8c1bd');
box(6.62,5.94,.2,.57,.035,.51,'#343535');box(6.66,5.98,.66,.49,.03,.035,'#b8b7ac');box(6.6,5.39,.92,.59,.51,.025,'#deddd4');for(let x of [6.68,6.96])for(let y of [5.45,5.72]){box(x,y,.95,.17,.16,.025,'#30302e');box(x+.05,y+.04,.975,.07,.08,.012,'#6a6860')}
furniture(7.35,7.5,.6,.65,1.85,'#e0ddd3');box(7.35,7.47,.04,.6,.03,1.25,'#eee9dc');box(7.35,7.47,1.32,.6,.03,.49,'#eee9dc');for(let z of [.99,1.43])box(7.43,7.43,z,.035,.035,.19,dark);for(let i=0;i<3;i++)box(7.57+i*.1,7.435,1.12+i*.16,.08,.008,.1,['#9b795c','#8b9c91','#c0a68a'][i]);
// dining table, four distinct chairs
box(5.65,6.65,.72,1.25,.8,.06,wood);for(let x of [5.7,6.78])for(let y of [6.7,7.34])box(x,y,0,.07,.07,.72,dark);walls.push([5.65,6.65,1.25,.8]);
let chairIndex = 0;
for(let [x,y,side,col] of [[5.95,6.15,0,'#82735f'],[5.95,7.6,1,'#a58b68'],[5.1,6.83,2,'#718477'],[7.05,6.83,3,'#8c674c']]){const first = B.length; box(x,y,.42,.42,.42,.055,col);for(let dx of [0,.35])for(let dy of [0,.35])box(x+dx,y+dy,0,.055,.055,.42,col);if(side<2){let yy=y+(side===1?.37:0);for(let dx of [0,.35])box(x+dx,yy,.47,.055,.05,.43,col);box(x,yy,.77,.42,.05,.11,col)}else{let xx=x+(side===3?.37:0);for(let dy of [0,.35])box(xx,y+dy,.47,.05,.055,.43,col);box(xx,y,.77,.05,.42,.11,col)} furnitureGroups['chair'+ ++chairIndex] = [first,B.length];}
// sill, window frame, radiator
box(7.79,6.04,.81,.27,1.67,.07,'#e7e0d1');for(let i=0;i<13;i++)box(7.84,6.17+i*.105,.15,.13,.075,.6,'#dedbd0');
// objects added as rounded meshes below
const details=[];function round(x,y,z,r,h,col,top=r){details.push([x,y,z,r,h,col,top])}function plant(x,y,z,r){round(x,y,z,r,.16,'#a66c50',r*1.2);for(let i=0;i<7;i++){let a=i*2.4;round(x+Math.cos(a)*r*.65,y+Math.sin(a)*r*.65,z+.16,.035,.16+(i%3)*.06,['#647a48','#82965b','#456849'][i],.055)}}plant(7.91,6.35,.88,.095);plant(7.91,7.32,.88,.08);round(6.28,7.02,.78,.075,.17,'#839a91',.055);for(let i=0;i<5;i++){round(6.24+i*.019,7.02,.95,.007,.16+i*.015,'#687b4e');round(6.24+i*.019,7.02,1.11+i*.015,.035,.04,['#e1c4a5','#d5b05f'][i%2])}round(6.02,7.23,.78,.045,.095,'#536c70');round(6.48,6.85,.78,.045,.095,'#d7c4a2');box(6.65,7.13,.78,.16,.22,.025,'#7b8270');box(6.66,7.14,.805,.14,.20,.009,'#e6d8ba');
round(6.27,7.05,2.45,.24,.24,'#c7b08a',.09);round(6.27,7.05,2.69,.012,.41,'#514b42');
// Personal objects and greenery
plant(.35,.48,0,.14);plant(2.55,.25,.88,.09);plant(7.8,.35,0,.15);plant(5.15,.32,.78,.08);plant(7.62,4.8,0,.13);round(1.2,.55,.78,.045,.1,'#d2c2a8');for(let [x,y] of [[1.7,2.6],[6.5,2.6],[4.1,4.5],[1.6,6.8]]){round(x,y,2.75,.17,.16,'#d9c6a6',.08);round(x,y,2.91,.012,.19,'#514b42')}
// ceiling
box(0,0,3.1,8.2,8.4,.04,'#e6e0d4');
const presets=[['K01 Wejście',4.1,7.95,0,1.75],['K02 Pokoje',4.1,4.65,Math.PI,1.75],['K03 Twoje POV',6.16,7.82,0,1.2],['K04 Yrliet POV',6.16,6.35,Math.PI,1.2],['K05 Blat',6.1,6.15,Math.PI,1.65],['Twój pokój',1.7,3.8,0,1.7],['Pokój Yrliet',5.7,4.5,0,1.65],['Kanapa',.88,2.4,Math.PI/2,1.05,true],['Łazienka',1.65,6.8,0,1.7],['Schowek',4.05,1.35,0,1.65]];
