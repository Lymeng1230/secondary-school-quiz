const KEY="khmerQuizStateV1";
const grades=["ថ្នាក់ទី ៦","ថ្នាក់ទី ៧","ថ្នាក់ទី ៨","ថ្នាក់ទី ៩","ថ្នាក់ទី ១០","ថ្នាក់ទី ១១","ថ្នាក់ទី ១២"];
const subjects=["📖 ភាសាខ្មែរ","🇬🇧 ភាសាអង់គ្លេស","➗ គណិតវិទ្យា","⚛️ រូបវិទ្យា","🧪 គីមីវិទ្យា","🧬 ជីវវិទ្យា","🌍 ភូមិវិទ្យា","🏛️ ប្រវត្តិវិទ្យា","💻 វិទ្យាសាស្ត្រកុំព្យូទ័រ","🔬 វិទ្យាសាស្ត្រ","🌐 សិក្សាសង្គម"];
const letters=["A","B","C","D"];
let state={grade:0,subject:2,timer:30,speedBonus:"on",revealCorrect:"on",shuffleQuestions:"off",shuffleAnswers:"off",sound:true,theme:"light",questions:[]};
let game={questions:[],index:0,score:0,correct:0,wrong:0,answered:false,remaining:30,timerId:null};

const $=id=>document.getElementById(id);
const backgroundMusic = $("backgroundMusic");
let musicStarted = false;


const QUIZ_LIBRARY_KEY = "khmerQuizLibraryV2";

