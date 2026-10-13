const places=window.KHAOYAI_PLACES;
const trip=[
  {title:'ออกจากขอนแก่น',sub:'จุดเริ่มต้นของเรา',icon:'🏡',coords:[16.4044293,102.7931929],x:195,y:145},
  {title:'เยี่ยมเพื่อน · ปึงหงี่เชียง',sub:'สาขาใหญ่ · สามแยกปักธงชัย',icon:'🤝',coords:[14.9587846,102.0547698],address:'3411 ถ.มิตรภาพ ต.ในเมือง อ.เมืองนครราชสีมา',maps:'https://www.google.com/maps?cid=2781679873927163381',mapNote:'จุดนัดพบที่ร้านปึงหงี่เชียง สาขาใหญ่ · หมุดร้านจากลิงก์ Google Maps ที่คุณยืนยัน',x:380,y:310,labelSide:'left'},
  {title:'กางเต็นท์ · เขาใหญ่',sub:'พัก 1 คืน · ยังไม่เลือกลาน',icon:'⛺',coords:[14.3109229,101.5304415],maps:'https://www.google.com/maps?cid=93256245950163964',mapNote:'หมุดอุทยานแห่งชาติเขาใหญ่จากลิงก์ที่คุณยืนยัน · ยังไม่ใช่หมุดลานกางเต็นท์หรือประตูเข้า',x:300,y:650},
  {title:'The White Rabbit Pool Villa Khao Yai',sub:'ที่พักคืนถัดไป',icon:'🐇',coords:[14.5986301,101.4724236],maps:'https://www.google.com/maps?cid=5266155117384773851',mapNote:'หมุดวิลล่าจากลิงก์ Google Maps ที่คุณยืนยัน · ใช้ทางเข้าตามป้าย',x:610,y:480}
];
const categories=[...new Set(places.map(p=>p.category))];
const icons=['🌳','🐑','🌸','☕','🍜','🙏','🛍️','🏡','🚙','📷'];const tints=['#dcebc9','#fce4ba','#f6d7e5','#f6dfc4','#f8dac7','#e2d8f2','#d8e9ef','#dde3f5','#e6e5da','#f3dfcf'];
const centers=[[235,525],[455,350],[585,310],[695,250],[620,410],[700,565],[320,220],[825,475],[80,230],[125,410]];
let selected=null,real=false,zoom=1;
let osmMap=null,osmPins=null,osmStatus=null,tileFailed=false;
let locationButton=null,userMarker=null,userAccuracy=null,locationMessage='',locating=false;
const $=id=>document.getElementById(id);const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
function button(text,fn,cls=''){const b=el('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;}function link(text,url,cls='btn'){const a=el('a',cls,text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function shortZone(p){return p.zone.split('/')[0].trim();}function query(p){return coordinates(p)?coordinates(p).join(','):p.mapQuery||p.query||p.title+' '+shortZone(p)+' ปากช่อง';}function mapurl(p){return p.maps||'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query(p));}function navurl(p){return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(query(p))+'&travelmode=driving&dir_action=navigate';}

