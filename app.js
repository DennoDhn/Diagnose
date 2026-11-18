/* GPU DIAGNOSE v1.0 — Static only, no telemetry or device access. */
(() => {
  "use strict";
  const key = "gpu-diagnose-session-v1";
  const names = {
    overview:"ÜBERSICHT", windows:"WINDOWS-SCAN", controller:"RGB-CONTROLLER",
    linux:"LINUX-LIVETEST", report:"ERGEBNISSE", sources:"DOWNLOADS"
  };
  const WINDOWS = [
    "$ErrorActionPreference = 'Stop'",
    "try {",
    "  $os=Get-CimInstance Win32_OperatingSystem",
    "  $bios=Get-CimInstance Win32_BIOS",
    "  $mb=Get-CimInstance Win32_BaseBoard",
    "  $gpu=@(Get-PnpDevice -Class Display | Select-Object FriendlyName,Status,InstanceId)",
    "  $drv=@(Get-CimInstance Win32_PnPSignedDriver | Where-Object {$_.DeviceClass -eq 'DISPLAY'} | Select-Object DeviceName,Manufacturer,DriverVersion,DriverDate,InfName)",
    "  $r=[ordered]@{",
    "    Tool='GPU-DIAG Windows Read-only 1.0'",
    "    CapturedAt=(Get-Date).ToString('yyyy-MM-dd HH:mm:ss')",
    "    OperatingSystem=[ordered]@{Caption=$os.Caption;Build=$os.BuildNumber;Version=$os.Version}",
    "    BIOS=[ordered]@{Manufacturer=$bios.Manufacturer;Version=$bios.SMBIOSBIOSVersion;ReleaseDate=if($bios.ReleaseDate){$bios.ReleaseDate.ToString('yyyy-MM-dd')}else{''}}",
    "    Mainboard=[ordered]@{Manufacturer=$mb.Manufacturer;Product=$mb.Product}",
    "    DisplayAdapters=$gpu;DisplayDrivers=$drv",
    "  }",
    "  'GPU-DIAG-BEGIN'",
    "  $r | ConvertTo-Json -Depth 8",
    "  'GPU-DIAG-END'",
    "} catch { 'GPU-DIAG-ERROR: '+$_.Exception.Message }"
  ].join("\n");
  const LINUX = [
    "echo 'GPU-DIAG-LINUX-BEGIN'",
    "printf 'Kernel: '; uname -r",
    "printf 'Distribution: '; grep '^PRETTY_NAME=' /etc/os-release",
    "echo '--- Display PCI devices ---'",
    "lspci -nnk | grep -E -i -A 4 'VGA compatible controller|3D controller|Display controller'",
    "echo '--- DRM PCI IDs ---'",
    "for d in /sys/class/drm/card[0-9]*/device; do if [ -d \"$d\" ]; then echo \"$d\"; for f in vendor device subsystem_vendor subsystem_device; do if [ -r \"$d/$f\" ]; then printf '%s=' \"$f\"; cat \"$d/$f\"; fi; done; fi; done",
    "echo '--- I2C-Gerätedateien (ohne Registerscan) ---'",
    "ls /dev/i2c-* 2>/dev/null || echo 'Keine zugänglichen I2C-Knoten'",
    "echo 'GPU-DIAG-LINUX-END'"
  ].join("\n");
  const cmds = {
    windows: WINDOWS,
    linux: LINUX,
    nitroPy: "py .\\tools\\nitroglow_probe.py read",
    nitroExe: ".\\NitroGlowFix.exe --read"
  };
  const $ = id => document.getElementById(id);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const tracked = ["windowsOutput","nitroOutput","linuxOutput","notes","osResult","externalResult","bootFlash","linuxStatus"];
  const state = {tasks:{}, fields:{}, lastWindows:null, lastNitro:null, lastLinux:null};
  let timer;
  function toast(msg) {
    const el=$("toast");el.textContent=msg;el.classList.add("show");
    clearTimeout(timer);timer=setTimeout(()=>el.classList.remove("show"),2700);
  }
  async function copy(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);toast("In Zwischenablage kopiert");return;
      }
      const ta=document.createElement("textarea");ta.value=text;ta.setAttribute("readonly","");
      ta.style.cssText="position:fixed;left:-9999px;top:0";document.body.appendChild(ta);
      ta.select();const ok=document.execCommand("copy");ta.remove();
      if (ok) {toast("In Zwischenablage kopiert");return;}
    } catch(e) {}
    toast("Kopieren nicht möglich – Text manuell markieren");
  }
  function persist(){
    try {localStorage.setItem(key, JSON.stringify(state));}
    catch(e){toast("Browser-Speicherung nicht verfügbar");}
  }
  function hydrate(){
    try{
      const saved=JSON.parse(localStorage.getItem(key)||"null");
      if(saved&&typeof saved==="object"){
        state.tasks=saved.tasks||{};state.fields=saved.fields||{};
        state.lastWindows=saved.lastWindows||null;state.lastNitro=saved.lastNitro||null;state.lastLinux=saved.lastLinux||null;
      }
    }catch(e){}
    tracked.forEach(id=>{if(state.fields[id]!==undefined)$(id).value=state.fields[id];});
    $$("[data-task]").forEach(el=>el.checked=!!state.tasks[el.dataset.task]);
    progress();
  }
  function progress(){
    const checked=$$("[data-task]").filter(el=>el.checked).length;
    $("progressText").textContent=checked+"/6";
    $("progressBar").style.width=Math.round(checked/6*100)+"%";
  }
  function page(name){
    if(!names[name])name="overview";
    $$(".page").forEach(el=>el.classList.toggle("active",el.id===name));
    $$("[data-page]").forEach(el=>{const active=el.dataset.page===name;el.classList.toggle("active",active);el.setAttribute("aria-current",active?"page":"false");});
    $("sectionName").textContent=names[name];
    history.replaceState(null,"","#"+name);
    window.scrollTo({top:0,behavior:"instant"});
  }
  function storeField(ev){state.fields[ev.target.id]=ev.target.value;persist();}
  function outcome(el,cls,msg){el.className="result-box"+(cls?" "+cls:"");el.textContent=msg;}
  function parseWindows(){
    const t=$("windowsOutput").value.trim();
    const m=t.match(/GPU-DIAG-BEGIN\s*([\s\S]*?)\s*GPU-DIAG-END/);
    if(!m){outcome($("windowsResult"),"warn","Keine vollständige JSON-Ausgabe gefunden. Bitte den Bereich zwischen GPU-DIAG-BEGIN und GPU-DIAG-END kopieren.");return;}
    try{
      const d=JSON.parse(m[1]);
      const adapters=[].concat(d.DisplayAdapters||[]).filter(Boolean);
      const gpu=adapters.filter(a=>/7900\s*XTX|744C/i.test((a.FriendlyName||"")+" "+(a.InstanceId||"")));
      const driver=[].concat(d.DisplayDrivers||[]).filter(Boolean);
      const lines=[
        "Windows: "+(d.OperatingSystem?.Caption||"unbekannt")+" (Build "+(d.OperatingSystem?.Build||"?")+")",
        "Mainboard: "+(d.Mainboard?.Manufacturer||"")+" "+(d.Mainboard?.Product||""),
        "BIOS: "+(d.BIOS?.Version||"unbekannt"),
        "RX 7900 XTX erkannt: "+(gpu.length?"JA":"nicht eindeutig"),
        "Grafikadapter: "+adapters.map(a=>(a.FriendlyName||"?")+" ["+(a.Status||"?")+"]").join("; "),
        "Display-Treiber: "+driver.map(a=>(a.DeviceName||"?")+" "+(a.DriverVersion||"?")).join("; "),
        "",
        "Der Scan belegt nur die Windows-Geräteerkennung, nicht die Funktion des RGB-Controllers."
      ];
      state.lastWindows={ok:true,at:new Date().toISOString(),data:d};
      outcome($("windowsResult"),gpu.length?"good":"warn",lines.join("\n"));
      persist();
    }catch(e){outcome($("windowsResult"),"bad","JSON konnte nicht gelesen werden: "+e.message);}
  }
  function parseNitro(){
    const t=$("nitroOutput").value.trim();
    if(!t){outcome($("nitroResult"),"warn","Keine Diagnoseausgabe eingefügt.");return;}
    const records=[];
    const re=/0x(10|27|3e)\b[^\r\n]*?ret\s*=\s*(-?\d+)[^\r\n]*?val\s*=\s*(0x[0-9a-f]+)/gi;
    let m;
    while((m=re.exec(t))!==null){records.push({register:"0x"+m[1].toUpperCase(),ret:Number(m[2]),hex:m[3],value:parseInt(m[3],16)});}
    if(!records.length){
      const notfound=/No Sapphire Nitro Glow controller found|No Sapphire AMD GPU found/i.test(t);
      state.lastNitro={ok:false,at:new Date().toISOString(),message:notfound?"Controller-Suche fehlgeschlagen":"Registerausgabe nicht erkannt"};
      outcome($("nitroResult"),"warn",notfound?"Das Tool meldet, dass es keinen erreichbaren Sapphire-Controller gefunden hat. Die Grafikkarte selbst kann trotzdem korrekt funktionieren.":"Keine Registerzeilen mit ret= und val= erkannt. Bitte die komplette Terminal-Ausgabe einfügen.");
      persist();return;
    }
    const failures=records.filter(r=>r.ret!==0);
    const led=records.find(r=>r.register==="0x27");
    const lines=records.map(r=>r.register+" : ret="+r.ret+(r.ret===0?" → gültiger Wert "+r.value+" ("+r.hex+")":" → Lesezugriff fehlgeschlagen; "+r.hex+" NICHT auswertbar"));
    lines.push("");
    if(failures.length===records.length){
      lines.push("Befund: Kein einziges Register wurde erfolgreich gelesen. Der LED-count ist UNBEKANNT. Mögliche Ursachen: ADL/I²C-Zugriff, Software, Controller oder elektrische Kommunikation.");
    } else if(led&&led.ret===0){
      lines.push("LED-count-Register 0x27 erfolgreich ausgelesen: "+led.value+". Bedeutung anhand inoffizieller Community-Recherche prüfen; keine Schreiboperation ausführen.");
    } else {
      lines.push("Einige Register sind erreichbar, aber LED-count 0x27 wurde nicht gültig gelesen.");
    }
    state.lastNitro={ok:failures.length===0,at:new Date().toISOString(),records};
    outcome($("nitroResult"),failures.length?"warn":"good",lines.join("\n"));
    persist();
  }
  function parseLinux(){
    const t=$("linuxOutput").value.trim();
    if(!t){outcome($("linuxResult"),"warn","Noch keine Linux-Ausgabe eingefügt.");return;}
    const found=/RX 7900 XTX|1002:744c|\b744c\b/i.test(t);
    const amdgpu=/Kernel driver in use: amdgpu/i.test(t);
    const complete=t.includes("GPU-DIAG-LINUX-BEGIN")&&t.includes("GPU-DIAG-LINUX-END");
    const i2c=/\/dev\/i2c-[0-9]+/.test(t);
    const result=[
      "Live-Ausgabe: "+(complete?"vollständig markiert":"Markierungen unvollständig"),
      "RX 7900 XTX (PCI 744C) erkannt: "+(found?"JA":"nicht eindeutig"),
      "Kernel-Treiber amdgpu zugeordnet: "+(amdgpu?"JA":"nicht belegt"),
      "I²C-Gerätedateien vorhanden: "+(i2c?"JA":"nicht nachgewiesen"),
      "",
      "Wichtig: Die Existenz von /dev/i2c-* beweist KEINEN Zugriff auf den Sapphire-RGB-Controller. Eine nicht erkannte RGB-Funktion unter Linux beweist ebenfalls keinen Hardwaredefekt."
    ].join("\n");
    state.lastLinux={ok:complete&&found,at:new Date().toISOString(),found,amdgpu,i2c};
    outcome($("linuxResult"),found?"good":"warn",result);
    persist();
  }
  function reportText(){
    const v=id=>$(id).value;
    const taskLines=$$("[data-task]").map(el=>(el.checked?"[x] ":"[ ] ")+el.parentElement.querySelector("strong").textContent);
    const controller=state.lastNitro;
    const ctrlLines=controller?.records?.length?controller.records.map(r=>"  "+r.register+": ret="+r.ret+(r.ret===0?", Wert "+r.value:", ungültiger Messwert")).join("\n"):"  Noch kein gültiger neuer Registerbericht importiert. Bisheriger bekannter Befund: ret=-1.";
    return [
      "GPU DIAGNOSE – PRÜFBERICHT",
      "Erstellt: "+new Date().toLocaleString("de-DE"),
      "====================================",
      "HARDWARE / AUSGANGSLAGE",
      "GPU: Sapphire NITRO+ RX 7900 XTX, PCI 1002:744C, SUBSYS 1DA2:E471",
      "Mainboard: MSI MPG B650 EDGE WIFI",
      "Bisheriges Problem: LED-Leisten dunkel, teilweise kurzer gelber Blitz beim Ausschalten mit ARGB-Kabel.",
      "Hinweis: Windows-Update zeitlich vor Ausfall vermutet, Kausalität nicht nachgewiesen.",
      "",
      "MANUELLER STATUS",
      "TriXX: "+v("osResult"),
      "Externe 5V-ARGB-Steuerung: "+v("externalResult"),
      "Gelber Ausschaltblitz: "+v("bootFlash"),
      "Linux: "+v("linuxStatus"),
      "",
      "REGISTERAUSLESUNG",
      ctrlLines,
      "Wichtig: ret=-1 bedeutet fehlgeschlagene Kommunikation, NICHT LED_count=0.",
      "",
      "FORTSCHRITT",
      ...taskLines,
      "",
      "WINDOWS-SCAN",
      state.lastWindows?.ok?
        "BIOS: "+(state.lastWindows.data?.BIOS?.Version||"?")+"; Mainboard: "+(state.lastWindows.data?.Mainboard?.Product||"?")+"; Display: "+[].concat(state.lastWindows.data?.DisplayAdapters||[]).map(x=>x.FriendlyName+" ("+x.Status+")").join(", "):
        "Noch kein vollständiger Windows-Scan importiert.",
      "LINUX-SCAN",
      state.lastLinux?"RX 7900 XTX erkannt: "+state.lastLinux.found+"; amdgpu-Zuordnung: "+state.lastLinux.amdgpu+"; I²C-Knoten vorhanden: "+state.lastLinux.i2c:"Noch kein Linux-Scan importiert.",
      "",
      "NOTIZEN",
      v("notes")||"(keine)",
      "",
      "NÄCHSTE ENTSCHEIDUNG",
      "Bei funktionsfähigem RGB unter Linux ist Windows-/Treiberkonflikt wahrscheinlicher.",
      "Bei ausbleibender Erkennung auf beiden Systemen bleiben Tool-Support, I²C-Kommunikation, Kabel und RGB-Hardware mögliche Ursachen.",
      "Kein Registerschreiben und kein Firmware-Flash allein aufgrund dieses Berichts.",
      "",
      "Erstellt lokal mit https://github.com/DennoDhn/Diagnose"
    ].join("\n");
  }
  function download(name,content,type){
    const b=new Blob([content],{type:type||"text/plain;charset=utf-8"});
    const u=URL.createObjectURL(b);const a=document.createElement("a");
    a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(u),30000);
    toast("Datei vorbereitet");
  }
  function renderPast(){
    if(state.lastWindows?.ok)outcome($("windowsResult"),"good","Letzter Windows-Scan gespeichert. Erneut auswerten, um Details anzuzeigen.");
    if(state.lastNitro)outcome($("nitroResult"),state.lastNitro.ok?"good":"warn","Vorheriges Registerergebnis lokal gespeichert. Für Details erneut auswerten.");
    if(state.lastLinux)outcome($("linuxResult"),state.lastLinux.ok?"good":"warn","Vorheriger Linux-Scan lokal gespeichert. Für Details erneut auswerten.");
  }
  Object.entries(cmds).forEach(([id,command])=>{
    const el=$(id+"Code");if(el)el.textContent=command;
  });
  $$("[data-copy]").forEach(b=>b.addEventListener("click",()=>copy(cmds[b.dataset.copy]||"")));
  $$("[data-page]").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));
  $$("[data-goto]").forEach(b=>b.addEventListener("click",()=>page(b.dataset.goto)));
  $$("[data-task]").forEach(b=>b.addEventListener("change",e=>{state.tasks[e.target.dataset.task]=e.target.checked;persist();progress();}));
  tracked.forEach(id=>$(id).addEventListener("input",storeField));
  $("parseWindows").addEventListener("click",parseWindows);
  $("parseNitro").addEventListener("click",parseNitro);
  $("parseLinux").addEventListener("click",parseLinux);
  [["clearWindows","windowsOutput","windowsResult","lastWindows"],["clearNitro","nitroOutput","nitroResult","lastNitro"],["clearLinux","linuxOutput","linuxResult","lastLinux"]].forEach(([b,t,r,k])=>{
    $(b).addEventListener("click",()=>{$(t).value="";state.fields[t]="";state[k]=null;persist();outcome($(r),"","Ausgabe gelöscht.");});
  });
  $("makeReport").addEventListener("click",()=>{$("reportOutput").value=reportText();toast("Bericht erzeugt");});
  $("copyReport").addEventListener("click",()=>{$("reportOutput").value=reportText();copy($("reportOutput").value);});
  $("downloadReport").addEventListener("click",()=>download("gpu-diagnose-bericht.txt",reportText()));
  $("downloadJson").addEventListener("click",()=>download("gpu-diagnose-sitzung.json",JSON.stringify({created:new Date().toISOString(),...state},null,2),"application/json;charset=utf-8"));
  $("clearProgress").addEventListener("click",()=>{$$("[data-task]").forEach(el=>{el.checked=false;state.tasks[el.dataset.task]=false;});persist();progress();toast("Fortschritt zurückgesetzt");});
  $("resetAll").addEventListener("click",()=>{
    if(!confirm("Alle lokalen Diagnoseergebnisse, Notizen und Häkchen in diesem Browser löschen?"))return;
    localStorage.removeItem(key);location.reload();
  });
  hydrate();renderPast();page(decodeURIComponent(location.hash.slice(1))||"overview");
  window.addEventListener("hashchange",()=>page(location.hash.slice(1)));
})();