function loadQuizLibrary(){
  try{
    const raw=localStorage.getItem(QUIZ_LIBRARY_KEY);
    const data=raw?JSON.parse(raw):[];
    return Array.isArray(data)?data:[];
  }catch(e){return []}
}
function saveQuizLibrary(list){
  localStorage.setItem(QUIZ_LIBRARY_KEY, JSON.stringify(list));
}
function quizTitle(){
  const selectedGrade=$("gradeSelect")?.value || state.grade || "6";
  const selectedSubject=$("subjectSelect")?.value || state.subject || "Quiz";
  return `Quiz ថ្នាក់ទី ${selectedGrade} — ${selectedSubject}`;
}
function saveCurrentQuiz(){
  const list=loadQuizLibrary();
  const defaultName=quizTitle();
  const name=window.prompt("ដាក់ឈ្មោះ Quiz:", defaultName);
  if(name===null)return;
  const clean=name.trim()||defaultName;
  const item={
    id:"quiz_"+Date.now()+"_"+Math.random().toString(36).slice(2,7),
    name:clean,
    grade:String(state.grade),
    subject:state.subject,
    timer:state.timer,
    speedBonus:state.speedBonus,
    revealCorrect:state.revealCorrect,
    shuffleQuestions:state.shuffleQuestions,
    shuffleAnswers:state.shuffleAnswers,
    questions:JSON.parse(JSON.stringify(state.questions||[])),
    updatedAt:new Date().toISOString()
  };
  list.unshift(item);
  saveQuizLibrary(list.slice(0,100));
  renderSavedQuizzes();
  toast("បានរក្សាទុក Quiz រួចរាល់");
}
function playSavedQuiz(id){
  const item=loadQuizLibrary().find(x=>x.id===id);
  if(!item)return;
  state.grade=item.grade; state.subject=item.subject; state.timer=item.timer;
  state.speedBonus=item.speedBonus; state.revealCorrect=item.revealCorrect;
  state.shuffleQuestions=item.shuffleQuestions; state.shuffleAnswers=item.shuffleAnswers;
  state.questions=JSON.parse(JSON.stringify(item.questions||[]));
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  startQuiz();
}
function editSavedQuiz(id){
  const item=loadQuizLibrary().find(x=>x.id===id);
  if(!item)return;
  state.grade=item.grade; state.subject=item.subject; state.timer=item.timer;
  state.speedBonus=item.speedBonus; state.revealCorrect=item.revealCorrect;
  state.shuffleQuestions=item.shuffleQuestions; state.shuffleAnswers=item.shuffleAnswers;
  state.questions=JSON.parse(JSON.stringify(item.questions||[]));
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  renderTeacher();
  toast("បានបើក Quiz សម្រាប់កែ");
}
function deleteSavedQuiz(id){
  const item=loadQuizLibrary().find(x=>x.id===id);
  if(!item)return;
  if(!confirm(`លុប Quiz "${item.name}" មែនទេ?`))return;
  saveQuizLibrary(loadQuizLibrary().filter(x=>x.id!==id));
  renderSavedQuizzes();
}
function duplicateSavedQuiz(id){
  const item=loadQuizLibrary().find(x=>x.id===id);
  if(!item)return;
  const copy=JSON.parse(JSON.stringify(item));
  copy.id="quiz_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);
  copy.name=item.name+" — ច្បាប់ចម្លង";
  copy.updatedAt=new Date().toISOString();
  const list=loadQuizLibrary();
  list.unshift(copy);
  saveQuizLibrary(list.slice(0,100));
  renderSavedQuizzes();
}
function renderSavedQuizzes(){
  const el=$("savedQuizzesList");
  if(!el)return;
  const list=loadQuizLibrary();
  if(!list.length){
    el.innerHTML='<div class="empty-saved">មិនទាន់មាន Quiz ដែលបានរក្សាទុកទេ</div>';
    return;
  }
  el.innerHTML=list.map(q=>{
    const count=(q.questions||[]).length;
    const date=q.updatedAt?new Date(q.updatedAt).toLocaleDateString("km-KH"):"";
    return `<article class="saved-quiz-item">
      <div class="saved-quiz-name">${esc(q.name)}</div>
      <div class="saved-quiz-meta">ថ្នាក់ទី ${esc(q.grade)} · ${esc(q.subject)} · ${count} សំណួរ${date?` · ${date}`:""}</div>
      <div class="saved-quiz-actions">
        <button class="btn small primary" data-play="${esc(q.id)}">លេង</button>
        <button class="btn small" data-edit="${esc(q.id)}">កែ</button>
        <button class="btn small" data-copy="${esc(q.id)}">ចម្លង</button>
        <button class="btn small danger" data-delete="${esc(q.id)}">លុប</button>
      </div>
    </article>`;
  }).join("");
}
function exportQuizLibrary(){
  const data=JSON.stringify({version:2,exportedAt:new Date().toISOString(),quizzes:loadQuizLibrary()},null,2);
  const blob=new Blob([data],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download="khmer-quiz-library.json"; a.click(); URL.revokeObjectURL(a.href);
}
function importQuizLibrary(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(reader.result);
      const incoming=Array.isArray(parsed)?parsed:parsed.quizzes;
      if(!Array.isArray(incoming))throw new Error("invalid");
      const clean=incoming.filter(q=>q&&Array.isArray(q.questions)).map(q=>({
        id:q.id||("quiz_"+Date.now()+"_"+Math.random().toString(36).slice(2,7)),
        name:String(q.name||"Quiz មិនទាន់ដាក់ឈ្មោះ"),
        grade:String(q.grade||6),subject:String(q.subject||""),
        timer:Number(q.timer||20),speedBonus:q.speedBonus==="on"?"on":"off",
        revealCorrect:q.revealCorrect==="on"?"on":"off",
        shuffleQuestions:q.shuffleQuestions==="on"?"on":"off",
        shuffleAnswers:q.shuffleAnswers==="on"?"on":"off",
        questions:q.questions,updatedAt:q.updatedAt||new Date().toISOString()
      }));
      saveQuizLibrary(clean.concat(loadQuizLibrary()).slice(0,100));
      renderSavedQuizzes(); toast(`បាននាំចូល ${clean.length} Quiz`);
    }catch(e){alert("File Quiz មិនត្រឹមត្រូវ ឬខូច។")}
  };
  reader.readAsText(file);
}

function soundEnabled(){
  return state.sound === true || state.sound === "on";
}

function syncBackgroundMusic(){
  if(!backgroundMusic) return;
  backgroundMusic.volume = 0.16;
  if(soundEnabled()){
    const p = backgroundMusic.play();
    if(p && typeof p.then === "function"){
      p.then(()=>{ musicStarted = true; }).catch(()=>{ musicStarted = false; });
    }else{
      musicStarted = true;
    }
  }else{
    backgroundMusic.pause();
    musicStarted = false;
  }
}

function startBackgroundMusic(){
  if(!backgroundMusic || !soundEnabled()) return;
  backgroundMusic.volume = 0.16;
  backgroundMusic.loop = true;
  const p = backgroundMusic.play();
  if(p && typeof p.then === "function"){
    p.then(()=>{ musicStarted = true; }).catch(()=>{ musicStarted = false; });
  }else{
    musicStarted = true;
  }
}

