import { ellipse, rect, path, line, group, plate, bowl, pan, board, flecks } from './drawing.mjs';

// All arrangements are deterministic; food silhouettes carry the instructional detail.
const join = (items) => items.join('');
const at = (body, x, y, scale = 1, angle = 0) => group(body, `translate(${x} ${y}) rotate(${angle}) scale(${scale})`);
const seed = (x, y, angle = 0, color = '#39332d') => at(ellipse(0, 0, 2, 3.7, color, 'none'), x, y, 1, angle);
const spoon = (x, y, angle = 0) => at(rect(-7, 16, 14, 116, '#c7ceca', 6) + ellipse(0, 0, 24, 35, '#dfe5df', '#839087') + path('M-13 -12 Q-19 7 -9 18', 'none', '#fafaf4', 4), x, y, 1, angle);
const knife = (x, y, angle = 0) => at(path('M-13 -104 L16 -104 L16 35 Q-12 17 -13 -104Z', '#d8dfda', '#8b9690') + rect(-14, 36, 31, 95, '#745843', 7) + ellipse(1, 62, 3, 3, '#e9dfc9', 'none') + ellipse(1, 107, 3, 3, '#e9dfc9', 'none'), x, y, 1, angle);
const dish = (x, y, rx, ry, fill) => ellipse(x, y, rx + 9, ry + 9, '#f9f8ef', '#b9b6a7') + ellipse(x, y, rx, ry, fill, '#d2cbbc', 2);
const mint = (x, y, scale = 1, angle = 0) => at(path('M0 20 Q-32 -1 -10 -30 Q15 -26 0 20Z', '#668757', '#47684a', 2) + path('M0 20 Q20 0 27 -17 Q-1 -20 0 20Z', '#88a96d', '#47684a', 2) + line(0, 19, -9, -23, '#486b47', 1.5) + line(0, 19, 22, -13, '#486b47', 1.5), x, y, scale, angle);
const honey = (d) => path(d, 'none', '#c59335', 5) + path(d, 'none', '#ecc363', 2);

function dragonHalf(x, y, scale = 1, empty = false, angle = 0) {
  const skin = ellipse(0, 0, 78, 111, '#d64e79', '#92395c');
  const scales = join([-68, -30, 15, 61].flatMap((yy, i) => [
    path(`M-68 ${yy + 20} Q-113 ${yy - 5} -82 ${yy - 31} L-62 ${yy - 7}Z`, '#82a854', '#577747', 2),
    path(`M68 ${yy + 12} Q110 ${yy - 12} 80 ${yy - 37} L59 ${yy - 9}Z`, i % 2 ? '#9eb768' : '#82a854', '#577747', 2),
  ]));
  return at(scales + skin + ellipse(0, 0, 66, 98, empty ? '#f4abc0' : '#fffcf1', '#f6c4cf', 4) + (empty ? path('M-44 -61 Q-69 26 -27 76 M45 -65 Q62 26 31 76', 'none', '#d77294', 3) : flecks(95, 0, 0, 57, 89, '#39332d', 2)), x, y, scale, angle);
}
function dragonCube(x, y, s = 1, angle = 0) {
  return at(path('M-21 -15 L8 -24 L29 -6 L21 23 L-11 29 L-25 11Z', '#faf9eb', '#aaa18f', 2) + path('M-21 -15 L0 2 L29 -6 M0 2 L-11 29', 'none', '#dedacc', 2) + join([[-12,-10],[5,-14],[18,-4],[-12,11],[3,14],[17,10]].map(([xx,yy],i) => seed(xx,yy,i*27))), x, y, s, angle);
}
function kiwi(x, y, scale = 1, angle = 0) {
  return at(ellipse(0, 0, 43, 39, '#a6bd57', '#708b3e', 2) + ellipse(0, 0, 15, 13, '#edf0bc', 'none') + join(Array.from({length: 16}, (_, i) => {
    const a = i * Math.PI / 8;
    return line(Math.cos(a)*16,Math.sin(a)*14,Math.cos(a)*34,Math.sin(a)*30,'#cad77a',2) + seed(Math.cos(a)*24, Math.sin(a)*22, i*22.5);
  })), x, y, scale, angle);
}
const banana = (x, y, scale = 1) => at(ellipse(0, 0, 30, 27, '#f4e8af', '#cbb877', 2) + path('M-8 -4 L0 1 L7 -5 M0 1 L1 10', 'none', '#b7a16d', 2), x, y, scale);
const granola = (x, y, rx, ry, count = 36) => flecks(count, x, y, rx, ry, '#b18752', 7) + flecks(count, x+2, y-2, rx-3, ry-3, '#dac393', 4);