for(const [i,c] of categories.entries()){const option=el('option','',icons[i]+' '+c+' · '+places.filter(p=>p.category===c).length+' จุด');option.value=c;$('category').append(option);}
for(const z of [...new Set(places.map(shortZone))].sort((a,b)=>a.localeCompare(b,'th'))){const o=el('option','',z);o.value=z;$('zone').append(o);}
trip.forEach((p,i)=>{const b=button('',()=>choose(p),'stop');b.append(el('span','icon',p.icon));const txt=el('span');txt.append(el('strong','',(i+1)+'. '+p.title),el('small','',p.sub));b.append(txt);$('trip').append(b);if(i<3)$('trip').append(el('span','arrow','→'));});
function svg(tag,attrs){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;}
function pin(p,x,y,major=false){const idx=categories.indexOf(p.category);const g=svg('g',{class:'pin'+(major?' major':''),transform:`translate(${x} ${y})`,role:'button',tabindex:'0','aria-label':p.title,'aria-pressed':String(selected===p)});g.append(svg('path',{class:'bubble',d:major?'M-27-20Q-27-34 0-34T27-20V9Q27 22 8 22L0 32-8 22Q-27 22-27 9Z':'M-22-17Q-22-28 0-28T22-17V7Q22 17 6 17L0 25-6 17Q-22 17-22 7Z',fill:major?'#fff8e7':tints[idx]}));const glyph=svg('text',{class:'glyph',y:'-4'});glyph.textContent=major?p.icon:icons[idx];g.append(glyph);if(major){const left=p.labelSide==='left';const labelX=left?'-35':'35';const anchor=left?'end':'start';const label=svg('text',{class:'label',x:labelX,y:'-6','text-anchor':anchor});label.textContent=p.title;const sub=svg('text',{class:'sub',x:labelX,y:'12','text-anchor':anchor});sub.textContent=p.sub;g.append(label,sub);}else{const num=svg('text',{class:'num',y:'16'});num.textContent=p.id;g.append(num);}g.addEventListener('click',()=>choose(p));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(p);}});return g;}
function filtered(){const q=$('search').value.trim().toLocaleLowerCase();return places.filter(p=>(!$('category').value||p.category===$('category').value)&&(!$('zone').value||shortZone(p)===$('zone').value)&&(!q||[p.title,p.category,p.zone,p.description].join(' ').toLocaleLowerCase().includes(q)));}
function render(){const list=filtered();$('count').textContent=`${list.length} จุดน่าแวะ · ${places.length} จุดทั้งหมด`;$('list').replaceChildren();$('pins').replaceChildren();for(const p of list){const idx=categories.indexOf(p.category);const b=button('',()=>choose(p),'place');b.setAttribute('aria-pressed',String(p===selected));const sticker=el('span','sticker',icons[idx]);sticker.style.background=tints[idx];const text=el('span');text.append(el('strong','',p.id+'. '+p.title),el('small','',shortZone(p)));b.append(sticker,text);$('list').append(b);const group=places.filter(a=>a.category===p.category);const order=group.indexOf(p);const [cx,cy]=centers[idx];const angle=(order/group.length)*Math.PI*2;const r=group.length>1?65:0;$('pins').append(pin(p,cx+Math.cos(angle)*r,cy+Math.sin(angle)*r));}if(!list.length)$('list').append(el('p','','ไม่เจอจุดนี้ ลองค้นหาใหม่ได้เลย 🌿'));$('mainpins').replaceChildren(...trip.map(p=>pin(p,p.x,p.y,true)));if(real&&osmMap)syncOsmPins();}
function choose(p){selected=p;render();const panel=$('selected');panel.hidden=false;panel.replaceChildren();const close=button('✕',()=>{panel.hidden=true;selected=null;render();},'closepanel');close.setAttribute('aria-label','ปิดรายละเอียด');const idx=categories.indexOf(p.category);panel.append(close,el('div','badge',p.category?icons[idx]+' '+p.category:p.icon+' จุดหมายหลัก'),el('h2','',p.title),el('p','',p.description||p.sub),el('p','',p.address|| (p.coords?'พิกัดจากคุณ · '+p.coords.join(', '):'ตำแหน่งชั่วคราว · รอยืนยันก่อนเดินทาง')));const actions=el('div','actions');const navigation=p.needsBranch?button('นำทาง · รอเลือกสาขา',()=>{},'btn'):link('นำทาง 🚗',navurl(p),'btn primary');if(p.needsBranch){navigation.disabled=true;navigation.title='ยืนยันสาขาก่อนนำทาง';}actions.append(navigation,link('แผนที่ ↗',mapurl(p)));if(p.guide)actions.append(button('รายละเอียด 📖',()=>openDetail(p),'btn'));panel.append(actions);if(p.mapNote)panel.append(el('p','pending-coords','📍 '+p.mapNote));if(real&&!coordinates(p))panel.append(el('p','pending-coords','📍 จุดนี้ยังไม่มีพิกัดสำหรับปักหมุด ใช้ปุ่มแผนที่เพื่อค้นหาบน Google Maps ได้'));if(real)loadReal();}
function setView(value){real=value;$('board').classList.toggle('real',real);$('realmap').hidden=!real;$('sketchTab').setAttribute('aria-pressed',String(!real));$('realTab').setAttribute('aria-pressed',String(real));$('mapnotice').replaceChildren(el('span','',real?'🗺️ แผนที่จริง · ลองดูจุดแวะของเรา':'📌 แผนที่ภาพร่างสำหรับลอง UI'),el('small','',real?'หมุดจากพิกัดจริง · กดเพื่อดูรายละเอียด':'ตำแหน่งในภาพร่างใช้จัดวางตัวอย่าง ไม่ใช้เทียบระยะจริง'));if(real)loadReal();}
function loadReal(){
  if(!window.L){$('realmap').replaceChildren(el('div','map-load-error','เปิดแผนที่ไม่สำเร็จ ลองรีเฟรชหน้า หรือใช้ปุ่มแผนที่ Google Maps'));return;}
  if(!osmMap){
    const canvas=el('div','osm-canvas');canvas.id='osmCanvas';
    const tools=el('div','osm-tools');
    locationButton=button('📍 ตำแหน่งฉัน',locateMe,'locate-button');
    locationButton.title='ขอตำแหน่งปัจจุบันและเลื่อนแผนที่มาที่ฉัน';
    tools.append(button('🌿 รอบเขาใหญ่',()=>fitOsm(false)),button('🏡 รวมจุดเริ่มต้น',()=>fitOsm(true)),locationButton);
    osmStatus=el('div','osm-status');osmStatus.setAttribute('role','status');
    $('realmap').replaceChildren(canvas,tools,osmStatus);
    osmMap=L.map(canvas,{zoomControl:false,scrollWheelZoom:false}).setView([14.52,101.42],10);
    L.control.zoom({position:'topright'}).addTo(osmMap);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).on('tileerror',()=>{tileFailed=true;updateOsmStatus();}).addTo(osmMap);
    osmPins=L.layerGroup().addTo(osmMap);
  }
  syncOsmPins();
  requestAnimationFrame(()=>{if(!real)return;osmMap.invalidateSize();const coords=selected&&coordinates(selected);if(coords)osmMap.setView(coords,14,{animate:false});else if(!selected)fitOsm(false);});
}
function coordinates(p){return p.mapCoords||p.coords;}
function updateOsmStatus(){if(!osmStatus)return;const count=filtered().filter(p=>coordinates(p)).length;const pending=filtered().length-count;osmStatus.replaceChildren(el('span','',(tileFailed?'โหลดพื้นแผนที่ไม่ได้ · ตรวจอินเทอร์เน็ต · ':'')+'หมุดสถานที่ '+count+' จุด'+(pending?' · รอพิกัด '+pending+' จุด':' · พิกัดครบแล้ว')+(selected&&!coordinates(selected)?' · จุดที่เลือกยังไม่มีพิกัด':'')));if(locationMessage)osmStatus.append(el('span','location-status',locationMessage));}
function locateMe(){
  if(!osmMap||locating)return;
  if(!window.isSecureContext){locationMessage='เปิดเว็บผ่าน HTTPS หรือ localhost เพื่อใช้ตำแหน่งปัจจุบัน';updateOsmStatus();return;}
  if(!navigator.geolocation){locationMessage='เบราว์เซอร์นี้ไม่รองรับตำแหน่งปัจจุบัน';updateOsmStatus();return;}
  locating=true;locationButton.disabled=true;locationButton.textContent='📍 กำลังหา…';locationButton.setAttribute('aria-busy','true');
  locationMessage='กำลังหาตำแหน่ง · อนุญาตการเข้าถึงตำแหน่งเมื่อเบราว์เซอร์ถาม';updateOsmStatus();
  const finish=()=>{locating=false;locationButton.disabled=false;locationButton.textContent='📍 ตำแหน่งฉัน';locationButton.setAttribute('aria-busy','false');updateOsmStatus();};
  const failed=error=>{
    locationMessage=error.code===1?'ยังไม่ได้รับสิทธิ์ตำแหน่ง · อนุญาตตำแหน่งในตั้งค่าเว็บไซต์ แล้วกดใหม่':error.code===3?'หาตำแหน่งนานเกินไป · ลองกดอีกครั้ง':'หาตำแหน่งไม่ได้ · ตรวจว่าบนอุปกรณ์เปิดบริการตำแหน่ง แล้วลองใหม่';
    if(userMarker)locationMessage+=' · หมุดยังแสดงตำแหน่งครั้งก่อน';
    finish();
  };
  try{navigator.geolocation.getCurrentPosition(position=>{
    const {latitude,longitude,accuracy}=position.coords;
    const coords=[latitude,longitude];
    const label='ตำแหน่งฉัน · คลาดเคลื่อนประมาณ '+Math.ceil(accuracy).toLocaleString('th-TH')+' เมตร';
    if(userMarker){userMarker.setLatLng(coords);userMarker.setTooltipContent(el('span','',label));userAccuracy.setLatLng(coords).setRadius(accuracy);}
    else{
      userAccuracy=L.circle(coords,{radius:accuracy,color:'#287bcc',weight:1,fillColor:'#4299ec',fillOpacity:.12,interactive:false}).addTo(osmMap);
      const icon=L.divIcon({html:el('span','user-location-dot'),className:'user-location-pin',iconSize:[24,24],iconAnchor:[12,12],tooltipAnchor:[0,-12]});
      userMarker=L.marker(coords,{icon,title:'ตำแหน่งฉัน',alt:'ตำแหน่งฉัน',zIndexOffset:2000}).bindTooltip(el('span','',label),{direction:'top',className:'osm-tooltip'}).addTo(osmMap);
    }
    locationMessage=label+' · กดตำแหน่งฉันเพื่ออัปเดต';
    if(real){osmMap.invalidateSize();osmMap.setView(coords,Math.max(osmMap.getZoom(),15),{animate:false});userMarker.openTooltip();}
    finish();
  },failed,{enableHighAccuracy:true,timeout:15000,maximumAge:0});}catch{failed({code:2});}
}
function syncOsmPins(){
  if(!osmPins)return;osmPins.clearLayers();
  for(const p of [...filtered(),...trip]){
    const coords=coordinates(p);if(!coords)continue;
    const idx=categories.indexOf(p.category);const sticker=el('div','osm-sticker'+(p===selected?' is-selected':''));
    sticker.style.setProperty('--pin-tint',idx<0?'#fff3d9':tints[idx]);
    sticker.append(el('span','osm-glyph',idx<0?p.icon:icons[idx]));if(p.id)sticker.append(el('small','osm-number',String(p.id)));
    const icon=L.divIcon({html:sticker,className:'osm-pin',iconSize:[46,55],iconAnchor:[23,55],tooltipAnchor:[0,-49]});
    const tooltip=el('span','',p.title);
    L.marker(coords,{icon,title:p.title,alt:p.title,keyboard:true,riseOnHover:true,zIndexOffset:p===selected?1000:0}).bindTooltip(tooltip,{direction:'top',className:'osm-tooltip'}).on('click',()=>choose(p)).addTo(osmPins);
  }
  updateOsmStatus();if(!selected)fitOsm(false);
}
function fitOsm(includeStart){if(!osmMap)return;const all=[...filtered(),...trip.filter(p=>includeStart||p!==trip[0])];const coords=all.map(coordinates).filter(Boolean);if(coords.length)osmMap.fitBounds(L.latLngBounds(coords),{paddingTopLeft:[55,105],paddingBottomRight:[55,70],maxZoom:13,animate:false});else osmMap.setView([14.52,101.42],10,{animate:false});}

