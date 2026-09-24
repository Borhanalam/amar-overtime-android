const KEY="workerSalaryTracker_v1";
let data=JSON.parse(localStorage.getItem(KEY)||'{"settings":{},"records":[]}');
const $=id=>document.getElementById(id);

function todayLocal(){
  const d=new Date(), off=d.getTimezoneOffset();
  return new Date(d.getTime()-off*60000).toISOString().slice(0,10);
}
$("date").value=todayLocal();

function settings(){
  return {
    salary:+$("salary").value||0,
    salaryDays:+$("salaryDays").value||26,
    regularHours:+$("regularHours").value||8,
    otMultiplier:2,
    attendanceBonus:+$("attendanceBonus").value||625,
    lateLimit:+$("lateLimit").value||15,
    nightBill:+$("nightBill").value||100
  };
}
function save(){data.settings=settings();localStorage.setItem(KEY,JSON.stringify(data));render();}
function loadSettings(){
  const s=data.settings||{};
  for(const k of ["salary","salaryDays","regularHours","otMultiplier","attendanceBonus","lateLimit","nightBill"])
    if(s[k]!==undefined) $(k).value=s[k];
}
loadSettings();

["salary","salaryDays","regularHours","otMultiplier","attendanceBonus","lateLimit","nightBill"].forEach(id=>$(id).addEventListener("input",save));

function minutes(t){const [h,m]=t.split(":").map(Number);return h*60+m}
function duration(inT,outT){
  let a=minutes(inT),b=minutes(outT);
  if(b<=a)b+=1440;
  return b-a;
}
function money(n){return "৳"+n.toFixed(2)}
function fmtHours(n){return n.toFixed(2)}

function calculate(r){
  const s=settings();
  let regular=0, ot=0, late=0, early=false, night=0;
  if(["leave","sick","absent"].includes(r.status)) return {regular,ot,late,early,night};

  if(!r.inTime||!r.outTime) return {regular,ot,late,early,night};
  const total=duration(r.inTime,r.outTime);

  // Night duty: 8 PM to 4 AM, no break. Holiday work is all OT.
  if(r.dutyType==="night"){
    if(r.status==="holiday") ot=total/60;
    else { regular=Math.min(s.regularHours,total/60); ot=Math.max(0,total/60-s.regularHours); }
    if(minutes(r.outTime)<=minutes(r.inTime) ? minutes(r.outTime)<=240 : false){}
    // Night bill: duty crosses midnight (out time is after 00:00) or total duty crosses 00:00.
    if(total>0 && minutes(r.outTime)<minutes(r.inTime)) night=s.nightBill;
  } else {
    // Day duty: expected 8 AM start, 5 PM end, 1-hour lunch.
    const inM=minutes(r.inTime), outM=minutes(r.outTime);
    if(inM>480) late=inM-480;
    if(r.status!=="holiday" && outM<1020) early=true;
    if(r.status==="holiday") ot=total/60;
    else {
      regular=Math.min(s.regularHours, Math.max(0,total/60-1)); // one-hour lunch
      // OT begins after 5 PM, independent of the lunch deduction.
      if(outM>1020) ot=(outM-1020)/60;
    }
    // Any duty whose out time passes midnight gets the night bill.
    if(outM<inM) night=s.nightBill;
  }
  return {regular,ot,late,early,night};
}

$("dutyType").addEventListener("change",()=>{
  if($("dutyType").value==="day"){ $("inTime").value="08:00"; $("outTime").value="17:00"; }
  else { $("inTime").value="20:00"; $("outTime").value="04:00"; }
});
$("status").addEventListener("change",()=>{
  if($("status").value==="holiday") $("dutyType").disabled=false;
});

$("dutyForm").addEventListener("submit",e=>{
  e.preventDefault();
  const r={
    id:Date.now(),
    date:$("date").value,
    dutyType:$("dutyType").value,
    status:$("status").value,
    inTime:$("inTime").value,
    outTime:$("outTime").value,
    notes:$("notes").value
  };
  const existing=data.records.findIndex(x=>x.date===r.date);
  if(existing>=0) data.records[existing]=r; else data.records.push(r);
  data.records.sort((a,b)=>a.date.localeCompare(b.date));
  save(); $("dutyForm").reset(); $("date").value=todayLocal(); $("dutyType").value="day";
  $("inTime").value="08:00"; $("outTime").value="17:00";
});
$("clearBtn").onclick=()=>{$("dutyForm").reset();$("date").value=todayLocal();$("dutyType").value="day";$("inTime").value="08:00";$("outTime").value="17:00";};