function mangoCheek(x, y, scale = 1, raised = false, angle = 0) {
  let body = ellipse(0, 0, 89, 126, '#eabd44', '#8e8f48', 5) + ellipse(0, 0, 80, 117, '#f7c748', '#efa72c', 3);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
    const xx = (c-1)*43, yy = (r-2)*42;
    if (raised) body += at(path('M-21 -12 L8 -25 L28 -10 L-2 4Z', '#ffd961', '#d39b28', 2) + path('M-21 -12 L-2 4 L-2 25 L-21 8Z', '#eeb036', '#d39b28', 2) + path('M-2 4 L28 -10 L24 12 L-2 25Z', '#f7c044', '#d39b28', 2), xx, yy);
  }
  if (!raised) body += join([-40,0,40].map(xx => path(`M${xx} -101 Q${xx-5} 0 ${xx} 101`, 'none', '#ce8e21', 3))) + join([-80,-40,0,40,80].map(yy => path(`M-65 ${yy} Q0 ${yy-5} 65 ${yy}`, 'none', '#ce8e21', 3)));
  return at(body, x, y, scale, angle);
}
const rice = (x, y, rx, ry) => ellipse(x,y,rx,ry,'#f2edd7','#ccc4a7',2) + join(Array.from({length:115},(_,i) => {
  const a=i*2.39996323, r=Math.sqrt((i+0.5)/115);
  return at(ellipse(0,0,3.5,8,'#fffdf0','#ddd7bd',0.7),x+Math.cos(a)*rx*r*0.94,y+Math.sin(a)*ry*r*0.91,1,i*43);
}));
const coconut = (x,y,scale=1) => at(dish(0,0,60,52,'#fffcf1') + path('M-38 7 Q-10 24 37 8', 'none','#e6e0cd',3),x,y,scale);

function citrus(x, y, scale = 1, lime = false, angle = 0) {
  const color = lime ? '#b4c568' : '#f3ab4c';
  let body = ellipse(0,0,58,55, lime ? '#718e4c' : '#f8e5b8',lime ? '#5f7b44' : '#d4af74',2) + ellipse(0,0,51,48,'#fff1d2','none');
  for(let i=0;i<9;i++) {
    const a=i*Math.PI*2/9+0.045, b=(i+1)*Math.PI*2/9-0.045;
    body+=path(`M${Math.cos(a)*8} ${Math.sin(a)*7} L${Math.cos(a)*46} ${Math.sin(a)*43} A46 43 0 0 1 ${Math.cos(b)*46} ${Math.sin(b)*43} L${Math.cos(b)*8} ${Math.sin(b)*7}Z`,color,'#eecf91',1);
    body+=line(Math.cos((a+b)/2)*19,Math.sin((a+b)/2)*17,Math.cos((a+b)/2)*39,Math.sin((a+b)/2)*36,lime?'#d9dfa0':'#ffd087',2);
  }
  return at(body,x,y,scale,angle);
}
const aril = (x,y,s=1,angle=0) => at(path('M-5 -7 Q2 -11 7 -4 L7 4 Q1 11 -5 6 Q-10 0 -5 -7Z','#bd3e51','#943847',1.1)+ellipse(-2,-3,1.7,2.8,'#f19196','none'),x,y,s,angle);
const arils = (count,x,y,rx,ry) => join(Array.from({length:count},(_,i)=>{const a=i*2.39996323,r=Math.sqrt((i+0.5)/count);return aril(x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r,0.9,i*37);}));
function pomegranateSection(x,y,scale=1,angle=0) {
  return at(path('M-73 50 Q-103 -47 -28 -85 Q65 -84 83 27 L26 61Z','#b64852','#883d44',3)+path('M-61 38 Q-84 -37 -25 -71 Q50 -75 66 23 L23 47Z','#f2e7cb','#d6c3a4',2)+arils(43,-10,-12,60,47)+path('M-18 -68 L-7 -26 L23 46 M-7 -26 L61 17','none','#f2e7cb',9),x,y,scale,angle);
}
const arugula = (x,y,scale=1,angle=0) => at(path('M0 49 L-7 26 Q-40 20 -17 7 Q-49 -8 -18 -14 Q-41 -36 -9 -28 Q-9 -64 5 -48 Q22 -35 9 -25 Q43 -34 24 -12 Q49 0 16 11 Q40 29 5 28Z','#75945c','#506b43',2)+path('M0 44 Q-1 3 0 -45','none','#bdc88b',2),x,y,scale,angle);