let mapExpanded=false,fullscreenBusy=false;
const backgroundInert=new Map();
function setMapExpanded(value){
  mapExpanded=value;
  $('board').classList.toggle('map-expanded',value);
  document.body.classList.toggle('map-fullscreen-open',value);
  const label=value?'ย่อแผนที่กลับ':'เปิดแผนที่เต็มจอ';
  $('fullscreen').textContent=value?'✕':'⛶';
  $('fullscreen').title=label;
  $('fullscreen').setAttribute('aria-label',label);
  $('fullscreen').setAttribute('aria-pressed',String(value));
  // Keep the visitor guide inside the fullscreen element so it stays visible.
  (value?$('board'):document.body).append($('dialog'));
  if(value){
    for(const node of document.querySelectorAll('header, #trip, .sidebar')){if(!backgroundInert.has(node))backgroundInert.set(node,node.inert);node.inert=true;}
  }else{for(const [node,inert] of backgroundInert)node.inert=inert;backgroundInert.clear();}
  $('fullscreen').focus({preventScroll:true});
  requestAnimationFrame(()=>{if(osmMap)osmMap.invalidateSize({pan:false});});
}
async function toggleMapFullscreen(){
  if(fullscreenBusy)return;
  fullscreenBusy=true;$('fullscreen').disabled=true;
  try{
    if(mapExpanded){
      if(document.fullscreenElement===$('board'))await document.exitFullscreen();
      setMapExpanded(false);
    }else{
      setMapExpanded(true);
      if($('board').requestFullscreen){
        try{await $('board').requestFullscreen();}catch{/* Keep the viewport-sized map when native fullscreen is unavailable. */}
      }
    }
  }catch{/* Keep the exit button available if the browser refuses to leave fullscreen. */}
  finally{fullscreenBusy=false;$('fullscreen').disabled=false;$('fullscreen').focus({preventScroll:true});}
}
document.addEventListener('fullscreenchange',()=>setMapExpanded(document.fullscreenElement===$('board')));
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&mapExpanded&&!$('dialog').open&&!document.fullscreenElement){event.preventDefault();setMapExpanded(false);}
});
$('fullscreen').addEventListener('click',toggleMapFullscreen);

