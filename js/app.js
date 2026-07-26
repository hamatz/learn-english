let currentCategory='beauty',lessonIndex=0,itemIndex=0,attempts=0,corrects=0,dailyDay=1,activeSetIndex=0;
let wrong=JSON.parse(localStorage.getItem('interest_english_wrong_v2')||'[]');
let done=JSON.parse(localStorage.getItem('interest_english_done_v2')||'[]');
let learned=new Set(JSON.parse(localStorage.getItem('interest_english_words_v2')||'[]'));
const $=id=>document.getElementById(id);function norm(s){return s.toLowerCase().replace(/[.,!?’']/g,'').replace(/\s+/g,' ').trim()}
function makeGeneratedItems(pack){let items=[{stage:'WATCH',kind:'watch',title:'動画で探す',prompt:'今日の語句と関係する場面や内容を動画の中で探してみよう。',scene:0}];pack.words.forEach((w,i)=>{items.push({stage:'WORDS',kind:'choice',title:'意味を確認',prompt:`「${w.term}」に最も近い意味は？`,choices:shuffle([w.meaning,'まったく関係のない意味','反対に近い意味']),answer:0,explain:`${w.sentence}<br>${w.jp}`});items.push({stage:'LISTEN',kind:'listen',title:'短く聞く',prompt:'音声を聞き、空欄に入る語句を選ぼう。',masked:w.sentence.replace(new RegExp(w.term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),'_____'),sentence:w.sentence,scene:0,choices:shuffle([w.term,'because of','at first']),answer:null,_correct:w.term});items.push({stage:'EXAM',kind:'blank',title:'構文穴埋め',prompt:w.sentence.replace(new RegExp(w.term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),'_____'),answer:w.term,jp:w.jp});let toks=w.sentence.match(/[^ ]+[.,!?]?/g)||[];items.push({stage:'USE',kind:'build',title:'英文組み立て',prompt:w.jp,tokens:[...toks,(i%2?'because':'very')],answer:w.sentence,explain:`今日の型：<b>${w.term}</b>`})});items.push({stage:'REVIEW',kind:'reflect',title:'今日のまとめ',prompt:'今日覚えた表現を一つ選んで、例文を声に出して読もう。',examples:pack.words.slice(0,3).map(w=>w.sentence),tip:'自由な英作文は採点しません。まずは正しい例文を何度も口に出せれば十分です。'});return items}
function getPacks(l){let examples=basePhraseExamples[l.id]||[];let base={name:'基本セット',words:l.words.map((w,i)=>({term:w.term,meaning:w.meaning,sentence:w.example||examples[i]?.[0]||'',jp:examples[i]?.[1]||''})),items:l.items};let extra=(supplementalBanks[l.id]||[]).map((rows,i)=>{let words=rows.map(r=>({term:r[0],meaning:r[1],sentence:r[2],jp:r[3],type:'exam'}));let p={name:`追加セット ${i+2}`,words};p.items=makeGeneratedItems(p);return p});return [base,...extra]}
function currentPack(){return getPacks(lessons[lessonIndex])[activeSetIndex]||getPacks(lessons[lessonIndex])[0]}
function currentItems(){return currentPack().items}
function setActivePack(i){activeSetIndex=i;itemIndex=0;localStorage.setItem('interest_english_pack_'+lessons[lessonIndex].id,String(i));renderWords();renderDailyPlan(1);renderTraining()}
function renderSetTabs(){let packs=getPacks(lessons[lessonIndex]);$('set-tabs').innerHTML=packs.map((p,i)=>`<button class="set-tab ${i===activeSetIndex?'on':''}" onclick="setActivePack(${i})">SET ${i+1}</button>`).join('');$('bank-note').textContent=`この動画には現在 ${packs.length}セット・約${packs.length*5}語句あります。学習バンクには後から何セットでも追加できます。`}
function fixGeneratedChoice(x){if(x&&x._correct){x.answer=x.choices.indexOf(x._correct)}}
function init(){renderCategories();selectCategory('beauty');$('prev-btn').onclick=prev;$('next-btn').onclick=next;$('review-btn').onclick=startReview;$('daily-start').onclick=startDailyMenu;updateStats()}
function renderCategories(){let c=$('course-grid');c.innerHTML='';Object.entries(categoryInfo).forEach(([key,x])=>{let count=lessons.filter(l=>l.category===key).length,b=document.createElement('button');b.className='course '+(key===currentCategory?'active':'');b.innerHTML=`<div class="course-icon">${x.icon}</div><h3>${x.course}</h3><p>${x.description}</p><small>${count}本の動画 →</small>`;b.onclick=()=>selectCategory(key);c.appendChild(b)})}
function selectCategory(key){currentCategory=key;renderCategories();renderVideoStrip();let idx=lessons.findIndex(l=>l.category===key);loadLesson(idx)}
function lessonProgress(l){let packs=getPacks(l),total=packs.reduce((a,p)=>a+p.items.filter(x=>x.kind!=='watch'&&x.kind!=='reflect').length,0),n=done.filter(k=>k.startsWith(l.id+'|')).length;return total?Math.round(n/total*100):0}
function renderVideoStrip(){let list=lessons.filter(l=>l.category===currentCategory);$('video-list-title').textContent=categoryInfo[currentCategory].label+'の動画';$('video-strip').innerHTML=list.map(l=>`<button class="video-card ${lessons[lessonIndex]?.id===l.id?'active':''}" onclick="loadLesson(${lessons.indexOf(l)})"><b>${l.title}</b><span>${l.sub}・${l.level}</span><div class="mini-progress"><i style="width:${lessonProgress(l)}%"></i></div></button>`).join('')}
function loadLesson(i){lessonIndex=i;currentCategory=lessons[i].category;itemIndex=0;let l=lessons[i];activeSetIndex=Math.min(Number(localStorage.getItem('interest_english_pack_'+l.id)||0),getPacks(l).length-1);$('lesson-title').textContent=l.title;$('lesson-sub').textContent=l.sub;$('lesson-level').textContent=l.level;$('video').innerHTML=`<iframe id="yt" src="https://www.youtube.com/embed/${l.youtubeId}?rel=0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;renderCategories();renderVideoStrip();renderWords();renderDailyPlan();renderTraining();currentPack().words.forEach(w=>learned.add(l.id+':'+w.term));localStorage.setItem('interest_english_words_v2',JSON.stringify([...learned]));updateStats()}
function currentNaturalDay(l){let key='interest_english_started_'+l.id,started=localStorage.getItem(key);if(!started){started=new Date().toISOString().slice(0,10);localStorage.setItem(key,started)}let a=new Date(started+'T00:00:00'),b=new Date();return Math.max(1,Math.min(5,Math.floor((b-a)/86400000)+1))}
function dayPlan(day){return [
 {title:'意味と音に出会う',desc:'今日の5語句を確認し、動画を楽しみながら声に出します。',stages:['WATCH','WORDS']},
 {title:'短く聞き取る',desc:'昨日の5語句を思い出してから、短い英文を繰り返し聞きます。',stages:['WORDS','LISTEN']},
 {title:'文の形をつかむ',desc:'同じ語句を穴埋めと語順整序で使い、構文として覚えます。',stages:['EXAM']},
 {title:'自分で組み立てる',desc:'余分な語をよけながら英文を作り、意味と語順を結びつけます。',stages:['USE']},
 {title:'動画まるごと復習',desc:'見る・聞く・組み立てるを混ぜ、5語句を使える状態にします。',stages:['WATCH','LISTEN','EXAM','USE','REVIEW']}
 ][day-1]}
function reviewWords(){let packs=getPacks(lessons[lessonIndex]),pool=[];for(let i=0;i<activeSetIndex;i++)pool.push(...packs[i].words);return shuffle(pool).slice(0,2)}
let chorusOrder=[],chorusPlaying=false;
function chorusConfig(){
 const configs={
  1:{count:5,repeat:2,rate:.72,label:'基本5文を2回',note:'DAY 1は今日の5語句すべてを、意味を見ながらゆっくり2回聞きます。'},
  2:{count:3,repeat:3,rate:.80,label:'耳で3回',note:'意味を思い出しながら、DAY 1とは違う順番で3回聞きます。'},
  3:{count:3,repeat:2,rate:.86,label:'構文で2回',note:'文の型に注目し、区切りを意識して声に出します。'},
  4:{count:4,repeat:2,rate:.92,label:'組み立て2回',note:'日本語を見ず、英文を先に口に出してから再生します。'},
  5:{count:5,repeat:1,rate:.90,label:'全5文通し',note:'5文を順番を崩して通しで聞き、言える文を増やします。'}
 };return configs[dailyDay]||configs[1]
}
function chorusWords(){
 let words=currentPack().words.filter(w=>w.sentence),cfg=chorusConfig();
 if(!chorusOrder.length||chorusOrder.some(i=>i>=words.length)){
  let base=words.map((_,i)=>i);
  if(dailyDay===2)base=[...base.slice(2),...base.slice(0,2)];
  else if(dailyDay>=4)base=shuffle(base);
  chorusOrder=base.slice(0,Math.min(cfg.count,base.length));
 }
 return chorusOrder.slice(0,cfg.count).map(i=>words[i]).filter(Boolean)
}
function playSentenceAt(i){let row=chorusWords()[i];if(row)speak(row.sentence)}
function renderChorus(){
 let rows=chorusWords(),cfg=chorusConfig();
 $('chorus-tag').textContent=cfg.label;$('chorus-note').textContent=cfg.note;
 $('chorus-play').textContent=`▶ ${rows.length}文を${cfg.repeat}回`;
 $('chorus-status').textContent='';
 $('chorus-list').innerHTML=rows.map((w,i)=>`<button class="chorus-line" onclick="playSentenceAt(${i})"><b>${i+1}. ${w.sentence}</b><span>${dailyDay===4?'先に英文を言ってからタップ':w.meaning}</span></button>`).join('')||'<div class="reflection">このセットには音読用例文を準備中です。</div>'
}
function shuffleChorus(){
 stopChorus();let words=currentPack().words.filter(w=>w.sentence),cfg=chorusConfig();
 chorusOrder=shuffle(words.map((_,i)=>i)).slice(0,Math.min(cfg.count,words.length));renderChorus()
}
function stopChorus(){chorusPlaying=false;if('speechSynthesis'in window)window.speechSynthesis.cancel();if($('chorus-status'))$('chorus-status').textContent='停止しました。'}
function playChorus(){
 let rows=chorusWords(),cfg=chorusConfig();if(!rows.length||!('speechSynthesis'in window))return;
 stopChorus();chorusPlaying=true;let queue=[];for(let r=0;r<cfg.repeat;r++)rows.forEach((w,j)=>queue.push({text:w.sentence,round:r+1,line:j+1}));let i=0;
 function nextLine(){if(!chorusPlaying)return;if(i>=queue.length){chorusPlaying=false;$('chorus-status').textContent='✓ サビ練習が終わりました。最後に1文だけ自分で言ってみよう。';return}let q=queue[i++];$('chorus-status').textContent=`再生中：${q.round}/${cfg.repeat}回目・${q.line}/${rows.length}文`;let u=new SpeechSynthesisUtterance(q.text);u.lang='en-US';u.rate=cfg.rate;u.onend=()=>setTimeout(nextLine,dailyDay===1?500:280);u.onerror=()=>{chorusPlaying=false;$('chorus-status').textContent='音声を再生できませんでした。端末の音声設定をご確認ください。'};window.speechSynthesis.speak(u)}nextLine()
}
function maskTerm(sentence,term){try{return sentence.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),'_____')}catch(e){return sentence}}
function dailyTargetRows(day){
 let words=currentPack().words,reviews=reviewWords(),rows=[];
 if(day===1){rows=words.map((w,i)=>`<div class="daily-target"><i>${i+1}</i><div><b>${w.term}</b><br>${w.meaning}<span class="target-en">${w.sentence}</span></div></div>`)}
 if(day===2){rows=words.map((w,i)=>`<div class="daily-target masked"><i>🔊</i><div><b>${maskTerm(w.sentence,w.term)}</b><span class="target-hint">音を聞く前に、空欄の語句を思い出そう</span></div></div>`)}
 if(day===3){rows=words.map((w,i)=>`<div class="daily-target"><i>型</i><div><b>${w.term}</b><span class="target-en">${w.sentence}</span><span class="target-hint">語句だけでなく、前後を含む文の形で覚える</span></div></div>`)}
 if(day===4){rows=words.map((w,i)=>`<div class="daily-target"><i>→</i><div><b>${w.jp||w.meaning}</b><span class="target-hint">英文を見ずに、使う語句と語順を考える</span></div></div>`)}
 if(day===5){let mixed=shuffle(words.map(w=>({...w,review:false})).concat(reviews.map(w=>({...w,review:true}))));rows=mixed.map((w,i)=>`<div class="daily-target"><i>${w.review?'↺':'✓'}</i><div><b>${i%2?w.term:w.meaning}</b><span class="target-hint">${i%2?'意味と例文を言えるか確認':'英語表現を思い出せるか確認'}${w.review?'・前セットから再登場':''}</span></div></div>`)}
 if(day!==5&&reviews.length)rows.push(...reviews.map(w=>`<div class="daily-target"><i>↺</i><div><b>${w.term}</b><br>${w.meaning}<span class="review-label">前のセットから再登場</span></div></div>`));
 return rows
}
function renderDailyPlan(day){let l=lessons[lessonIndex];dailyDay=day||currentNaturalDay(l);chorusOrder=[];stopChorus();let p=dayPlan(dailyDay);$('daily-day').textContent='DAY '+dailyDay;$('daily-title').textContent=`SET ${activeSetIndex+1}・${p.title}`;$('daily-desc').textContent=p.desc;renderSetTabs();$('day-tabs').innerHTML=[1,2,3,4,5].map(d=>`<button class="day-tab ${d===dailyDay?'on':''}" onclick="renderDailyPlan(${d})">DAY ${d}</button>`).join('');$('daily-targets').innerHTML=dailyTargetRows(dailyDay).join('');$('daily-start').textContent=dailyDay===5?'5日目の総復習を始める':`DAY ${dailyDay} の学習を始める`;renderChorus()}
function dailyIndices(){let p=dayPlan(dailyDay),items=currentItems(),idx=[];p.stages.forEach(stage=>items.forEach((x,i)=>{if(x.stage===stage&&!idx.includes(i))idx.push(i)}));return idx.length?idx:[0]}
function startDailyMenu(){let idx=dailyIndices();itemIndex=idx[0];renderTraining();$('training-body').scrollIntoView({behavior:'smooth',block:'start'});sessionStorage.setItem('daily_indices',JSON.stringify(idx));sessionStorage.setItem('daily_pos','0')}
function renderWords(){let pack=currentPack();$('word-list').innerHTML=pack.words.map(w=>`<div class="word"><div class="word-top"><b>${w.term}</b><span class="importance exam">★ 入試重要</span></div><div>${w.meaning}</div>${w.sentence?`<div class="word-example">${w.sentence}</div>`:''}</div>`).join('')}
function renderFlow(){let items=currentItems();$('flow').innerHTML=items.map((x,i)=>`<span class="step ${i===itemIndex?'on':''}">${x.stage}</span>`).join('')}
function renderTraining(){renderFlow();selected=[];let x=currentItems()[itemIndex],b=$('training-body');fixGeneratedChoice(x);let h=`<div class="stage-label">${x.stage}</div><div class="question">${x.prompt}</div>`;
if(x.kind==='watch')h+=`<div class="scene-text">全部聞き取ろうとせず、映像と話の大筋を楽しみましょう。</div><button class="action" onclick="seek(${x.scene})">▶ ${x.scene}秒付近から見る</button>`;
if(x.kind==='listen')h+=`<div class="scene-text"><strong>${x.masked}</strong></div><div class="listen-tools"><button onclick="speak('${x.sentence.replace(/'/g,"\\'")}')">🔊 例文を聞く</button><button onclick="seek(${x.scene})">▶ 動画の場面を見る</button></div><div class="choices">${x.choices.map((c,i)=>`<button class="choice" onclick="checkChoice(this,${i})">${c}</button>`).join('')}</div><div class="feedback" id="fb"></div>`;
if(x.kind==='choice')h+=`<div class="choices">${x.choices.map((c,i)=>`<button class="choice" onclick="checkChoice(this,${i})">${c}</button>`).join('')}</div><div class="feedback" id="fb"></div><div class="explain hidden" id="exp">${x.explain}</div>`;
if(x.kind==='blank')h+=`<div class="scene-text">${x.prompt}</div><div class="answer-input"><input id="answer" autocomplete="off" placeholder="英単語を入力"><button class="primary" onclick="checkText()">判定</button></div><div class="feedback" id="fb"></div><div class="explain">${x.jp}</div>`;
if(x.kind==='order'||x.kind==='build')h+=`<div class="choices" id="tokens">${shuffle([...x.tokens]).map((t,i)=>`<button class="choice" data-token-id="${i}" onclick="pickToken(this)">${t}</button>`).join('')}</div><div class="build-tray empty" id="built"></div><div class="answer-input"><button class="secondary" onclick="resetOrder()">やり直す</button><button class="primary" onclick="checkOrder()">判定</button></div><div class="feedback" id="fb"></div>${x.explain?`<div class="explain hidden" id="exp">${x.explain}</div>`:''}`;
if(x.kind==='reflect')h+=`<div class="choices">${x.examples.map(c=>`<button class="choice" onclick="chooseReflection(this)">${c}</button>`).join('')}</div><div class="reflection">${x.tip}</div><div class="feedback" id="fb"></div>`;
b.innerHTML=`<span class="tag">${x.title}</span>${h}`;$('prev-btn').disabled=itemIndex===0;$('next-btn').textContent=itemIndex===currentItems().length-1?'この動画を完了':'次へ'}
function seek(s){let l=lessons[lessonIndex],f=$('yt');f.src=`https://www.youtube.com/embed/${l.youtubeId}?start=${s}&autoplay=1&rel=0`}
function speak(text){if(!('speechSynthesis'in window))return;window.speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.86;window.speechSynthesis.speak(u)}
function record(ok){attempts++;if(ok)corrects++;let key=lessons[lessonIndex].id+'|'+activeSetIndex+'|'+itemIndex;if(ok){if(!done.includes(key))done.push(key);wrong=wrong.filter(k=>k!==key)}else if(!wrong.includes(key))wrong.push(key);localStorage.setItem('interest_english_done_v2',JSON.stringify(done));localStorage.setItem('interest_english_wrong_v2',JSON.stringify(wrong));renderVideoStrip();updateStats()}
function checkChoice(el,i){let x=currentItems()[itemIndex];fixGeneratedChoice(x);document.querySelectorAll('#training-body .choice').forEach(e=>e.disabled=true);let ok=i===x.answer;el.classList.add(ok?'correct':'wrong');if(!ok)document.querySelectorAll('#training-body .choice')[x.answer].classList.add('correct');showFeedback(ok);if($('exp'))$('exp').classList.remove('hidden');record(ok)}
function checkText(){let x=currentItems()[itemIndex],v=norm($('answer').value),ok=(x.accept||[x.answer]).map(norm).includes(v);showFeedback(ok,ok?'正解です！':'もう一度考えてみましょう。');record(ok)}
let selected=[];function pickToken(el){selected.push({text:el.textContent,el});el.disabled=true;el.classList.add('used');renderBuilt()}function renderBuilt(){let tray=$('built');if(!tray)return;tray.classList.toggle('empty',selected.length===0);tray.innerHTML=selected.map((x,i)=>`<button class="built-token" onclick="removeToken(${i})">${x.text}</button>`).join('')}function removeToken(i){let[x]=selected.splice(i,1);if(x&&x.el){x.el.disabled=false;x.el.classList.remove('used')}renderBuilt()}function resetOrder(){selected=[];renderTraining()}function checkOrder(){let x=currentItems()[itemIndex],built=selected.map(v=>v.text).join(' '),ok=norm(built)===norm(x.answer);showFeedback(ok,ok?'正しい英文です！':'使わない語が混ざっていないか、語順を見直してみましょう。');if($('exp'))$('exp').classList.remove('hidden');record(ok)}
function chooseReflection(el){document.querySelectorAll('#training-body .choice').forEach(e=>e.classList.remove('correct'));el.classList.add('correct');let f=$('fb');f.className='feedback good';f.textContent='いいですね。声に出して1回読んでみましょう。'}
function showFeedback(ok,msg){let f=$('fb');f.className='feedback '+(ok?'good':'bad');f.textContent=msg||(ok?'正解です！':'惜しいです。正解と比べてみましょう。')}
function next(){let seq=JSON.parse(sessionStorage.getItem('daily_indices')||'null');if(seq&&seq.includes(itemIndex)){let p=seq.indexOf(itemIndex);if(p<seq.length-1){itemIndex=seq[p+1];renderTraining();return}sessionStorage.removeItem('daily_indices');alert(`DAY ${dailyDay} のメニューは完了です。今日はこの5語句を声に出して終わりにしましょう！`);return}let n=currentItems().length;if(itemIndex<n-1){itemIndex++;renderTraining()}else{alert('この動画のレッスンは完了です。同じカテゴリの次の動画にも挑戦してみましょう！')}}function prev(){let seq=JSON.parse(sessionStorage.getItem('daily_indices')||'null');if(seq&&seq.includes(itemIndex)){let p=seq.indexOf(itemIndex);if(p>0){itemIndex=seq[p-1];renderTraining()}return}if(itemIndex>0){itemIndex--;renderTraining()}}
function startReview(){if(!wrong.length){$('review-message').textContent='現在、復習待ちの苦手問題はありません。';return}let key=wrong[0],parts=key.split('|');if(parts.length===3){let li=lessons.findIndex(l=>l.id===parts[0]);loadLesson(li);setActivePack(Number(parts[1]));itemIndex=Number(parts[2]);renderTraining()}else{$('review-message').textContent='旧版の復習記録があります。新しいセットで学習すると更新されます。';return}$('review-message').textContent=`苦手問題が ${wrong.length} 問あります。まず1問目を表示しました。`}
function updateStats(){$('learned-count').textContent=done.length;$('exam-count').textContent=learned.size;$('rate-count').textContent=attempts?Math.round(corrects/attempts*100)+'%':'0%';let total=lessons.reduce((a,l)=>a+getPacks(l).reduce((b,p)=>b+p.items.filter(x=>x.kind!=='watch'&&x.kind!=='reflect').length,0),0);$('all-progress').style.width=Math.min(100,done.length/total*100)+'%';$('review-message').textContent=wrong.length?`苦手問題が ${wrong.length} 問あります。最後にもう一度挑戦しましょう。`:'間違えた問題はここにたまります。最後にもう一度挑戦しましょう。'}
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function auditLearningBanks(){
 const issues=[];
 lessons.forEach(l=>getPacks(l).forEach((p,pi)=>p.words.forEach((w,wi)=>{
  if(!w.term||!w.meaning||!w.sentence)issues.push(`${l.id} / SET ${pi+1} / ${wi+1}`);
 })));
 if(issues.length)console.warn('例文未設定の学習語句:',issues);
 else console.info('Learning bank audit: all words have phrase examples.');
}
window.onload=()=>{auditLearningBanks();init()};