function artichoke(x,y,scale=1,angle=0,trimmed=true) {
  let body=path('M-19 58 L-15 147 Q0 157 16 143 L19 58Z',trimmed?'#d5d69c':'#729259','#697d49',3)+line(-5,91,-4,140,'#eef0bf',3);
  for(let row=0;row<3;row++) for(let i=0;i<9-row;i++) {
    const a=i*360/(9-row)+row*23;
    const leaf=path(trimmed?'M-29 -32 Q-31 -63 -13 -91 L12 -91 Q34 -65 29 -32 Q12 5 0 15 Q-24 -5 -29 -32Z':'M-29 -32 Q-31 -63 0 -106 Q34 -65 29 -32 Q12 5 0 15 Q-24 -5 -29 -32Z',row===0?'#809561':row===1?'#9eae76':'#b5be85','#526e49',2)+path('M0 0 Q-2 -34 0 -80','none','#d0d3a0',1.5);
    body+=at(leaf,0,0,1-row*.23,a);
  }
  body+=ellipse(0,0,22,24,'#c8ca94','#88975d',2);
  return at(body,x,y,scale,angle);
}
function artichokeHalf(x,y,scale=1,angle=0) {
  let body=path('M-17 82 L-13 139 Q0 147 16 137 L20 78Z','#d6d49a','#7f8859',2)+path('M0 102 Q-106 57 -73 -52 L-51 -91 L51 -91 Q105 24 49 79Z','#829463','#596f4b',3);
  for(let i=0;i<5;i++) {
    const w=72-i*11, top=-83+i*11;
    body+=path(`M0 84 Q-${w+32} 27 -${w} ${top} Q-${w-14} 7 0 45 Q${w-14} 7 ${w} ${top} Q${w+32} 27 0 84Z`,i%2?'#bac293':'#d0cfa0','#8f9b69',2);
  }
  body+=path('M-34 35 Q0 6 35 35 Q42 70 0 84 Q-42 68 -34 35Z','#ece3b1','#a9a174',2)+path('M-23 43 Q0 21 24 44 Q11 60 -8 57 Q-18 54 -23 43Z','#d6c890','#b9ad7b',2);
  return at(body,x,y,scale,angle);
}
const shears = (x,y,angle=0) => at(ellipse(-20,55,17,27,'none','#646d60',8)+ellipse(20,55,17,27,'none','#646d60',8)+path('M-19 31 L17 -87 L25 -104 L8 2 M19 31 L-17 -87 L-25 -104 L-8 2','none','#a7b0a7',8)+ellipse(0,6,5,5,'#e3e3d9','#697768',2),x,y,1,angle);
const fork = (x,y,angle=0) => at(path('M-15 -45 L-15 -8 Q0 16 15 -8 L15 -45 M-5 -46 L-5 -7 M5 -46 L5 -7 M0 6 L0 111','none','#8c9991',6),x,y,1,angle);
function jackPiece(x,y,scale=1,angle=0) {
  return at(path('M-39 24 L-9 -51 Q23 -49 46 -6 L26 40Z','#d9c896','#a29570',2)+join(Array.from({length:7},(_,i)=>path(`M${-25+i*9} 23 Q${-16+i*6} -5 ${-7+i*5} ${-41+i*4}`,'none',i%2?'#f1e2b3':'#b4a374',2.5)))+ellipse(20,4,8,12,'#ead7a7','#b6a476',1),x,y,scale,angle);
}
function shreds(x,y,rx,ry,count=55,browned=false) {
  return join(Array.from({length:count},(_,i)=>{
    const a=i*2.39996323,r=Math.sqrt((i+.5)/count),xx=x+Math.cos(a)*rx*r,yy=y+Math.sin(a)*ry*r;
    return at(path(`M-30 6 Q-12 -10 10 -5 L30 -14 Q21 0 4 5 Q-17 4 -30 6Z`,browned?(i%4===0?'#985331':'#ca8250'):(i%3===0?'#cbb783':'#e5d4a5'),browned?'#874f32':'#b6a477',1.4)+path('M-21 3 Q1 -4 19 -7','none',browned?'#e3a36c':'#fff0c7',1.5),xx,yy,0.8+(i%3)*.16,i*31);
  }));
}
const limeWedge = (x,y,angle=0,lemon=false) => at(path('M-37 -15 Q0 50 37 -15Z',lemon?'#e0ba4d':'#91ab51',lemon?'#b59942':'#5e7c45',3)+path('M-29 -12 Q0 33 29 -12Z',lemon?'#f4df91':'#dbe3a1','#f1edc6',3)+line(0,-11,0,19,'#f9f3cf',2)+line(0,-11,-18,10,'#f9f3cf',2)+line(0,-11,18,10,'#f9f3cf',2),x,y,1,angle);
const cilantro = (x,y,scale=1,angle=0) => at(path('M0 23 Q-2 4 -21 -3 Q-35 -17 -17 -19 Q-22 -37 -7 -29 Q1 -47 9 -29 Q28 -37 23 -20 Q42 -15 22 -4 Q8 4 0 23Z','#55875a','#3f6746',1.8)+line(0,23,2,-22,'#a8bc7b',1.5),x,y,scale,angle);
function taco(x,y,angle=0) {
  return at(ellipse(0,0,107,76,'#e7c887','#b89559',3)+flecks(45,0,0,96,65,'#b88e52',2)+path('M-91 23 Q0 81 92 22 L73 -26 Q0 -52 -76 -22Z','#d0a66b','#ac824b',2)+shreds(0,-4,77,36,29,true)+cilantro(-35,-13,.58,-28)+cilantro(28,3,.56,22)+path('M-98 21 Q-34 61 88 28 Q78 58 40 66 Q-32 83 -85 48Z','#f0d59b','#b89559',2)+flecks(18,-5,48,60,12,'#b99459',2),x,y,1,angle);
}