function setZoom(value){zoom=Math.max(1,Math.min(2.5,value));const w=1000/zoom,h=740/zoom;const cx=zoom>1?500:500,cy=zoom>1?440:370;$('art').setAttribute('viewBox',`${cx-w/2} ${cy-h/2} ${w} ${h}`);}
function guideSection(title,content,cls=''){
  const section=el('section','guide-section '+cls);section.append(el('h3','',title));
  if(Array.isArray(content)){const ul=el('ul');for(const text of content)ul.append(el('li','',text));section.append(ul);}
  else section.append(el('p','',content));
  return section;
}
function openDetail(p){
  const host=$('detail'),g=p.guide;host.replaceChildren();
  host.append(el('div','guide-category',icons[categories.indexOf(p.category)]+' '+p.category+' · '+shortZone(p)));
  const title=el('h2','guide-title',p.title);title.id='detailTitle';host.append(title);
  if(g.notice)host.append(el('p','guide-notice','📌 '+g.notice));
  host.append(el('p','guide-intro',g.about));if(p.mapNote)host.append(el('p','guide-notice','📍 '+p.mapNote));host.append(guideSection('🎈 ไปแล้วทำอะไรได้',g.activities));
  const comparison=el('div','guide-comparison');comparison.append(guideSection('🌿 ข้อดี',g.pros,'guide-pros'),guideSection('🍂 ข้อเสีย / ข้อจำกัด',g.cons,'guide-cons'));host.append(comparison);
  host.append(guideSection('⚠️ ข้อควรระวัง',g.cautions,'guide-cautions'),guideSection('💛 เหมาะกับใคร',g.audience));
  const info=el('dl','guide-info');for(const [label,value]of [['ที่ตั้ง',p.address],['เวลาเผื่อเที่ยว',p.time.split('—')[0].trim()]]){if(!value)continue;info.append(el('dt','',label),el('dd','',value));}host.append(info);
  const actions=el('div','actions');actions.append(link('นำทาง 🚗',navurl(p),'btn primary'),link('แผนที่ ↗',mapurl(p)));host.append(actions);
  const refs=el('details','guide-references');refs.append(el('summary','','แหล่งข้อมูลที่ใช้ประกอบรายละเอียด'));
  const ul=el('ul');for(const ref of p.references){const li=el('li');li.append(link(ref.label,ref.url,''));ul.append(li);}refs.append(ul);
  refs.append(el('p','','ข้อดีและข้อจำกัดเป็นสรุปช่วยเลือกเที่ยวจากข้อมูลที่มี ไม่ใช่รีวิวจากการไปเอง เวลาเปิด ราคา และกิจกรรมอาจเปลี่ยนได้ ให้ตรวจจากสถานที่ก่อนเดินทาง'));host.append(refs);
  $('dialog').showModal();$('dialog').scrollTop=0;
}

$('search').addEventListener('input',render);$('category').addEventListener('change',render);$('zone').addEventListener('change',render);$('reset').addEventListener('click',()=>{$('category').value='';$('search').value='';$('zone').value='';render();});$('sketchTab').addEventListener('click',()=>setView(false));$('realTab').addEventListener('click',()=>setView(true));$('zoomIn').addEventListener('click',()=>setZoom(zoom+.3));$('zoomOut').addEventListener('click',()=>setZoom(zoom-.3));$('fit').addEventListener('click',()=>setZoom(1));$('close').addEventListener('click',()=>$('dialog').close());render();setView(false);




