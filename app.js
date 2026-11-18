/* GPU DIAGNOSE v1.3.2 — Static only, no telemetry or device access. */
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
  const LINUX = "set +e\necho 'GPU-DIAG-LINUX-BEGIN'\nprintf 'KERNEL: '; uname -r\nprintf 'OS: '; if [ -r /etc/os-release ]; then sed -n 's/^PRETTY_NAME=//p' /etc/os-release | head -n 1; else echo 'unknown'; fi\nprintf 'ARCH: '; uname -m\necho '--- GPU PCI ---'\nif command -v lspci >/dev/null 2>&1; then\n    lspci -Dnnk | grep -E -i -A 4 'VGA compatible controller|3D controller|Display controller'\nelse\n    echo 'lspci: not installed'\nfi\necho '--- DRM PCI IDs ---'\nfor d in /sys/class/drm/card[0-9]/device /sys/class/drm/card[0-9][0-9]/device; do\n    [ -d \"$d\" ] || continue\n    printf 'DRM_DEVICE: %s ' \"$d\"\n    for field in vendor device subsystem_vendor subsystem_device; do\n        if [ -r \"$d/$field\" ]; then printf '%s=%s ' \"$field\" \"$(cat \"$d/$field\")\"; fi\n    done\n    if [ -L \"$d/driver\" ]; then printf 'driver=%s ' \"$(basename \"$(readlink -f \"$d/driver\")\")\"; fi\n    echo\ndone\necho '--- KERNEL MODULES ---'\nif command -v lsmod >/dev/null 2>&1; then\n    lsmod | grep -E '^(amdgpu|i2c_dev|i2c_algo_bit|drm_)' || echo 'No matching loaded modules'\nelse\n    echo 'lsmod not available'\nfi\necho '--- I2C DEVICE NODES (existence only) ---'\nfound=0\nfor d in /dev/i2c-*; do\n    [ -e \"$d\" ] || continue\n    found=1\n    ls -l \"$d\"\ndone\n[ \"$found\" -eq 1 ] || echo 'No /dev/i2c device nodes found'\necho 'GPU-DIAG-LINUX-END'\n";
  const LINUX_DEEP = "# GPU DIAGNOSE – Linux I2C-Busübersicht: nur Dateisystem-Metadaten lesen\necho 'GPU-DIAG-I2C-BEGIN'\necho '--- I2C ADAPTER / NAME / SYSFS PARENT ---'\nn=0\nfor p in /sys/bus/i2c/devices/i2c-*/name; do\n  [ -r \"$p\" ] || continue\n  n=$((n+1))\n  printf 'I2C_BUS: %s | NAME: ' \"$(basename \"$(dirname \"$p\")\")\"\n  cat \"$p\"\n  printf 'PARENT: '\n  readlink -f \"$(dirname \"$p\")\"\ndone\n[ \"$n\" -gt 0 ] || echo 'No I2C bus metadata visible'\necho '--- GPU KERNEL DRIVER BINDING ---'\nfor d in /sys/class/drm/card[0-9]/device /sys/class/drm/card[0-9][0-9]/device; do\n  [ -d \"$d\" ] || continue\n  printf 'GPU_PCI_PATH: '\n  readlink -f \"$d\"\n  printf 'GPU_DRIVER: '\n  if [ -L \"$d/driver\" ]; then basename \"$(readlink -f \"$d/driver\")\"; else echo 'not bound'; fi\ndone\necho 'GPU-DIAG-I2C-END'\n";
  const OPENRGB_CHECK = "command -v openrgb >/dev/null 2>&1 && openrgb --version || echo 'OpenRGB ist nicht installiert oder nicht startbar'";
  const OPENRGB_INSTALL = "sudo apt update\nsudo apt install openrgb";
  const OPENRGB_LIST = "echo 'GPU-DIAG-OPENRGB-BEGIN'\nopenrgb --list-devices 2>&1\necho 'GPU-DIAG-OPENRGB-END'";
  const LINUX_ACCESS = [
    "echo 'GPU-DIAG-ACCESS-BEGIN'",
    "printf 'OPENRGB_VERSION: '; openrgb --version 2>&1 | head -n 4",
    "printf 'KERNEL: '; uname -r",
    "printf 'USER_GROUPS: '; id -nG",
    "printf 'I2C_DEV_MODULE: '; if lsmod | grep -q '^i2c_dev '; then echo loaded; else echo not_loaded; fi",
    "for n in 9 3 4 0; do",
    "  p=/dev/i2c-$n",
    "  if [ -e \"$p\" ]; then",
    "    printf 'I2C_BUS_%s: ' \"$n\"; stat -c '%A %U:%G %n' \"$p\"",
    "    if [ -r \"$p\" ]; then echo \"I2C_READ_$n: yes\"; else echo \"I2C_READ_$n: no\"; fi",
    "    if [ -w \"$p\" ]; then echo \"I2C_WRITE_PERMISSION_$n: yes\"; else echo \"I2C_WRITE_PERMISSION_$n: no\"; fi",
    "  else echo \"I2C_BUS_$n: not_present\"; fi",
    "done",
    "echo 'GPU-DIAG-ACCESS-END'"
  ].join("\n");
  const LINUX_OPEN_TEST = "echo 'GPU-DIAG-I2C-OPEN-BEGIN'\nid\nstat -c 'I2C9_MODE: %A %a %U:%G %n' /dev/i2c-9 2>&1\npython3 - <<'PY'\nimport os\np = '/dev/i2c-9'\ntry:\n    fd = os.open(p, os.O_RDONLY | getattr(os, 'O_NONBLOCK', 0))\nexcept OSError as e:\n    print('I2C9_OPEN: FAIL (' + str(e.errno) + ': ' + str(e.strerror) + ')')\nelse:\n    os.close(fd)\n    print('I2C9_OPEN: SUCCESS (opened read-only; no I2C transfer)')\nPY\necho 'GPU-DIAG-I2C-OPEN-END'";
  const OPENRGB11 = "echo 'GPU-DIAG-OPENRGB11-BEGIN'\nAPP=\"\"\nfor f in \"$HOME\"/Downloads/OpenRGB_1.1*x86_64*.AppImage \"$HOME\"/Downloads/OpenRGB_1.1*.AppImage; do\n  if [ -f \"$f\" ]; then APP=\"$f\"; break; fi\ndone\nif [ -z \"$APP\" ]; then\n  echo 'OPENRGB11_STATUS: FILE_NOT_FOUND (1.1 AppImage in Downloads ablegen)'\nelse\n  echo \"OPENRGB11_FILE: $(basename \"$APP\")\"\n  if chmod u+x \"$APP\"; then\n    echo '--- OPENRGB 1.1 VERSION ---'\n    \"$APP\" --version 2>&1\n    echo '--- OPENRGB 1.1 DEVICES ---'\n    \"$APP\" --list-devices 2>&1\n  else\n    echo 'OPENRGB11_STATUS: NOT_EXECUTABLE'\n  fi\nfi\necho 'GPU-DIAG-OPENRGB11-END'";
  const OPENRGB11_FUSE_FREE = "echo 'GPU-DIAG-OPENRGB11-BEGIN'\nAPP=\"\"\nfor f in \"$HOME\"/Downloads/OpenRGB_1.1*x86_64*.AppImage \"$HOME\"/Downloads/OpenRGB_1.1*.AppImage; do\n  if [ -f \"$f\" ]; then APP=\"$f\"; break; fi\ndone\nif [ -z \"$APP\" ]; then\n  echo 'OPENRGB11_STATUS: FILE_NOT_FOUND'\nelse\n  echo \"OPENRGB11_FILE: $(basename \"$APP\")\"\n  WORK=\"$(mktemp -d /tmp/gpu-openrgb11.XXXXXX)\"\n  if [ -z \"$WORK\" ] || [ ! -d \"$WORK\" ]; then\n    echo 'OPENRGB11_STATUS: TEMP_DIR_FAILED'\n  elif (cd \"$WORK\" && \"$APP\" --appimage-extract >/dev/null 2>&1 && test -x squashfs-root/AppRun); then\n    echo 'OPENRGB11_STATUS: EXTRACT_OK'\n    echo '--- OPENRGB 1.1 VERSION ---'\n    \"$WORK/squashfs-root/AppRun\" --version 2>&1\n    echo '--- OPENRGB 1.1 DEVICES ---'\n    \"$WORK/squashfs-root/AppRun\" --list-devices 2>&1\n    echo \"OPENRGB11_LIST_EXIT: $?\"\n  else\n    echo 'OPENRGB11_STATUS: EXTRACT_FAILED'\n    echo 'AppImage konnte nicht extrahiert werden. FUSE-Kompatibilitaets-Paket als Alternative verwenden.'\n  fi\nfi\necho 'GPU-DIAG-OPENRGB11-END'";
  const OPENRGB_FUSE_PACKAGE = "sudo apt update && sudo apt install libfuse2t64";
  const OPENRGB_FIX_OPENGL = "echo 'GPU-DIAG-OPENRGB11-BEGIN'\necho 'OPENRGB11_FIX: libOpenGL.so.0 via libopengl0'\nif sudo apt install libopengl0; then\n  echo 'OPENRGB11_PACKAGE: INSTALLED_OR_PRESENT'\n  RUN=\"\"\n  for f in /tmp/gpu-openrgb11.*/squashfs-root/AppRun; do\n    if [ -x \"$f\" ]; then RUN=\"$f\"; break; fi\n  done\n  if [ -z \"$RUN\" ]; then\n    echo 'OPENRGB11_STATUS: EXTRACTED_DIR_NOT_FOUND'\n    echo 'Zuerst AppImage FUSE-frei entpacken (vorherigen Befehl auf der Seite).'\n  else\n    echo \"OPENRGB11_FILE: $RUN\"\n    echo '--- OPENRGB 1.1 VERSION ---'\n    \"$RUN\" --version 2>&1\n    VR=$?\n    if [ \"$VR\" -ne 0 ]; then\n      echo 'OPENRGB11_STATUS: RUNTIME_ERROR'\n      echo \"OPENRGB11_VERSION_EXIT: $VR\"\n      echo '--- Fehlende Bibliotheken laut dynamischem Linker ---'\n      ldd \"$(dirname \"$RUN\")/usr/bin/OpenRGB\" 2>&1 | grep 'not found' || true\n    else\n      echo 'OPENRGB11_STATUS: DEPENDENCIES_OK'\n      echo '--- OPENRGB 1.1 DEVICES ---'\n      \"$RUN\" --list-devices 2>&1\n      echo \"OPENRGB11_LIST_EXIT: $?\"\n    fi\n  fi\nelse\n  echo 'OPENRGB11_STATUS: PACKAGE_INSTALL_FAILED'\nfi\necho 'GPU-DIAG-OPENRGB11-END'";
  const OPENRGB_DETAILED = "{\necho 'GPU-DIAG-OPENRGB-VERBOSE-BEGIN'\nRUN=\"\"\nfor f in /tmp/gpu-openrgb11.*/squashfs-root/AppRun; do\n  if [ -x \"$f\" ]; then RUN=\"$f\"; break; fi\ndone\nif [ -z \"$RUN\" ]; then\n  APP=\"\"\n  for f in \"$HOME\"/Downloads/OpenRGB_1.1*x86_64*.AppImage \"$HOME\"/Downloads/OpenRGB_1.1*.AppImage; do\n    if [ -f \"$f\" ]; then APP=\"$f\"; break; fi\n  done\n  if [ -z \"$APP\" ]; then\n    echo 'OPENRGB_VERBOSE_ERROR: DOWNLOAD_NOT_FOUND'\n    echo 'Das OpenRGB 1.1 AppImage fehlt in Downloads. Auf der Webseite erneut herunterladen.'\n  else\n    echo \"OPENRGB_VERBOSE_SOURCE: $(basename \"$APP\")\"\n    WORK=\"$(mktemp -d /tmp/gpu-openrgb11.XXXXXX)\"\n    if [ -n \"$WORK\" ] && [ -d \"$WORK\" ] && chmod u+x \"$APP\" && (cd \"$WORK\" && \"$APP\" --appimage-extract >/dev/null 2>&1); then\n      RUN=\"$WORK/squashfs-root/AppRun\"\n      echo 'OPENRGB_VERBOSE_EXTRACTION: SUCCESS'\n      if [ ! -x \"$RUN\" ]; then RUN=\"\"; echo 'OPENRGB_VERBOSE_ERROR: APPRUN_MISSING'; fi\n    else\n      echo 'OPENRGB_VERBOSE_ERROR: EXTRACTION_FAILED'\n    fi\n  fi\nfi\nif [ -n \"$RUN\" ]; then\n  echo \"OPENRGB_VERBOSE_APP: $RUN\"\n  if ! ldconfig -p 2>/dev/null | grep -q 'libOpenGL.so.0'; then\n    echo 'OPENRGB_VERBOSE_DEPENDENCY: libOpenGL.so.0 fehlt; installiere libopengl0 aus Ubuntu-Repositories'\n    if ! sudo apt install -y libopengl0; then\n      echo 'OPENRGB_VERBOSE_ERROR: LIBOPENGL_INSTALL_FAILED'\n      RUN=\"\"\n    fi\n  fi\nfi\nif [ -n \"$RUN\" ]; then\n  echo '--- OPENRGB 1.1 VERSION ---'\n  \"$RUN\" --version 2>&1\n  VEXIT=$?\n  echo \"OPENRGB_VERBOSE_VERSION_EXIT: $VEXIT\"\n  if [ \"$VEXIT\" -eq 0 ]; then\n    echo '--- OPENRGB 1.1 DEVICE DETECTION / VERBOSE ---'\n    \"$RUN\" --loglevel 6 --list-devices 2>&1\n    echo \"OPENRGB_VERBOSE_EXIT: $?\"\n  else\n    echo 'OPENRGB_VERBOSE_ERROR: START_FAILED'\n    ldd \"$(dirname \"$RUN\")/usr/bin/OpenRGB\" 2>&1 | grep 'not found' || true\n  fi\nfi\necho 'GPU-DIAG-OPENRGB-VERBOSE-END'\n} 2>&1 | tee \"$HOME/Downloads/gpu-openrgb-verbose.log\"\necho 'Log: ~/Downloads/gpu-openrgb-verbose.log'";
  const cmds = {
    windows: WINDOWS,
    linux: LINUX,
    linuxDeep: LINUX_DEEP,
    openrgbCheck: OPENRGB_CHECK,
    openrgbInstall: OPENRGB_INSTALL,
    openrgbList: OPENRGB_LIST,
    linuxAccess: LINUX_ACCESS,
    linuxOpenTest: LINUX_OPEN_TEST,
    openrgb11: OPENRGB11,
    openrgb11FuseFree: OPENRGB11_FUSE_FREE,
    openrgbFusePackage: OPENRGB_FUSE_PACKAGE,
    openrgbFixOpenGL: OPENRGB_FIX_OPENGL,
    openrgbDetailed: OPENRGB_DETAILED,
    nitroPy: "py .\\tools\\nitroglow_probe.py read",
    nitroExe: ".\\NitroGlowFix.exe --read"
  };
  const $ = id => document.getElementById(id);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const tracked = ["coldBootLed","postColdTriXX","openrgbDetailedOutput","cableInspection","cableCrossTest","openrgb11Output","linuxOpenTestOutput","windowsOutput","nitroOutput","linuxOutput","openrgbOutput","linuxCable","linuxBootLed","linuxOpenRgb","linuxRgbControl","notes","osResult","externalResult","bootFlash","linuxStatus"];
  const state = {tasks:{}, fields:{}, lastWindows:null, lastNitro:null, lastLinux:null, lastOpenRgb:null,lastLinuxAccess:null,lastLinuxOpenTest:null,lastOpenRgb11:null,lastOpenrgbDetailed:null,lastColdBoot:null};
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
        state.lastWindows=saved.lastWindows||null;state.lastNitro=saved.lastNitro||null;state.lastLinux=saved.lastLinux||null;state.lastOpenRgb=saved.lastOpenRgb||null;state.lastLinuxAccess=saved.lastLinuxAccess||null;state.lastLinuxOpenTest=saved.lastLinuxOpenTest||null;state.lastOpenRgb11=saved.lastOpenRgb11||null;state.lastOpenrgbDetailed=saved.lastOpenrgbDetailed||null;state.lastColdBoot=saved.lastColdBoot||null;
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
    const base=t.match(/GPU-DIAG-LINUX-BEGIN\s*([\s\S]*?)\s*GPU-DIAG-LINUX-END/i);
    const bus=t.match(/GPU-DIAG-I2C-BEGIN\s*([\s\S]*?)\s*GPU-DIAG-I2C-END/i);
    const combined=(base?.[1]||"")+"\n"+(bus?.[1]||"");
    const gpu=/\bRX\s*7900\s*XTX\b|\[1002:744c\]|device=0x744c/i.test(combined);
    const amd=/Kernel driver in use:\s*amdgpu|driver=amdgpu|GPU_DRIVER:\s*amdgpu|^\s*amdgpu\s+\d+/im.test(combined);
    const i2cNodes=/\/dev\/i2c-\d+/.test(combined);
    const i2cBuses=/I2C_BUS:\s*i2c-\d+/i.test(combined);
    const amdI2c=/I2C_BUS:[^\r\n]*(?:AMD|AMDGPU|GPU|Radeon)/i.test(combined);
    const kernel=base?.[1].match(/KERNEL:\s*([^\r\n]+)/i)?.[1]?.trim()||"nicht erkannt";
    const lines=[];
    if(!base)lines.push("Achtung: Basisdatenblock fehlt oder ist nicht vollständig. Bitte den Abschnitt zwischen GPU-DIAG-LINUX-BEGIN und GPU-DIAG-LINUX-END einfügen.");
    else{
      lines.push("Kernel: "+kernel);
      lines.push("RX 7900 XTX anhand PCI-ID/Name gefunden: "+(gpu?"JA":"NICHT EIND. / NEIN"));
      lines.push("AMD-Kernelmodul/Bindung amdgpu: "+(amd?"NACHGEWIESEN":"NICHT NACHGEWIESEN"));
      lines.push("I²C-Gerätedateien: "+(i2cNodes?"SICHTBAR":"NICHT NACHGEWIESEN"));
    }
    lines.push("GPU-Buszuordnung (zweiter Block): "+(bus?(i2cBuses?"I²C-Busnamen sichtbar":"Keine I²C-Busnamen gefunden"):"NOCH NICHT IMPORTIERT"));
    if(bus)lines.push("Busnamen mit AMD/GPU-Bezug: "+(amdI2c?"JA":"NICHT EIND. / NEIN"));
    lines.push("");
    if(gpu&&amd) lines.push("Zwischenergebnis: Linux erkennt den Grafikprozessor und bindet amdgpu ein. Das beweist NICHT, dass der Nitro-Glow-Controller per I²C erreichbar ist.");
    else if(!base)lines.push("Die Ausgabe ist unvollständig, daher noch keine belastbare Linux-Erkennung.");
    else lines.push("GPU- oder Treibererkennung unvollständig. Ursache zuerst dort klären; kein RGB-Hardwaredefekt daraus ableiten.");
    if(!i2cNodes)lines.push("Fehlende /dev/i2c-Knoten können durch fehlende Berechtigung oder nicht geladenen i2c-dev-Treiber entstehen – kein Defektbeweis.");
    lines.push("RGB-Farbtest und tatsächliches LED-Verhalten separat unter Schritt 05 erfassen.");
    state.lastLinux={ok:!!base&&gpu&&amd,at:new Date().toISOString(),found:gpu,amdgpu:amd,i2c:i2cNodes,bus:!!bus,amdI2c,kernel};
    outcome($("linuxResult"),base&&gpu&&amd?"good":"warn",lines.join("\n"));
    $("linuxFacts").hidden=false;
    $("linuxFactGpu").textContent=gpu?"Erkannt":"Nicht belegt";
    $("linuxFactDriver").textContent=amd?"Gebunden":"Nicht belegt";
    $("linuxFactI2c").textContent=i2cNodes||i2cBuses?"Sichtbar":"Nicht belegt";
    $("linuxFactComplete").textContent=base?(bus?"Beide Blöcke":"Basisblock"):"Unvollständig";
    persist();
    updateKernelGate();
  }
  function kernelStatus(text){
    const m=String(text||"").match(/^\s*KERNEL:\s*(\d+)\.(\d+)/im);
    if(!m)return {supported:false,known:false,version:"?"};
    const major=Number(m[1]),minor=Number(m[2]);
    return {supported:major>6||(major===6&&minor>=15),known:true,version:major+"."+minor};
  }
  function updateKernelGate(){
    const status=kernelStatus($("linuxOutput").value);
    const el=$("linuxKernelGate");
    if(!el)return;
    el.classList.toggle("green",status.known&&status.supported);
    el.classList.toggle("amber",status.known&&!status.supported);
    el.textContent=!status.known?"Kernel noch nicht erfasst. Zuerst Basisprüfung auswerten.":
      status.supported?"Kernel "+status.version+": grundsätzlich neu genug für die ab 6.15 erweiterte amdgpu-I²C-Unterstützung. Keine Garantie für RGB-Erkennung.":
      "Kernel "+status.version+": vor 6.15. Fehlende GPU-I²C-Busse können hier am Kernel liegen.";
  }
  function parseOpenRgb11(){
    const raw=$("openrgb11Output").value.trim();
    if(!raw){outcome($("openrgb11Result"),"warn","Noch keine Ausgabe eingefügt.");return;}
    const m=raw.match(/GPU-DIAG-OPENRGB11-BEGIN\s*([\s\S]*?)\s*GPU-DIAG-OPENRGB11-END/i);
    if(!m){outcome($("openrgb11Result"),"warn","Unvollständige Ausgabe: BEGIN und END fehlen.");return;}
    const body=m[1];
    const file=body.match(/OPENRGB11_FILE:\s*([^\r\n]+)/i)?.[1]||"nicht erkannt";
    const status=body.match(/OPENRGB11_STATUS:\s*([A-Z_]+)/i)?.[1]||"UNKNOWN";
    const runtimeError=/libfuse\.so\.2|AppImages require FUSE|dlopen\(\): error loading libfuse|libOpenGL\.so\.0|error while loading shared libraries|cannot open shared object file/i.test(body);
    const lines=body.split(/\r?\n/).map(x=>x.trim());
    const devices=lines.filter(x=>/^\d+\s*:\s*\S/.test(x));
    const sapphire=devices.filter(x=>/\bsapphire\b|\bnitro\s*glow\b/i.test(x));
    const gpu=sapphire.length>0;
    const detectionStarted=/--- OPENRGB 1\.1 DEVICES ---/i.test(body);
    const usableListing=detectionStarted&&!runtimeError&&/OPENRGB11_STATUS:\s*DEPENDENCIES_OK|OPENRGB11_STATUS:\s*EXTRACT_OK/i.test(body);
    const listExit=body.match(/OPENRGB11_LIST_EXIT:\s*(\d+)/i)?.[1];
    const result=[
      "AppImage: "+file,
      "Entpack-Status: "+status,
      "OpenRGB-1.1-Geräteliste: "+(detectionStarted?"gestartet":"nicht bestätigt"),
      "Gefundene RGB-Geräte: "+devices.length,
      "Eigenständiger Sapphire-/Nitro-Glow-Eintrag: "+(gpu?"JA":"NICHT GEFUNDEN"),
      ""
    ];
    let report="not-tested";
    if(status==="FILE_NOT_FOUND"){
      result.push("Die Datei liegt nicht im Ubuntu-Downloads-Ordner. Bitte den vorhandenen Download prüfen.");
    }else if(status==="EXTRACT_FAILED"||status==="TEMP_DIR_FAILED"){
      result.push("Das Entpacken ohne FUSE ist fehlgeschlagen. Die Seite bietet alternativ libfuse2t64 für die Ubuntu-Live-Sitzung an.");
    }else if(status==="PACKAGE_INSTALL_FAILED"){
      result.push("libopengl0 konnte nicht installiert werden. Bitte den Paketmanagerfehler zeigen; keine weiteren Pakete auf Verdacht installieren.");
    }else if(status==="EXTRACTED_DIR_NOT_FOUND"){
      result.push("Die zuvor entpackte AppImage-Datei liegt nicht mehr unter /tmp. Den FUSE-freien Extraktionsbefehl auf dieser Seite erneut ausführen.");
    }else if(status==="RUNTIME_ERROR"){
      result.push("OpenRGB 1.1 kann noch nicht starten. Bitte die ausgegebenen fehlenden Bibliotheken zeigen; kein GPU-Testergebnis.");
    }else if(runtimeError){
      result.push("OpenRGB 1.1 konnte wegen fehlender Systembibliotheken nicht starten. Die Geräteerkennung wurde NICHT durchgeführt. Den neuen libOpenGL0-Reparaturbefehl ganz oben ausführen.");
    }else if(gpu){
      report="recognized";
      result.push("OpenRGB 1.1 listet die Sapphire als eigenes RGB-Gerät. Nächster Schritt wäre ein kontrollierter LED-Farbtest; das Listing allein bestätigt noch keine funktionierenden LEDs.");
    }else if(usableListing&&devices.length){
      report="missing";
      result.push("OpenRGB 1.1 listet andere RGB-Geräte, aber keinen separaten Sapphire-Controller. Das ist KEIN Beweis für einen Hardwaredefekt, da die Software-Unterstützung unvollständig sein kann.");
    }else if(usableListing){
      result.push("Geräteerkennung gestartet, aber keine brauchbare Geräteliste erfasst. Bitte die Fehlermeldungen zeigen, bevor ein Hardwareurteil gefällt wird.");
    }else{
      result.push("Noch kein verwertbarer OpenRGB-1.1-Test. Bitte den FUSE-freien Startversuch durchführen.");
    }
    if(listExit!==undefined)result.push("OpenRGB-Exitcode: "+listExit);
    state.lastOpenRgb11={at:new Date().toISOString(),file,devices:devices.length,sapphire:gpu,status,report,runtimeError};
    if(report!=="not-tested"){
      $("linuxOpenRgb").value=gpu?"detected":"missing";
      state.fields.linuxOpenRgb=$("linuxOpenRgb").value;
    }
    outcome($("openrgb11Result"),gpu?"good":"warn",result.join("\n"));
    persist();
  }
  function parseLinuxOpenTest(){
    const raw=$("linuxOpenTestOutput").value.trim();
    if(!raw){outcome($("linuxOpenTestResult"),"warn","Noch keine Ausgabe eingefügt.");return;}
    const match=raw.match(/GPU-DIAG-I2C-OPEN-BEGIN\s*([\s\S]*?)\s*GPU-DIAG-I2C-OPEN-END/i);
    if(!match){outcome($("linuxOpenTestResult"),"warn","Unvollständig: Bitte BEGIN und END mitkopieren.");return;}
    const t=match[1];
    const open=t.match(/I2C9_OPEN:\s*(SUCCESS|FAIL)[^\r\n]*/i);
    const stat=t.match(/I2C9_MODE:\s*([^\r\n]*)/i)?.[1]||"nicht lesbar";
    if(!open){outcome($("linuxOpenTestResult"),"warn","Kein I2C9_OPEN-Ergebnis gefunden. Bitte komplette Ausgabe zeigen.");return;}
    const ok=/SUCCESS/i.test(open[1]);
    const result=ok?"Öffnen erfolgreich":"Öffnen fehlgeschlagen";
    const message=[
      "Bus: /dev/i2c-9",
      "Geräteinformation: "+stat,
      "Ergebnis: "+open[0],
      "",
      ok?
        "Der Bus lässt sich durch den normalen Benutzer tatsächlich lesend öffnen. Das bestätigt noch KEINE Kommunikation mit dem Sapphire-RGB-Controller. Die Ursache kann bei OpenRGB, dessen Geräteunterstützung oder der Controller-Kommunikation liegen.":
        "Der Bus kann von diesem Benutzer nicht geöffnet werden. Die Fehlerursache (z. B. fehlende Berechtigung, Gerät blockiert oder andere OS-Ursache) muss vor einem RGB-Hardwareurteil geklärt werden.",
      "Die Prüfung hat keine I²C-Kommandos oder LED-Register gelesen oder geschrieben."
    ].join("\n");
    state.lastLinuxOpenTest={at:new Date().toISOString(),result,details:open[0]};
    outcome($("linuxOpenTestResult"),ok?"good":"warn",message);
    persist();
  }
  function parseOpenRgb(){
    const text=$("openrgbOutput").value.trim();
    if(!text){outcome($("openrgbResult"),"warn","Noch keine OpenRGB-Ausgabe eingefügt.");return;}
    const section=text.match(/GPU-DIAG-OPENRGB-BEGIN\s*([\s\S]*?)\s*GPU-DIAG-OPENRGB-END/i);
    const body=section?section[1]:text;
    const lines=body.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    // Only numbered device list lines count as a positive RGB device detection.
    const devices=lines.filter(x=>/^\d+\s*:\s*\S/.test(x));
    const gpu=devices.filter(x=>/\bsapphire\b.*(\bnitro\b|\b7900\b|\bradeon\b)|\bnitro\s*glow\b/i.test(x));
    const motherboard=devices.filter(x=>/MSI|B650|motherboard/i.test(x));
    const errors=lines.filter(x=>/permission denied|failed to (read|access|initialize)|no such file|not found|command not found|error:/i.test(x));
    const msgs=[
      "OpenRGB aufgezählte Geräte: "+devices.length,
      "Eigenständiger Sapphire/Nitro-Glow-Eintrag: "+(gpu.length?"JA":"NEIN / NICHT NACHGEWIESEN"),
      "MSI-/Mainboard-Eintrag: "+(motherboard.length?"JA":"NEIN / NICHT NACHGEWIESEN")
    ];
    if(gpu.length)msgs.push("Sapphire-Gerät: "+gpu.join(" | "));
    if(errors.length)msgs.push("Auffällige Meldungen (Auszug): "+errors.slice(0,3).join(" | "));
    msgs.push("");
    if(gpu.length)msgs.push("Der Controller wurde von OpenRGB als Gerät gelistet. Ein tatsächlicher RGB-Farbwechsel ist noch separat zu prüfen. Erst ein erfolgreicher Farbwechsel bestätigt den Steuerweg.");
    else if(errors.length)msgs.push("Sapphire wurde nicht gelistet, und OpenRGB meldet mögliche Zugriffs-/Identifikationsfehler. Das bekannte Sapphire-Modellproblem und die I²C-Berechtigungen prüfen – kein Hardwaredefekt-Nachweis.");
    else if(motherboard.length)msgs.push("Nur Mainboard-RGB erkannt. Das bedeutet NICHT, dass die GPU-RGB-Steuerung funktioniert. Fehlender GPU-Eintrag ist noch kein Hardwaredefekt-Beweis.");
    else msgs.push("Keine eindeutige GPU-Controller-Erkennung. OpenRGB-Version, Kernel und Zugriffsrechte weiter prüfen.");
    state.lastOpenRgb={at:new Date().toISOString(),gpu:!!gpu.length,motherboard:!!motherboard.length,errors:errors.length,devices:devices.length};
    if(gpu.length){$("linuxOpenRgb").value="detected";}
    else if(devices.length){$("linuxOpenRgb").value="missing";}
    else if(errors.length){$("linuxOpenRgb").value="error";}
    else {$("linuxOpenRgb").value="missing";}
    state.fields.linuxOpenRgb=$("linuxOpenRgb").value;
    outcome($("openrgbResult"),gpu.length?"good":"warn",msgs.join("\n"));
    persist();
  }
  function parseOpenrgbDetailed(){
    const raw=$("openrgbDetailedOutput").value.trim();
    if(!raw){outcome($("openrgbDetailedResult"),"warn","Noch kein ausführliches Geräteprotokoll eingefügt.");return;}
    const match=raw.match(/GPU-DIAG-OPENRGB-VERBOSE-BEGIN\s*([\s\S]*?)\s*GPU-DIAG-OPENRGB-VERBOSE-END/i);
    if(!match){outcome($("openrgbDetailedResult"),"warn","Bitte das vollständige Log inklusive BEGIN- und END-Markierung einfügen.");return;}
    const body=match[1];
    const error=body.match(/OPENRGB_VERBOSE_ERROR:\s*([A-Z_]+)/i)?.[1]||null;
    const noApp=error==="DOWNLOAD_NOT_FOUND";
    const ran=/--- OPENRGB 1\.1 DEVICE DETECTION \/ VERBOSE ---/i.test(body);
    const gpuIdentity=/Device\s+1002:744C[\s\S]{0,200}?1DA2:E471|1002:744C/i.test(body);
    const adapters=(body.match(/Registering I2C interface:[^\r\n]+/gi)||[]);
    const matching=adapters.filter(x=>/1002:744C|1DA2:E471/i.test(x));
    const numbered=body.split(/\r?\n/).map(x=>x.trim()).filter(x=>/^\d+\s*:\s*\S/.test(x));
    const sapphire=numbered.filter(x=>/\bsapphire\b|\bnitro\s*glow\b/i.test(x));
    const errors=(body.match(/\[i2c_smbus_linux\][^\r\n]+|Permission denied[^\r\n]*|Failed to (read|detect|open)[^\r\n]*/gi)||[]);
    const exit=body.match(/OPENRGB_VERBOSE_EXIT:\s*(-?\d+)/i)?.[1]||"unbekannt";
    const summary=[
      "OpenRGB-Start: "+(noApp?"AppImage nicht im Downloads-Ordner":error?"Fehler: "+error:ran?"Geräteerkennung ausgeführt":"nur Teilprotokoll erhalten"),
      "OpenRGB-Exitcode: "+exit,
      "Sapphire-PCI-ID 1002:744C im Erkennungslog: "+(gpuIdentity?"JA":"nicht nachgewiesen"),
      "I²C-Adapter-Registrierungen insgesamt: "+adapters.length,
      "Davon mit Sapphire-PCI-ID: "+matching.length,
      "Eigenständiges Nitro-Glow-Gerät aufgelistet: "+(sapphire.length?"JA":"NEIN"),
      "Auffällige I²C-Meldungen: "+errors.length,
      ""
    ];
    if(noApp)summary.push("Das AppImage fehlt in Downloads, möglicherweise nach einem Ubuntu-Neustart. Bitte die offizielle OpenRGB-1.1-AppImage-Datei erneut herunterladen.");
    else if(error)summary.push("Das OpenRGB-Protokoll konnte wegen "+error+" nicht vollständig erstellt werden. Die Sapphire wurde nicht geprüft; bitte die vollständige Fehlermeldung zeigen.");
    else if(!ran)summary.push("Es ist keine abgeschlossene OpenRGB-Geräteerkennung erkennbar. Bitte vollständige Ausgabe zeigen.");
    else if(sapphire.length)summary.push("OpenRGB meldet jetzt ein eigenes Sapphire/Nitro-Glow-Gerät. Ein tatsächlicher Farbwechsel wurde noch nicht geprüft.");
    else if(ran&&gpuIdentity)summary.push("WICHTIG: OpenRGB erkennt den PCI-/I²C-Adapter der Sapphire, führt aber kein eigenständiges Nitro-Glow-RGB-Gerät in der Liste. PCI-Erkennung allein bedeutet NICHT, dass der RGB-Controller antwortet.");
    else if(ran)summary.push("Keine eindeutige Zuordnung der Sapphire-I²C-Adapter im OpenRGB-Log. Das kann ein Software-/Erkennungsproblem sein und ist noch kein Hardwaredefekt-Beweis.");
    if(errors.length)summary.push("Erste Warnung: "+errors[0]);
    summary.push("Kein automatischer Controller-Reset; wir vermeiden direkte I²C-Registerschreibversuche.");
    state.lastOpenrgbDetailed={at:new Date().toISOString(),adapterDetected:ran&&gpuIdentity,adapterCount:matching.length,nitroDevice:ran&&!!sapphire.length,errors:errors.length,exit,ran,error};
    outcome($("openrgbDetailedResult"),sapphire.length?"good":"warn",summary.join("\n"));
    persist();
  }
  function assessColdBoot(){
    const boot=$("coldBootLed").value, trixx=$("postColdTriXX").value;
    const msgs=[];
    let type="warn";
    if(boot==="on"||trixx==="works"){
      type="good";
      msgs.push("Nach dem längeren stromlosen Zustand ist die interne Sapphire-Beleuchtung wieder funktionsfähig. Das spricht gegen einen dauerhaft ausgefallenen LED-Stromkreis.");
    }else if(boot==="off"&&trixx==="noeffect"){
      msgs.push("Auch ohne externes ARGB-Kabel, nach längerem stromlosen Zustand und mit TriXX interner Steuerung bleiben die LEDs dunkel. Eine GPU-seitige RGB-Störung oder persistent falsche Controller-Einstellung ist wahrscheinlicher. Kein Beweis, welcher Bauteil defekt ist.");
    }else if(boot==="flash"){
      msgs.push("Ein kurzer Blitz zeigt einen zeitweiligen LED-Stromzustand, beweist aber keine funktionierende Farbsteuerung oder MCU-Kommunikation.");
    }else{
      msgs.push("Der Kaltstart ist noch nicht vollständig dokumentiert. Die interne TriXX-Prüfung bleibt getrennt vom externen MSI-ARGB-Modus.");
    }
    msgs.push("Ein Mainboard-CMOS-/BIOS-Reset ist keine bestätigte Methode, den separaten Sapphire-LED-Controller zurückzusetzen. Keine GPU-BIOS- oder EEPROM-Änderung auf Verdacht.");
    state.lastColdBoot={at:new Date().toISOString(),boot,trixx,assessment:msgs.join(" ")};
    outcome($("coldBootResult"),type,msgs.join("\n\n"));
    persist();
  }
  function assessCable(){
    const c=$("cableInspection").value, t=$("cableCrossTest").value;
    let status="warn",msgs=[];
    if(t==="working"){
      status="good";
      msgs.push("Die Beleuchtung reagiert mit einem geprüft kompatiblen Kabel wieder. Das ursprüngliche Kabel oder dessen Kontaktierung ist damit die wahrscheinlichste Fehlerursache.");
    }else if(t==="dark"){
      msgs.push("Auch mit geprüft kompatiblem Kabel bleibt die Sapphire dunkel. Da sowohl interne TriXX-Steuerung als auch externe Steuerung erfolglos waren, ist eine GPU-seitige RGB-Störung wahrscheinlicher. Endgültige Bestätigung durch fachgerechte Reparaturdiagnose bzw. Test in anderem PC.");
      msgs.push("Empfehlung: Händler/Sapphire mit dokumentiertem Fehlerbild kontaktieren; ohne weitere I²C- oder Firmware-Experimente.");
    }else if(t==="notavailable"){
      msgs.push("Das Verbindungskabel wurde noch nicht als Fehlerquelle ausgeschlossen. Das fehlende OpenRGB-Gerät und Linux-Buszugriff allein erlauben keine Hardwaredefekt-Diagnose.");
      msgs.push("Nächste sinnvolle Maßnahme: ein nachweislich passendes Kabel beschaffen oder das vorhandene stromlos fachgerecht prüfen lassen.");
    }else{
      msgs.push("Bislang kein Ersatzkabel-Gegencheck. Als Nächstes Anschluss und Verbindungskabel prüfen.");
    }
    if(c==="damaged")msgs.push("Beim Kabel/Anschluss wurde ein möglicher physischer Schaden gefunden. Nichts unter Spannung ausprobieren; Fotos anfertigen und erst mit sicher passendem Ersatz bzw. Reparaturbetrieb fortfahren.");
    else if(c==="looks_ok")msgs.push("Unauffällige Sichtprüfung schließt eine gebrochene Leitung oder schlechten Kontakt nicht aus.");
    else if(c==="inconclusive")msgs.push("Die Sichtprüfung reicht zur Bewertung noch nicht aus. Stecker-/Anschlussfotos oder fachgerechte Durchgangsprüfung helfen.");
    msgs.push("Sicherheit: Nur 5V-ARGB, kein 12V-RGB. Umstecken ausschließlich stromlos; kein beliebiges Kabel mit unbekannter Pinbelegung.");
    outcome($("cableResult"),status,msgs.join("\n\n"));
    state.lastCable={at:new Date().toISOString(),inspection:c,crossTest:t,assessment:msgs.join(" ")};
    persist();
  }
  function assessLinux(){
    const c=$("linuxCable").value,boot=$("linuxBootLed").value,rgb=$("linuxRgbControl").value,orb=$("linuxOpenRgb").value;
    let cls="warn",msg=[];
    if(rgb==="works"&&c==="internal"){
      cls="good";
      msg.push("STARKER BEFUND: Die GPU-LEDs lassen sich ohne externes ARGB-Kabel unter Ubuntu steuern. Die LED-Elektronik funktioniert grundsätzlich; ein Windows-/Treiber-/Softwarekonflikt wird wahrscheinlicher.");
    } else if(rgb==="works"&&c==="external"){
      cls="good";msg.push("Die Leisten reagieren unter Linux mit externem ARGB-Kabel. Damit ist der externe Lichtweg grundsätzlich funktionstüchtig; die interne Sapphire-Controllersteuerung bleibt separat ungeklärt.");
    } else if(rgb==="works"){
      cls="good";msg.push("Die Beleuchtung lässt sich unter Linux ändern. Die Aussagekraft für den internen Sapphire-Controller hängt davon ab, ob das externe ARGB-Kabel verbunden war.");
    } else if(rgb==="dark"){
      msg.push("Die LEDs sind unter Linux ebenfalls dunkel. Damit ist Windows allein nicht bestätigt. Ein Controller- oder Kabelproblem wird möglicher, ABER fehlende Linux-RGB-Unterstützung verhindert einen sicheren Hardwarebefund.");
    } else if(rgb==="partial"){
      msg.push("Die Beleuchtung reagiert nur sporadisch oder teilweise. Das ist ein relevanter Hinweis auf ein Steuerungs- oder Kontaktproblem, aber noch keine eindeutige Fehlerlokalisation.");
    } else{
      msg.push("Bisher liegt nur ein Hardware-/Erkennungstest vor. Ohne tatsächlichen Farbwechseltest ist der RGB-Controller unter Linux nicht verifiziert.");
    }
    if(orb==="missing")msg.push("OpenRGB hat die GPU nicht gelistet. Dieses Modell weist bekannte OpenRGB-Erkennungsprobleme auf – daraus keinen Defekt ableiten.");
    if(orb==="error")msg.push("OpenRGB startete nicht oder hatte Berechtigungsprobleme. Kein Aussagewert zur Funktion des Sapphire-Controllers.");
    if(boot==="brief")msg.push("Kurzes Aufleuchten beim Start beobachtet. Das bestätigt nur einen vorübergehenden LED-Zustand, keine funktionierende Controllerkommunikation.");
    if(c==="unknown")msg.push("Bitte die Position des externen ARGB-Kabels dokumentieren; sonst können interne und externe Steuerung verwechselt werden.");
    if(state.lastLinux?.found===false)msg.push("GPU-Erkennung in der Basisdiagnose war unvollständig; bitte Ausgabe zuerst überprüfen.");
    $("linuxStatus").value=rgb==="works"?"works":rgb==="dark"?"dark":orb==="missing"?"unrecognized":"notdone";
    state.fields.linuxStatus=$("linuxStatus").value;
    outcome($("linuxAssessment"),cls,msg.join("\n\n"));persist();
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
      "Linux GPU-ARGB-Kabel: "+v("linuxCable"),
      "Linux LED beim Booten: "+v("linuxBootLed"),
      "Linux OpenRGB: "+v("linuxOpenRgb"),
      "Linux tatsächliche Steuerung: "+v("linuxRgbControl"),
      "Sapphire-Kabel-Sichtprüfung: "+v("cableInspection"),
      "Sapphire-Kabel-Gegencheck: "+v("cableCrossTest"),
      "Sapphire-Kaltstart ohne externes ARGB: "+v("coldBootLed"),
      "TriXX nach Kaltstart: "+v("postColdTriXX"),
      "OpenRGB ausführliche GPU-PCI-Erkennung: "+(state.lastOpenrgbDetailed?(state.lastOpenrgbDetailed.adapterDetected?"JA":"nicht nachgewiesen"):"nicht geprüft"),
      "OpenRGB eigenständige Sapphire-Erkennung: "+(state.lastOpenRgb?(state.lastOpenRgb.gpu?"JA":"NEIN"):"nicht geprüft"),
      "OpenRGB 1.1 Vergleich: "+(state.lastOpenRgb11?(state.lastOpenRgb11.sapphire?"Sapphire erkannt":"Sapphire nicht erkannt / Startproblem"):"nicht durchgeführt"),
      "Linux GPU-OEM-Bus i2c-9 lesbar: "+(state.lastLinuxAccess?.i2c9AccessKnown?(state.lastLinuxAccess.i2c9Readable?"JA":"NEIN"):"nicht geprüft"),
      "Linux GPU-OEM-Bus i2c-9 Open-only: "+(state.lastLinuxOpenTest?state.lastLinuxOpenTest.result:"noch nicht getestet"),
      "Linux OpenRGB-Version: "+(state.lastLinuxAccess?.version||"unbekannt"),
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
      state.lastLinux?"RX 7900 XTX erkannt: "+state.lastLinux.found+"; amdgpu-Zuordnung: "+state.lastLinux.amdgpu+"; I²C-Knoten vorhanden: "+state.lastLinux.i2c+"; Bus-Metadaten vorhanden: "+state.lastLinux.bus+"; Kernel: "+(state.lastLinux.kernel||"?"):"Noch kein Linux-Scan importiert.",
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
  $("linuxOpenTestCode").textContent=LINUX_OPEN_TEST;
  Object.entries(cmds).forEach(([id,command])=>{
    const el=$(id+"Code");if(el)el.textContent=command;
  });
  $$("[data-copy]").forEach(b=>b.addEventListener("click",()=>copy(cmds[b.dataset.copy]||"")));
  $$("[data-page]").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));
  $$("[data-goto]").forEach(b=>b.addEventListener("click",()=>page(b.dataset.goto)));
  $$("[data-task]").forEach(b=>b.addEventListener("change",e=>{state.tasks[e.target.dataset.task]=e.target.checked;persist();progress();}));
  tracked.forEach(id=>$(id).addEventListener("input",storeField));
  $("importOpenrgbDetailed").addEventListener("click",()=>$("openrgbDetailedFile").click());
  $("openrgbDetailedFile").addEventListener("change",async e=>{
    const file=e.target.files?.[0];if(!file)return;
    if(file.size>1024*1024){toast("Maximal 1 MB je Diagnoseprotokoll");e.target.value="";return;}
    try{
      const value=await file.text();
      $("openrgbDetailedOutput").value=value;
      state.fields.openrgbDetailedOutput=value;
      persist();toast("OpenRGB-Protokoll lokal geladen");
      parseOpenrgbDetailed();
    }catch(err){toast("Protokoll konnte nicht eingelesen werden");}
    e.target.value="";
  });
  $("parseOpenrgbDetailed").addEventListener("click",parseOpenrgbDetailed);
  $("clearOpenrgbDetailed").addEventListener("click",()=>{
    $("openrgbDetailedOutput").value="";state.fields.openrgbDetailedOutput="";state.lastOpenrgbDetailed=null;
    persist();outcome($("openrgbDetailedResult"),"","Ausgabe gelöscht.");
  });
  $("assessColdBoot").addEventListener("click",assessColdBoot);
  $("assessCable").addEventListener("click",assessCable);
  $("parseWindows").addEventListener("click",parseWindows);
  $("parseNitro").addEventListener("click",parseNitro);
  $("parseLinux").addEventListener("click",parseLinux);
  $("parseOpenRgb11").addEventListener("click",parseOpenRgb11);
  $("clearOpenRgb11").addEventListener("click",()=>{
    $("openrgb11Output").value="";state.fields.openrgb11Output="";state.lastOpenRgb11=null;
    persist();outcome($("openrgb11Result"),"","Ausgabe gelöscht.");
  });
  $("parseLinuxOpenTest").addEventListener("click",parseLinuxOpenTest);
  $("clearLinuxOpenTest").addEventListener("click",()=>{
    $("linuxOpenTestOutput").value="";state.fields.linuxOpenTestOutput="";
    state.lastLinuxOpenTest=null;persist();outcome($("linuxOpenTestResult"),"","Ausgabe gelöscht.");
  });
  $("parseOpenRgb").addEventListener("click",parseOpenRgb);
  $("clearOpenRgb").addEventListener("click",()=>{
    $("openrgbOutput").value="";state.fields.openrgbOutput="";
    state.lastOpenRgb=null;persist();outcome($("openrgbResult"),"","Ausgabe gelöscht.");
  });
  $("linuxOutput").addEventListener("input",updateKernelGate);
    $("assessLinux").addEventListener("click",assessLinux);
  $("linuxToReport").addEventListener("click",()=>page("report"));
  $("importLinuxLabel").addEventListener("click",()=>$("linuxFile").click());
  $("linuxFile").addEventListener("change",async e=>{
    const file=e.target.files?.[0];if(!file)return;
    if(file.size>1024*1024){toast("Maximal 1 MB für Diagnoseprotokolle");return;}
    try{$("linuxOutput").value=await file.text();state.fields.linuxOutput=$("linuxOutput").value;persist();toast("Datei nur lokal eingelesen");}
    catch(err){toast("Datei konnte nicht gelesen werden");}e.target.value="";
  });
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
  hydrate();renderPast();updateKernelGate();page(decodeURIComponent(location.hash.slice(1))||"overview");
  window.addEventListener("hashchange",()=>page(location.hash.slice(1)));
})();