export default [
  {
    id: 'dragon-fruit-breakfast-bowl', title: 'Dragon Fruit Breakfast Bowl', source: 'samples/cooklang/exotic/dragon-fruit-breakfast-bowl.cook',
    stages: [
      { id: 'prep', title: 'Halve and scoop', caption: 'Dragon fruit is halved lengthwise. A spoon follows the pink peel to lift out the white, black-seeded flesh in one piece.', body: board()+dragonHalf(259,281,1.25,false,-12)+dragonHalf(513,277,1.15,true,17)+spoon(595,400,-23)+knife(121,359,-9) },
      { id: 'cooking', title: 'Cube and slice', caption: 'Peeled dragon fruit is cut into even bite-size cubes; banana and kiwi are sliced before the bowls are assembled.', body: board()+join([[213,175],[277,172],[343,175],[210,236],[275,237],[343,235],[220,304],[283,304],[350,301]].map(([x,y],i)=>dragonCube(x,y,1.1,i%2?9:-7)))+join([[463,183],[503,208],[542,232],[582,257]].map(([x,y])=>kiwi(x,y,.85,-12)))+join([[472,333],[515,350],[559,369],[597,391]].map(([x,y])=>banana(x,y,.85)))+knife(401,383,14)+dragonHalf(177,438,.39,true,-60) },
      { id: 'finished', title: 'Yogurt breakfast bowl', caption: 'Greek yogurt is topped with dragon fruit cubes, banana, kiwi, granola, and a light drizzle of honey.', body: bowl('#f9f6e9')+path('M249 265 Q255 142 404 143 Q551 138 570 260 Q604 391 454 454 Q284 471 232 346 Q221 292 249 265Z','#fffdf4','#e5dfca',2)+join([[288,224],[339,213],[387,209],[273,281],[327,273],[375,272],[280,337],[333,333]].map(([x,y],i)=>dragonCube(x,y,.9,i*13)))+join([[453,204],[485,248],[509,294]].map(([x,y])=>kiwi(x,y,.92,9)))+join([[505,352],[474,392],[429,415],[383,420]].map(([x,y])=>banana(x,y,.88)))+granola(397,348,44,39)+honey('M285 208 Q346 226 316 276 Q281 329 364 348 Q450 371 449 405')+spoon(679,221,-5) },
    ],
  },
  {
    id: 'mango-sticky-rice', title: 'Mango Sticky Rice with Hedgehog-Cut Mango', source: 'samples/cooklang/exotic/mango-sticky-rice.cook',
    stages: [
      { id: 'prep', title: 'Score the mango cheeks', caption: 'Mango cheeks are cut close to the flat pit, then crosshatched without piercing the skin. One cheek is turned inside out to lift its cubes.', body: board()+mangoCheek(283,281,1.13,false,-16)+mangoCheek(518,276,1.02,true,13)+knife(628,386,29)+path('M165 419 Q251 382 302 430 Q242 477 165 419Z','#f5cd63','#b69b53',3)+path('M188 422 Q245 405 278 431','none','#e3b848',9) },
      { id: 'cooking', title: 'Fold in coconut sauce', caption: 'Cooked glutinous rice receives half of the warmed coconut milk, sugar, and salt sauce; it will rest covered for ten minutes. The remaining sauce is reserved for serving.', body: at(pan('#eee9d7'),-8,0,.94)+rice(364,288,174,155)+path('M309 211 Q340 184 382 211 Q442 201 445 246 Q421 291 364 277 Q320 300 290 266 Q275 236 309 211Z','#fffdf2','#e8dfcb',2)+spoon(490,375,37)+at(rect(47,-9,100,23,'#717c6f',9)+dish(0,0,74,67,'#fdfbef'),625,138,.9,-26)+path('M567 169 Q520 200 454 226','none','#f9f5df',11)+coconut(665,466,.77)+ellipse(671,470,27,20,'#fffef5','none') },
      { id: 'finished', title: 'Rice, mango, sesame', caption: 'Sticky coconut rice is plated beside the hedgehog-cut mango and finished with reserved coconut sauce and toasted sesame seeds.', body: plate()+rice(311,304,107,125)+path('M258 224 Q312 199 357 241 Q352 267 323 271 Q293 250 261 270 Q230 253 258 224Z','#fffdf3','#e9e2cf',2)+mangoCheek(486,310,.92,true,18)+flecks(32,315,283,71,80,'#ac8754',2.5)+flecks(12,476,307,42,75,'#977145',2)+coconut(684,151,.65)+spoon(682,326,7) },
    ],
  },
  {
    id: 'pomegranate-citrus-salad', title: 'Pomegranate Citrus Salad', source: 'samples/cooklang/exotic/pomegranate-citrus-salad.cook',
    stages: [
      { id: 'prep', title: 'Open along the ridges', caption: 'The pomegranate skin is scored from crown to base along its natural ridges, then opened into sections with the white pith still attached to the peel.', body: board()+ellipse(258,270,103,112,'#b74b54','#833c43',3)+path('M238 163 L238 145 L251 154 L263 140 L275 155 L288 149 L282 169Z','#8f4149','#783b41',2)+path('M250 178 Q200 268 249 370 M269 176 Q290 265 270 373 M287 181 Q349 268 294 360','none','#f0ba9d',3)+pomegranateSection(487,257,1.1,12)+pomegranateSection(535,421,.65,-52)+knife(130,363,-14)+arils(8,386,422,50,29) },
      { id: 'cooking', title: 'Release arils in water', caption: 'Pomegranate sections are loosened in a bowl of water: red arils settle below while loose white pith floats and is skimmed away. Oranges are peeled and sliced into rounds.', body: at(bowl('#d8e8e3'),-116,6,.84)+arils(100,222,276,126,126)+pomegranateSection(255,234,.79,-19)+path('M122 195 Q140 173 159 189 L151 212 L132 207Z','#fbf5de','#d7d3bb',2)+path('M189 340 L210 332 L224 351 L198 362Z','#fbf5de','#d7d3bb',2)+path('M329 306 L350 314 L341 333 L324 322Z','#fbf5de','#d7d3bb',2)+path('M98 263 Q111 250 141 256 M268 376 Q307 378 327 359','none','#f4fbf4',3)+spoon(369,172,25)+rect(468,116,261,377,'#e5cba4',23,'#b49872')+citrus(563,214,.94)+citrus(617,292,.94)+citrus(562,375,.94)+path('M666 137 Q713 165 674 201 Q643 223 678 245','none','#e39439',14)+path('M666 137 Q713 165 674 201 Q643 223 678 245','none','#ffe4ac',5) },
      { id: 'finished', title: 'Arrange the citrus salad', caption: 'Arugula, peeled orange rounds, ruby pomegranate arils, and mint are arranged on a platter with olive oil, lemon, honey, and salt dressing.', body: ellipse(400,300,292,210,'#fcfbf3','#b7b4a6',3)+ellipse(400,300,266,184,'#f4f0e2','#d9d4c6',2)+join(Array.from({length:20},(_,i)=>{const a=i*2.39996323,r=Math.sqrt((i+.5)/20);return arugula(400+Math.cos(a)*207*r,300+Math.sin(a)*126*r,.87,i*67); }))+join([[248,266],[339,214],[435,222],[523,269],[477,354],[368,364],[280,352]].map(([x,y],i)=>citrus(x,y,.84,false,i*27)))+arils(87,400,301,217,137)+mint(203,305,.8,-37)+mint(409,299,.8,19)+mint(556,338,.8,51)+mint(370,180,.6,-11)+honey('M225 240 Q323 277 390 239 M369 370 Q429 322 513 349') },
    ],
  },
  {
    id: 'steamed-artichoke-aioli', title: 'Steamed Artichoke with Lemon Aioli', source: 'samples/cooklang/exotic/steamed-artichoke-aioli.cook',
    stages: [
      { id: 'prep', title: 'Trim the leaves and stem', caption: 'Artichoke tops are cut off, sharp leaf tips are clipped flat, and tough green stem skin is peeled away to the pale center. Lemon is rubbed on the cut surfaces.', body: board()+artichoke(277,262,1.14,-21,true)+artichoke(516,254,.86,17,true)+shears(598,406,-35)+at(limeWedge(0,0,-15,true),189,430,1.3)+path('M417 393 Q444 414 431 443 M449 404 Q472 436 456 467 M411 430 Q432 463 406 478','none','#67844f',9)+path('M177 129 L186 116 L208 121 L215 138Z','#829660','#526e49',2)+path('M360 143 L375 122 L397 136 L390 151Z','#829660','#526e49',2)+knife(106,336,-7) },
      { id: 'cooking', title: 'Steam until tender', caption: 'Two trimmed artichokes steam above water in a covered pot for about 35 minutes, until a leaf pulls away easily. The lid is set aside in this instructional view.', body: rect(91,268,95,57,'#69786d',18)+rect(610,268,99,57,'#69786d',18)+ellipse(400,300,225,215,'#7e8980','#536257',4)+ellipse(400,300,204,194,'#dae3d3','#aab7a3',3)+flecks(95,400,300,185,177,'#9da995',4)+ellipse(400,300,167,156,'none','#bcc9b5',2)+artichoke(307,277,.99,-27,true)+artichoke(498,284,.99,24,true)+at(ellipse(0,0,80,70,'#c8d0c3','#929e8d',3)+ellipse(0,0,17,15,'#637260','#53604f',3),687,99,.8)+path('M181 144 Q197 126 186 105 M398 113 Q412 94 402 75 M603 167 Q622 147 611 128','none','#bfc9b8',4) },
      { id: 'finished', title: 'Clear the hearts and serve', caption: 'Cooked artichokes are halved and the fuzzy choke is scraped away, revealing smooth hearts. The halves are served warm with mayonnaise, lemon, garlic, and salt aioli.', body: plate()+artichokeHalf(273,280,.88,-30)+artichokeHalf(425,218,.83,12)+artichokeHalf(500,370,.84,114)+artichokeHalf(337,397,.75,-143)+dish(657,238,66,61,'#f2e7bc')+path('M616 235 Q648 206 685 230 Q699 260 645 263 Q624 267 623 247','none','#d9cb91',4)+flecks(15,655,239,42,38,'#b5a777',1.5)+limeWedge(641,398,20,true)+spoon(123,305,-15) },
    ],
  },
  {
    id: 'young-jackfruit-tacos', title: 'Young Jackfruit Tacos', source: 'samples/cooklang/exotic/young-jackfruit-tacos.cook',
    stages: [
      { id: 'prep', title: 'Remove cores and shred', caption: 'Drained young green jackfruit is separated from its firm triangular cores. The softer pieces are pulled into distinct strands rather than mashed.', body: board()+jackPiece(209,208,1.18,-20)+jackPiece(292,211,1,28)+jackPiece(218,306,.94,15)+path('M171 417 L204 361 L237 424Z','#c3ad76','#968453',2)+path('M257 443 L296 391 L324 449Z','#c3ad76','#968453',2)+shreds(499,281,117,121,65,false)+fork(410,191,-29)+fork(578,379,153)+knife(111,344,-6)+line(190,406,204,383,'#e1cc95',2)+line(277,432,295,408,'#e1cc95',2) },
      { id: 'cooking', title: 'Simmer and brown the strands', caption: 'Shredded jackfruit cooks with softened onion, garlic, chili powder, cumin, smoked paprika, orange juice, and soy sauce. Lightly browned edges remain visibly fibrous.', body: pan('#4b4336')+path('M231 238 Q302 155 413 168 Q524 158 558 268 Q585 369 494 424 Q346 464 256 388 Q198 332 231 238Z','#a96138','#87492e',3)+shreds(396,299,172,145,133,true)+join([[273,219],[454,218],[310,350],[490,357],[410,408],[260,296]].map(([x,y],i)=>at(path('M-14 0 Q0 -18 15 1 Q3 18 -14 0Z','#d8b47b','#aa7e4e',1.3),x,y,1,i*41)))+flecks(43,396,299,167,140,'#70462e',2)+at(rect(-23,-76,46,73,'#ae8153',9)+rect(-9,-4,18,139,'#d3b480',7)+line(-10,-59,-10,-20,'#805e3e',3)+line(0,-59,0,-20,'#805e3e',3)+line(10,-59,10,-20,'#805e3e',3),520,408,1,-33)+citrus(104,100,.63,false) },
      { id: 'finished', title: 'Fill warm corn tortillas', caption: 'Corn tortillas hold saucy, lightly browned jackfruit strands and fresh cilantro, with lime wedges alongside for squeezing.', body: ellipse(400,300,291,215,'#fcfbf3','#b8b4a7',3)+ellipse(400,300,267,191,'#f1ecdc','#dbd3bf',2)+taco(289,214,-14)+taco(508,232,16)+taco(389,388,-3)+limeWedge(216,380,-28)+limeWedge(577,364,37)+limeWedge(551,446,13)+cilantro(171,288,.7,-43)+cilantro(489,467,.66,32) },
    ],
  },
];