function monthStats(){
  const s=settings(), ym=todayLocal().slice(0,7);
  const rs=data.records.filter(r=>r.date.startsWith(ym));
  let present=0,absent=0,leave=0,holiday=0,regular=0,ot=0,late=0,night=0,early=false;
  rs.forEach(r=>{
    const c=calculate(r);
    if(r.status==="present"){present++;} else if(r.status==="absent")absent++; else if(["leave","sick"].includes(r.status))leave++; else if(r.status==="holiday")holiday++;
    regular+=c.regular;ot+=c.ot;late+=c.late;night+=c.night;if(c.early)early=true;
  });
  const hourly=(s.salary*0.5605)/(s.salaryDays*s.regularHours);
  const otRate=hourly*2;
  const otPay=ot*otRate;
  const bonus=(late>=s.lateLimit||early)?0:s.attendanceBonus;
  const total=s.salary+otPay+bonus+night;
  return {rs,present,absent,leave,holiday,regular,ot,late,night,hourly,otRate,otPay,bonus,total,early};
}
function stat(title,value,cls=""){return `<div class="stat"><small>${title}</small><strong class="${cls}">${value}</strong></div>`}
function render(){
  const m=monthStats(),s=settings();
  const eligible=m.bonus>0;
  $("dashboard").innerHTML=[
    stat("This month",todayLocal().slice(0,7)),
    stat("Present",m.present),
    stat("Holiday",m.holiday),
    stat("Regular Hours",fmtHours(m.regular)),
    stat("OT Hours",fmtHours(m.ot)),
    stat("OT Rate / Hour",money(m.otRate)),
    stat("OT Wage",money(m.otPay)),
    stat("Total Late",m.late+" min",m.late>=s.lateLimit?"bad":""),
    stat("Night Bill",money(m.night)),
    stat("Attendance Bonus",money(m.bonus),eligible?"ok":"bad"),
    stat("Total Pay",money(m.total)),
  ].join("");

  $("records").innerHTML=data.records.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(r=>{
    const c=calculate(r);
    return `<tr>
      <td>${r.date}</td><td>${r.dutyType==="night"?"Night":"Day"}</td><td>${r.status}</td>
      <td>${r.inTime||"-"}</td><td>${r.outTime||"-"}</td>
      <td>${fmtHours(c.regular)}</td><td>${fmtHours(c.ot)}</td><td>${c.late}</td>
      <td>${money(c.night)}</td>
      <td><button class="mini secondary" onclick="editRecord(${r.id})">Edit</button>
      <button class="mini danger" onclick="deleteRecord(${r.id})">Delete</button></td>
    </tr>`;
  }).join("") || `<tr><td colspan="10">No records yet.</td></tr>`;
}
window.editRecord=id=>{
  const r=data.records.find(x=>x.id===id); if(!r)return;
  $("date").value=r.date;$("dutyType").value=r.dutyType;$("status").value=r.status;
  $("inTime").value=r.inTime||"";$("outTime").value=r.outTime||"";$("notes").value=r.notes||"";
  data.records=data.records.filter(x=>x.id!==id);save();window.scrollTo({top:0,behavior:"smooth"});
};
window.deleteRecord=id=>{if(confirm("Delete this record?")){data.records=data.records.filter(x=>x.id!==id);save();}};
$("clearAllBtn").onclick=()=>{if(confirm("Delete ALL records?")){data.records=[];save();}};
$("exportBtn").onclick=()=>{
  const rows=[["Date","Duty Type","Status","In","Out","Regular Hours","OT Hours","Late Minutes","Night Bill","Notes"]];
  data.records.forEach(r=>{const c=calculate(r);rows.push([r.date,r.dutyType,r.status,r.inTime,r.outTime,c.regular,c.ot,c.late,c.night,r.notes||""])});
  const csv=rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="worker-duty-records.csv";a.click();
};
function tick(){ $("clock").textContent=new Date().toLocaleString("en-BD",{dateStyle:"medium",timeStyle:"medium"}); }
setInterval(tick,1000);tick();
render();