document.addEventListener("pointerdown", ()=>{
  if(soundEnabled() && backgroundMusic && !musicStarted){
    startBackgroundMusic();
  }
}, {once:false});

const esc=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
function save(){localStorage.setItem(KEY,JSON.stringify(state));$("saveStatus").textContent="💾 Quiz បានរក្សាទុក";setTimeout(()=>$("saveStatus").textContent="💾 រក្សាទុកដោយស្វ័យប្រវត្តិ",900)}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s) state={...state,...s}}catch(e){}}
function toast(t){const x=$("toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1800)}
function fillSelects(){ $("gradeSelect").innerHTML=grades.map((g,i)=>`<option value="${i}">${g}</option>`).join("");$("subjectSelect").innerHTML=subjects.map((s,i)=>`<option value="${i}">${s}</option>`).join("");syncControls()}
function syncControls(){$("gradeSelect").value=state.grade;$("subjectSelect").value=state.subject;$("timerSelect").value=state.timer;$("speedBonus").value=state.speedBonus;$("revealCorrect").value=state.revealCorrect;$("shuffleQuestions").value=state.shuffleQuestions;$("shuffleAnswers").value=state.shuffleAnswers}
function bindControls(){const map={gradeSelect:"grade",subjectSelect:"subject",timerSelect:"timer",speedBonus:"speedBonus",revealCorrect:"revealCorrect",shuffleQuestions:"shuffleQuestions",shuffleAnswers:"shuffleAnswers"};Object.entries(map).forEach(([id,key])=>$(id).addEventListener("change",()=>{state[key]=["grade","subject","timer"].includes(key)?Number($(id).value):$(id).value;save()}))}
function addQuestion(q={text:"",answers:["","","",""],correct:0,image:"",difficulty:"easy"}){state.questions.push(q);renderEditors();save()}
function renderEditors(){const list=$("questionEditorList");$("questionCount").textContent=state.questions.length;list.innerHTML="";$("emptyEditor").classList.toggle("hidden",state.questions.length>0);
state.questions.forEach((q,idx)=>{const card=document.createElement("div");card.className="editor-card";card.innerHTML=`<div class="editor-head"><span class="q-number">សំណួរ ${idx+1}</span><div class="editor-actions"><button class="small-btn" data-act="up">↑</button><button class="small-btn" data-act="down">↓</button><button class="small-btn" data-act="dup">📋</button><button class="small-btn" data-act="del">🗑️</button></div></div><textarea class="question-input" placeholder="វាយសំណួររបស់អ្នក...">${esc(q.text)}</textarea><div class="answer-grid">${q.answers.map((a,i)=>`<div class="answer-row"><span class="answer-label">${letters[i]}</span><input data-a="${i}" value="${esc(a)}" placeholder="ចម្លើយ ${letters[i]}"><input class="correct-radio" type="radio" name="correct-${idx}" data-c="${i}" ${q.correct===i?"checked":""} aria-label="ចម្លើយត្រឹមត្រូវ"></div>`).join("")}</div><div class="editor-bottom"><input class="image-url" value="${esc(q.image||"")}" placeholder="🖼️ បញ្ចូល URL រូបភាព (ជាជម្រើស)"><select class="difficulty-select"><option value="easy" ${q.difficulty==="easy"?"selected":""}>🟢 ងាយ</option><option value="medium" ${q.difficulty==="medium"?"selected":""}>🟡 មធ្យម</option><option value="hard" ${q.difficulty==="hard"?"selected":""}>🔴 ពិបាក</option></select></div>`;list.appendChild(card);
card.querySelector(".question-input").addEventListener("input",e=>{q.text=e.target.value;save()});card.querySelectorAll("[data-a]").forEach(x=>x.addEventListener("input",e=>{q.answers[+x.dataset.a]=e.target.value;save()}));card.querySelectorAll("[data-c]").forEach(x=>x.addEventListener("change",()=>{q.correct=+x.dataset.c;save()}));card.querySelector(".image-url").addEventListener("input",e=>{q.image=e.target.value;save()});card.querySelector(".difficulty-select").addEventListener("change",e=>{q.difficulty=e.target.value;save()});card.querySelectorAll("[data-act]").forEach(b=>b.addEventListener("click",()=>editorAction(idx,b.dataset.act)));});}
function editorAction(i,act){if(act==="del"){if(confirm("តើអ្នកចង់លុបសំណួរនេះមែនទេ?"))state.questions.splice(i,1)}else if(act==="dup"){state.questions.splice(i+1,0,JSON.parse(JSON.stringify(state.questions[i])))}else if(act==="up"&&i>0){[state.questions[i-1],state.questions[i]]=[state.questions[i],state.questions[i-1]]}else if(act==="down"&&i<state.questions.length-1){[state.questions[i+1],state.questions[i]]=[state.questions[i],state.questions[i+1]]}renderEditors();save()}
function demoQuestions(){const bank=[
["📖 ភាសាខ្មែរ",[["តើពាក្យ «សាមគ្គី» មានន័យដូចម្តេច?",["ការរួបរួម","ការប្រកួត","ការបែកបាក់","ការបដិសេធ"],0],["តើអត្ថបទពិពណ៌នាមានគោលបំណងសំខាន់អ្វី?",["ពិពណ៌នាអំពីអ្វីមួយ","គណនាលេខ","បង្ហាញរូបមន្ត","សរសេរកូដ"],0],["តើ «សុចរិត» សំដៅលើអ្វី?",["ភាពត្រង់ត្រូវ","ភាពខ្ជិល","ភាពភ័យខ្លាច","ភាពរញ៉េរញ៉ៃ"],0],["តើវណ្ណយុត្តិប្រើសម្រាប់អ្វី?",["បែងចែកន័យក្នុងប្រយោគ","វាស់ចម្ងាយ","គណនាផ្ទៃក្រឡា","បង្កើតរូបភាព"],0],["តើការអានជួយអ្វីដល់សិស្ស?",["បង្កើនចំណេះដឹង","កាត់បន្ថយការយល់ដឹង","បញ្ឈប់ការរៀន","គ្មានប្រយោជន៍"],0]]],
["🇬🇧 ភាសាអង់គ្លេស",[["Choose the correct form: She ___ to school every day.",["go","goes","going","gone"],1],["What is the opposite of “ancient”?",["modern","old","early","historic"],0],["Which word is a noun?",["quickly","beautiful","teacher","write"],2],["Choose the correct past tense: They ___ football yesterday.",["play","plays","played","playing"],2],["What does “environment” mean?",["the natural world around us","a school subject only","a type of food","a computer program"],0]]],
["➗ គណិតវិទ្យា",[["តើ 25 × 4 ស្មើប៉ុន្មាន?",["80","90","100","120"],2],["តើ 2x + 5 = 15 មានតម្លៃ x ប៉ុន្មាន?",["5","10","15","20"],0],["តើផ្ទៃក្រឡាចតុកោណប្រវែង 8m និងទទឹង 5m ស្មើប៉ុន្មាន?",["13 m²","26 m²","40 m²","80 m²"],2],["តើ √144 ស្មើប៉ុន្មាន?",["10","11","12","14"],2],["បើ 3/4 នៃលេខមួយស្មើ 24 តើលេខនោះស្មើប៉ុន្មាន?",["18","24","32","36"],2]]],
["⚛️ រូបវិទ្យា",[["ឯកតា SI របស់កម្លាំងគឺអ្វី?",["Joule","Newton","Watt","Pascal"],1],["តើល្បឿនគណនាដោយរូបមន្តណា?",["ចម្ងាយ/ពេលវេលា","ពេលវេលា/ចម្ងាយ","ម៉ាស×មាឌ","កម្លាំង×ចម្ងាយ"],0],["តើថាមពលអគ្គិសនីត្រូវបានវាស់ជាឯកតាអ្វី?",["Watt","Meter","Kilogram","Kelvin"],0],["តើវត្ថុធ្លាក់ចុះដោយសារកម្លាំងអ្វី?",["ទំនាញ","កកិត","ម៉ាញេទិច","អណ្តែត"],0],["តើពន្លឺធ្វើដំណើរលឿនបំផុតនៅក្នុងអ្វី?",["សុញ្ញាកាស","ទឹក","កញ្ចក់","ខ្យល់តែប៉ុណ្ណោះ"],0]]],
["🧪 គីមីវិទ្យា",[["និមិត្តសញ្ញាគីមីរបស់អុកស៊ីសែនគឺ?",["O","Ox","Os","C"],0],["ទឹកមានរូបមន្តគីមីអ្វី?",["CO₂","H₂O","O₂","NaCl"],1],["pH តិចជាង 7 ជាទូទៅបង្ហាញថាសារធាតុមានលក្ខណៈអ្វី?",["អាស៊ីត","បាស","អព្យាក្រឹត","លោហៈ"],0],["អាតូមមានផ្នែកកណ្ដាលហៅថាអ្វី?",["នុយក្លេអ៊ែរ","អេឡិចត្រុង","អ៊ីយ៉ុង","ម៉ូលេគុល"],0],["អំបិលតុធម្មតាមានរូបមន្តអ្វី?",["NaCl","HCl","KOH","CaCO₃"],0]]],
["🧬 ជីវវិទ្យា",[["ផ្នែកណានៃកោសិកាដែលគ្រប់គ្រងសកម្មភាពសំខាន់ៗ?",["នុយក្លេអ៊ែរ","ជញ្ជាំងកោសិកា","វ៉ាគ្យូល","ក្លរ៉ូប្លាស"],0],["រុក្ខជាតិផលិតអាហារតាមដំណើរការអ្វី?",["រស្មីសំយោគ","ដង្ហើម","រំលាយអាហារ","បញ្ចេញញើស"],0],["ឧស្ម័នណាដែលមនុស្សត្រូវការសម្រាប់ដង្ហើម?",["អុកស៊ីសែន","អាសូត","កាបូនឌីអុកស៊ីត","អ៊ីដ្រូសែន"],0],["DNA មានតួនាទីសំខាន់អ្វី?",["ផ្ទុកព័ត៌មានហ្សែន","ផលិតអុកស៊ីសែន","រំលាយអាហារ","បញ្ជូនសំឡេង"],0],["ប្រព័ន្ធណាបូមឈាមទៅទូទាំងរាងកាយ?",["ប្រព័ន្ធឈាមរត់","ប្រព័ន្ធរំលាយអាហារ","ប្រព័ន្ធដង្ហើម","ប្រព័ន្ធប្រសាទ"],0]]],
["🌍 ភូមិវិទ្យា",[["ផែនដីវិលជុំវិញអ្វី?",["ព្រះអាទិត្យ","ព្រះចន្ទ","ភពអង្គារ","ផ្កាយខាងជើង"],0],["តើខ្សែអេក្វាទ័របែងចែកផែនដីជា?",["អឌ្ឍគោលខាងជើង និងខាងត្បូង","កើត និងលិច","ទ្វីប និងមហាសមុទ្រ","ភ្នំ និងវាលទំនាប"],0],["តើមហាសមុទ្រណាធំបំផុត?",["ប៉ាស៊ីហ្វិក","អាត្លង់ទិក","ឥណ្ឌា","អាកទិក"],0],["តើអាកាសធាតុសំដៅលើអ្វី?",["លក្ខខណ្ឌបរិយាកាសរយៈពេលវែង","សីតុណ្ហភាពមួយវិនាទី","ចម្ងាយពីសាលា","ប្រភេទថ្ម"],0],["តើភ្នំភ្លើងអាចបញ្ចេញអ្វី?",["ឡាវ៉ា និងផេះ","ទឹកសាបតែប៉ុណ្ណោះ","ព្រិល","ខ្យល់ត្រជាក់"],0]]],
["🏛️ ប្រវត្តិវិទ្យា",[["អង្គរវត្តស្ថិតនៅប្រទេសណា?",["កម្ពុជា","ថៃ","ឡាវ","វៀតណាម"],0],["អង្គរវត្តត្រូវបានសាងសង់ក្នុងរជ្ជកាលព្រះមហាក្សត្រអង្គណា?",["ព្រះបាទសូរ្យវរ្ម័នទី២","ព្រះបាទជ័យវរ្ម័នទី៧","ព្រះបាទអង្គឌួង","ព្រះបាទនរោត្តម"],0],["ប្រវត្តិសាស្ត្រសិក្សាអំពីអ្វី?",["ព្រឹត្តិការណ៍ និងជីវិតមនុស្សក្នុងអតីតកាល","តារាវិទ្យា","គីមីសាស្ត្រ","កម្មវិធីកុំព្យូទ័រ"],0],["សិលាចារឹកមានសារៈសំខាន់អ្វី?",["ជាភស្តុតាងប្រវត្តិសាស្ត្រ","ជាឧបករណ៍វាស់ភ្លៀង","ជាអាហារ","ជាសៀវភៅគណិត"],0],["តើការអភិរក្សបេតិកភណ្ឌមានគោលបំណងអ្វី?",["រក្សាទុកសម្រាប់ជំនាន់ក្រោយ","លុបចោលអតីតកាល","បង្កើនសំឡេង","បិទសារមន្ទីរ"],0]]],
["💻 វិទ្យាសាស្ត្រកុំព្យូទ័រ",[["CPU ជាអក្សរកាត់នៃអ្វី?",["Central Processing Unit","Computer Personal User","Control Program Utility","Central Power Unit"],0],["HTML ប្រើសម្រាប់អ្វីជាចម្បង?",["រចនាសម្ព័ន្ធទំព័រវេប","កែសំឡេង","គណនាពន្ធ","គ្រប់គ្រងថ្ម"],0],["តើអ្វីជាការរក្សាទុកទិន្នន័យរយៈពេលវែង?",["Storage","RAM","Cache","Register"],0],["JavaScript អាចប្រើសម្រាប់អ្វី?",["បន្ថែមអន្តរកម្មទៅទំព័រវេប","លាបថ្នាំ","បោះពុម្ពសៀវភៅតែប៉ុណ្ណោះ","វាស់សីតុណ្ហភាព"],0],["តើពាក្យ algorithm មានន័យជាទូទៅដូចម្តេច?",["ជំហានដោះស្រាយបញ្ហា","ឧបករណ៍បញ្ចូល","ប្រភេទអេក្រង់","ឯកសាររូបភាព"],0]]],
["🔬 វិទ្យាសាស្ត្រ",[["វិធីសាស្ត្រវិទ្យាសាស្ត្រចាប់ផ្តើមដោយអ្វីជាញឹកញាប់?",["ការសង្កេត","ការទាយដោយគ្មានភស្តុតាង","ការបោះពុម្ព","ការគូរ"],0],["ទឹកកកជាស្ថានភាពណារបស់ទឹក?",["រឹង","រាវ","ឧស្ម័ន","ប្លាស្មា"],0],["តើកម្លាំងកកិតធ្វើអ្វី?",["ប្រឆាំងនឹងចលនា","បង្កើតពន្លឺជានិច្ច","បង្កើនម៉ាស","បង្កើតទឹក"],0],["តើភពណាជាភពទីបីពីព្រះអាទិត្យ?",["ផែនដី","ភពអង្គារ","ភពសុក្រ","ភពពុធ"],0],["តើការកែច្នៃឡើងវិញជួយអ្វី?",["កាត់បន្ថយសំណល់","បង្កើនសំណល់","បិទព្រៃ","បង្កើនការបំពុល"],0]]],
["🌐 សិក្សាសង្គម",[["សហគមន៍មានន័យថាអ្វី?",["ក្រុមមនុស្សរស់នៅ និងធ្វើសកម្មភាពរួមគ្នា","ឧបករណ៍","ភ្នំ","រុក្ខជាតិ"],0],["សិទ្ធិរបស់ពលរដ្ឋគួរត្រូវបានអនុវត្តជាមួយអ្វី?",["ការទទួលខុសត្រូវ","ការមិនគោរពច្បាប់","ការបំផ្លាញ","ភាពអសកម្ម"],0],["តើការគោរពភាពខុសគ្នាជួយអ្វី?",["បង្កើតការរស់នៅរួមដោយសន្តិភាព","បង្កើនជម្លោះ","បិទការសន្ទនា","បំបែកសហគមន៍"],0],["តើធនធានធម្មជាតិជាអ្វី?",["អ្វីដែលមានក្នុងធម្មជាតិ និងមនុស្សអាចប្រើប្រាស់បាន","កម្មវិធីកុំព្យូទ័រ","សៀវភៅសិក្សា","តុសិស្ស"],0],["ការសម្រេចចិត្តល្អក្នុងសង្គមគួរពឹងផ្អែកលើអ្វី?",["ព័ត៌មាន និងការពិចារណា","ពាក្យចចាមអារ៉ាម","ការបង្ខំ","ការស្មាន"],0]]]
];
const entry=bank.find(x=>x[0]===subjects[state.subject])||bank[2];
state.questions=entry[1].map(x=>({text:x[0],answers:x[1],correct:x[2],image:"",difficulty:"easy"}));renderEditors();save();toast("✨ សំណួរឧទាហរណ៍បានផ្ទុក")}
function show(id){document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));$(id).classList.add("active");window.scrollTo(0,0)}
function shuffle(a){return a.map(x=>[Math.random(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1])}
function startQuiz(){startBackgroundMusic();if(state.questions.length<1){toast("⚠️ សូមបន្ថែមសំណួរយ៉ាងហោចណាស់ ១");return}const qs=JSON.parse(JSON.stringify(state.questions));game.questions=state.shuffleQuestions==="on"?shuffle(qs):qs;game.index=0;game.score=0;game.correct=0;game.wrong=0;show("countdownView");runCountdown()}
function runCountdown(){let n=3;$("countdownNumber").textContent=n;$("countdownLabel").textContent="ត្រៀមចាប់ផ្ដើម";tone(520,.09);const id=setInterval(()=>{n--;if(n>0){$("countdownNumber").textContent=n;tone(520,.09)}else{$("countdownNumber").textContent="🚀";$("countdownLabel").textContent="ចាប់ផ្តើម!";tone(880,.18);clearInterval(id);setTimeout(()=>{show("quizView");startBackgroundMusic();renderQuestion()},650)}},800)}
function renderQuestion(){startBackgroundMusic();clearInterval(game.timerId);game.answered=false;const q=game.questions[game.index];$("quizSubject").textContent=subjects[state.subject];$("quizGrade").textContent=grades[state.grade];$("scoreDisplay").textContent=game.score;$("progressText").textContent=`សំណួរ ${game.index+1} / ${game.questions.length}`;const pct=Math.round((game.index+1)/game.questions.length*100);$("progressPct").textContent=pct+"%";$("progressBar").style.width=pct+"%";$("questionText").textContent=q.text;const badge={easy:"🟢 ងាយ",medium:"🟡 មធ្យម",hard:"🔴 ពិបាក"}[q.difficulty]||"🟢 ងាយ";$("difficultyBadge").textContent=badge;
if(q.image){$("questionImage").src=q.image;$("questionImageWrap").classList.remove("hidden");$("questionImage").onerror=()=>{$("questionImageWrap").classList.add("hidden")}}else $("questionImageWrap").classList.add("hidden");
let opts=q.answers.map((text,i)=>({text,original:i}));if(state.shuffleAnswers==="on")opts=shuffle(opts);$("answers").innerHTML=opts.map((o,i)=>`<button class="answer-btn" data-original="${o.original}"><span class="answer-letter">${letters[i]}</span><span>${esc(o.text)}</span></button>`).join("");$("answers").querySelectorAll(".answer-btn").forEach(b=>b.addEventListener("click",()=>answer(+b.dataset.original,b)));
$("feedback").className="feedback hidden";$("nextBtn").classList.add("hidden");startTimer()}
function startTimer(){game.remaining=Number(state.timer);updateTimer();game.timerId=setInterval(()=>{game.remaining--;updateTimer();if(game.remaining<=5&&game.remaining>0)tone(740,.05);if(game.remaining<=0){clearInterval(game.timerId);timeoutAnswer()}},1000)}
function updateTimer(){$("timerDisplay").textContent=game.remaining;$("timerCircle").classList.toggle("warning",game.remaining<=10&&game.remaining>5);$("timerCircle").classList.toggle("critical",game.remaining<=5)}
function answer(original,btn){if(game.answered)return;game.answered=true;clearInterval(game.timerId);const q=game.questions[game.index],correct=original===q.correct;document.querySelectorAll(".answer-btn").forEach(b=>{b.disabled=true;const o=+b.dataset.original;if(o===q.correct)b.classList.add("correct");else if(b===btn&&!correct)b.classList.add("wrong");else b.classList.add("dim")});let points=0;if(correct){points=10;if(state.speedBonus==="on")points+=Math.min(5,Math.floor((game.remaining/Number(state.timer))*5));game.score+=points;game.correct++;feedback(`ត្រឹមត្រូវ!<br><strong>+${points} ពិន្ទុ</strong>`,"correct");tone(880,.12);celebrate()}else{game.wrong++;feedback(`មិនត្រឹមត្រូវ${state.revealCorrect==="on"?`<br>ចម្លើយត្រឹមត្រូវ៖ <strong>${letters[q.correct]}. ${esc(q.answers[q.correct])}</strong>`:""}`,"wrong");tone(180,.16)}$("scoreDisplay").textContent=game.score;showNext()}
function timeoutAnswer(){if(game.answered)return;game.answered=true;const q=game.questions[game.index];document.querySelectorAll(".answer-btn").forEach(b=>{b.disabled=true;b.classList.add(+b.dataset.original===q.correct?"correct":"dim")});game.wrong++;feedback(`⏰ អស់ពេល!${state.revealCorrect==="on"?`<br>ចម្លើយត្រឹមត្រូវ៖ <strong>${letters[q.correct]}. ${esc(q.answers[q.correct])}</strong>`:""}`,"wrong");tone(130,.2);showNext()}
function showNext(){ $("nextBtn").textContent=game.index===game.questions.length-1?"បញ្ចប់ ➜":"បន្ទាប់ ➜";$("nextBtn").classList.remove("hidden")}
function feedback(html,type){$("feedback").innerHTML=html;$("feedback").className=`feedback ${type}`}
function next(){if(!game.answered)return;if(game.index<game.questions.length-1){game.index++;startBackgroundMusic();renderQuestion()}else finish()}
function finish(){$("finalScore").textContent=game.score;$("correctCount").textContent=`${game.correct} / ${game.questions.length}`;$("wrongCount").textContent=`${game.wrong} / ${game.questions.length}`;$("accuracy").textContent=Math.round(game.correct/game.questions.length*100)+"%";show("resultView");tone(980,.18);celebrate(true)}
function celebrate(big=false){const wrap=$(big?"resultEffects":"effects");if(!big)wrap.innerHTML="";const symbols=["✨","⭐","🎉","🚀"];for(let i=0;i<(big?18:24);i++){const p=document.createElement("span");p.className="particle";p.textContent=symbols[Math.floor(Math.random()*symbols.length)];p.style.left=(Math.random()*100)+"%";p.style.top=(Math.random()*55+20)+"%";p.style.setProperty("--x",(Math.random()*360-180)+"px");p.style.setProperty("--y",(Math.random()*-320-80)+"px");wrap.appendChild(p)}if(!big){const r=document.createElement("span");r.className="rocket";r.textContent="🚀";wrap.appendChild(r);setTimeout(()=>wrap.innerHTML="",1500)}}
function tone(freq,dur){if(!state.sound)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=freq;o.type="sine";g.gain.setValueAtTime(.04,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+dur);setTimeout(()=>c.close(),dur*1000+50)}catch(e){}}
function theme(){document.body.classList.toggle("dark",state.theme==="dark");$("themeToggle").textContent=state.theme==="dark"?"☀️":"🌙"}
function init(){load();fillSelects();bindControls();renderEditors();theme();$("soundToggle").textContent=state.sound?"🔊":"🔇";
$("addQuestionBtn").onclick=()=>addQuestion();$("demoBtn").onclick=demoQuestions;$("startBtn").onclick=startQuiz;$("nextBtn").onclick=next;$("playAgainBtn").onclick=startQuiz;$("teacherTopBtn").onclick=()=>show("teacherView");$("resultTeacherBtn").onclick=()=>show("teacherView");
$("themeToggle").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";theme();save()};$("soundToggle").onclick=()=>{state.sound=!state.sound;$("soundToggle").textContent=state.sound?"🔊":"🔇";save();syncBackgroundMusic();if(state.sound)tone(600,.08)};
$("clearSavedBtn").onclick=()=>{if(confirm("តើអ្នកចង់លុប Quiz ដែលបានរក្សាទុកមែនទេ?")){localStorage.removeItem(KEY);state={...state,questions:[]};renderEditors();save();toast("🗑️ Quiz ដែលបានរក្សាទុកត្រូវបានលុប")}};
}
init();
document.addEventListener("DOMContentLoaded",()=>{
  $("saveQuizBtn")?.addEventListener("click",saveCurrentQuiz);
  $("exportQuizzesBtn")?.addEventListener("click",exportQuizLibrary);
  $("importQuizzesBtn")?.addEventListener("click",()=>$("importQuizzesFile")?.click());
  $("importQuizzesFile")?.addEventListener("change",e=>importQuizLibrary(e.target.files?.[0]));
  $("savedQuizzesList")?.addEventListener("click",e=>{
    const b=e.target.closest("button"); if(!b)return;
    if(b.dataset.play)playSavedQuiz(b.dataset.play);
    else if(b.dataset.edit)editSavedQuiz(b.dataset.edit);
    else if(b.dataset.copy)duplicateSavedQuiz(b.dataset.copy);
    else if(b.dataset.delete)deleteSavedQuiz(b.dataset.delete);
  });
  setTimeout(renderSavedQuizzes,350);
});
