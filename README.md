# GPU Diagnose · Sapphire NITRO+ RX 7900 XTX

Statisches GitHub-Pages-Dashboard zur Fehlersuche an einer Sapphire NITRO+ RX 7900 XTX mit ausgefallener RGB-Beleuchtung.

## Webseite veröffentlichen

1. Dieses Repository öffnen: Settings → Pages.
2. Build and deployment → Source: **Deploy from a branch**.
3. Branch **main**, Verzeichnis **/(root)** auswählen und speichern.
4. Sobald die Seite veröffentlicht ist: https://dennodhn.github.io/Diagnose/

Ohne Build-System; alle Dateien liegen direkt in main.

## Funktionen

- Kopierbarer Windows-11-PowerShell-Scan: Mainboard, BIOS, GPU-Erkennung und Displaytreiber; keine Änderungen am System.
- Lokale Analyse der ausgegebenen JSON-Daten.
- Links zu Sapphire TriXX, AMD, MSI, OpenRGB und dem externen Community-Projekt NitroGlowFix.
- Sicherer Lesemodus für NitroGlowFix und genaue Interpretation der Return-Codes.
- **Ubuntu Live Lab v1.1**: geführter F11-Boot, Try Ubuntu, zwei kopierbare Nur-Lese-Blöcke (PCI/DRM/amdgpu und I²C-Sysfs-Zuordnung), lokale TXT-/LOG-Dateiübernahme, visuelle GPU-/Kernel-/Bus-Statusanzeigen und Interpretation eines echten RGB-Farbtests.
- Linux-Check für den Unterschied zwischen internem GPU-RGB-Controller und externer Mainboard-ARGB-Synchronisierung.
- Detaillierte OpenRGB-Hinweise mit dokumentierter Einschränkung für Sapphire Nitro+ 7900 XTX.
- Checkliste, lokale Notizen und TXT/JSON-Diagnosebericht.
- Mobile-freundlich, ohne Tracking, ohne serverseitige Verarbeitung.

## Wesentliche Grenze

GitHub Pages kann keine PowerShell-Befehle ausführen, Treiber installieren oder direkt an GPU-I²C, Grafikkarten-RGB und Mainboard-Hardware senden. Die lesenden Befehle müssen nach Prüfung auf dem Kunden-PC selbst gestartet und die Ausgaben in die Webseite eingefügt werden.

Der Browser sendet keine Daten an Server. Nicht vertrauliche Texte werden zur Wiederherstellung einer Sitzung im lokalen Browser gespeichert und können über die Seite gelöscht werden. Beim Export die enthaltenen Daten vor dem Teilen prüfen.

## Sicherheit

- Kein automatisches Ausführen heruntergeladener Fremdprogramme.
- Kein Schreiben an Register, keine BIOS-/VBIOS-Änderungen, keine Treiberänderungen.
- Die eigenen Skripte in tools/ lesen ausschließlich Gerätedaten.
- Community-Projekt NitroGlowFix wird nur verlinkt; Quellcode vor Nutzung prüfen.
- Return-Code ret=-1 ist ein fehlgeschlagener Lesezugriff; der dann ausgegebene Registerwert val=0x00 ist **kein Beleg** für LED_count=0.
- Ein fehlender RGB-Controller unter Linux/OpenRGB ist **kein Beweis** für einen Hardwaredefekt.

## Ausgangslage – manuell aus der bisherigen Diagnose übertragen

- Sapphire NITRO+ RX 7900 XTX, PCI AMD 1002:744C, Sapphire Subsystem 1DA2:E471.
- MSI MPG B650 EDGE WIFI, Windows 11, beobachteter AMD Adrenalin 26.10.1.
- Beleuchtung mit TriXX sowie mit externer MSI-Mystic-Light-Steuerung dunkel.
- An JARGB_V2_2 funktionieren andere 5V-ARGB-LEDs, die GPU jedoch nicht.
- Gelegentlich kurzer gelber Lichtblitz beim Herunterfahren, insbesondere mit ARGB-Kabel.
- NitroGlowFix-Probe: AMD-Adapter erkannt, Register 0x10, 0x27, 0x3E jeweils ret=-1.
- Zeitlicher Zusammenhang mit einem Windows Update vom Kunden berichtet, aber bislang nicht belegt.

## Dateien

- index.html – Dashboard-Struktur
- styles.css – Gestaltung
- app.js – Navigation, Copy, lokale Auswertung und Export
- tools/windows-readonly.ps1 – Windows-Hardwareinventar
- tools/linux-readonly.sh – erweiterter Linux-Read-only-Scan (kein sudo, kein I²C-Scan)
- .nojekyll – statische Veröffentlichung

Alle Drittanbieter-Downloads verweisen auf die Originalhersteller beziehungsweise das jeweilige Open-Source-Projekt; keine Fremdsoftware wird in diesem Repository gebündelt.

## Ubuntu-Livetest V1.2 im Überblick

1. USB über F11 booten, **Ubuntu ausprobieren** (nicht installieren).
2. GitHub Pages im Ubuntu-Browser öffnen: https://dennodhn.github.io/Diagnose/#linux
3. Terminal mit Strg+Alt+T öffnen; zuerst **Terminalblock 1** (GPU, Kernel, Treiber, DRM) kopieren/einfügen.
4. Optional **Terminalblock 2** (I²C-Busnamen und Pfade) ausführen. Beide Blöcke lesen nur Systemmetadaten.
5. Die Ausgabe in die Webseite einfügen oder eine lokale .txt/.log-Datei laden und auswerten.
6. Unter **04B / OpenRGB** die Kernel-Eignung (6.15+) bewerten, prüfen ob OpenRGB installiert ist, bei Bedarf das offizielle Ubuntu-Paket in der Live-Sitzung installieren, und `openrgb --list-devices` zur kontrollierten Geräteerkennung verwenden.
7. OpenRGB-Geräteliste einfügen. Der Parser zählt nur die separate Sapphire-/Nitro-Glow-Erkennung, nicht bloß das MSI-Mainboard. Bei Fehlermeldungen zu I²C die lesende Gruppen-/Rechte-/Modulprüfung verwenden.
8. Separat die tatsächliche LED-Reaktion dokumentieren; bei angeschlossenem externen ARGB-Kabel kann das Ergebnis vom Mainboard stammen, nicht vom internen GPU-Controller.
9. Bericht lokal exportieren. Live-USB-Umgebungen speichern Daten normalerweise nicht dauerhaft.

**Keine** unkontrollierten I²C-Adressscans, i2cset/i2cdump, RGB-Registerschreibversuche, Firmware-Flashes oder Live-USB-Installationsschritte. Lesbare I²C-Geräteknoten belegen nicht automatisch einen ansprechbaren Sapphire-Nitro-Glow-Controller. Umgekehrt belegt fehlendes OpenRGB-Device keinen Controllerdefekt.

Quellen zur Live-Nutzung: https://ubuntu.com/desktop/docs/en/26.04/tutorial/try-ubuntu-desktop/ sowie zum modellbezogenen OpenRGB-Problem https://gitlab.com/CalcProgrammer1/OpenRGB/-/issues/3396 .

### Warum die neue OpenRGB-Stufe wichtig ist

Am Linux-Kernel 6.15 wurden AMD-GPU-I²C-Schnittstellen verbessert (kein garantierter RGB-Fix). Für die NITRO+ RX 7900 XTX sind von OpenRGB Probleme bei der Erkennung dokumentiert. Deshalb trennt die Oberfläche zwischen:

- PCI-Erkennung der Radeon (Grafiktreiber funktioniert),
- amdgpu-Modul und bereitgestellten /dev/i2c-Bussen (Grundvoraussetzung),
- tatsächlichem Eintrag als Sapphire Nitro-Glow-Gerät in OpenRGB,
- beobachtetem Farbwechsel an der GPU ohne externes ARGB-Kabel (starker Funktionsnachweis).

Alle Hardwarezugriffe durch OpenRGB werden explizit als optional markiert. Das bloße Listing kann Geräte sondieren; es ist nicht gleichzusetzen mit den nur lesenden Systembefehlen. Die Ubuntu-Paketinstallation per apt ist optional und verändert nur die laufende Live-Umgebung, sofern es sich um ein nicht-persistentes Live-System handelt. Es werden keine generischen I²C-Schreibbefehle bereitgestellt.

Quellen: https://gitlab.com/CalcProgrammer1/OpenRGB/-/issues/3396 · https://gitlab.com/CalcProgrammer1/OpenRGB/-/issues/1046 · https://packages.ubuntu.com/resolute/amd64/openrgb · https://openrgb.org/releases.html .

## Zwischenbefund Ubuntu Live-Test (18.11.2026)

Nach dem Ubuntu-Live-USB-Start: Radeon RX 7900 XTX PCI 1002:744C erkannt; amdgpu gebunden; GPU-I²C-Adapter i2c-3 bis i2c-11 inkl. OEM-Bus i2c-9 sichtbar. OpenRGB list-devices erkennt zwei Corsair-Dominator-RAM-Geräte und das MSI MPG B650 EDGE WIFI, **nicht** die Sapphire. Mehrfache Meldung `[i2c_smbus_linux] Failed to read i2c device PCI device ID`. Der gleiche Fehler ist für die Karte bereits im OpenRGB-Issue https://gitlab.com/CalcProgrammer1/OpenRGB/-/issues/3396 dokumentiert. Noch **kein** Beweis für einen defekten Sapphire-Controller. V1.2.2 zeigt daher oben einen *nur lesenden* Test für OpenRGB-Version und tatsächliche Dateisystem-Berechtigungen auf dem GPU-OEM-Bus `/dev/i2c-9`. Keine automatische Root-Ausführung.

## Ubuntu 18.11.2026 – Diagnose V1.2.3

OpenRGB 0.9+ (Git 20251009) erkennt 2× Corsair Dominator und MSI B650, nicht Sapphire. Mehrfach `[i2c_smbus_linux] Failed to read i2c device PCI device ID`. `stat` zeigt i2c-9 `root:root` mit Charaktergeräteberechtigungen, einfache Bash-`-r`-/`-w`-Tests melden dennoch ja; das ist widersprüchlich und darf nicht als gesicherter Buszugriff interpretiert werden. `i2c_dev` erscheint nicht in `lsmod`, was bei vorhandenen /dev/i2c-Devices kein eindeutiger Modulfehler ist. Die Seite zeigt nun einen gesonderten Python-`os.open`-Test ausschließlich für `/dev/i2c-9` mit `O_RDONLY`, ohne I²C-Transfers oder Registermanipulation. Erfolgreiches Öffnen ≠ erfolgreicher Zugriff auf Nitro-Glow-Controller.

## Ubuntu-Teststand 18.11.2026 – Version 1.2.4

`I2C9_OPEN: SUCCESS (opened read-only; no I2C transfer)` bestätigt das erfolgreiche Öffnen des Radeon-OEM-I2C-Devices als Benutzer ubuntu. Das beweist keine Antwort des Nitro-Glow-Controllers. Weitere Untersuchung zuerst mit aktuellem **OpenRGB 1.1 (16. Oktober 2026)**, da das installierte OpenRGB 0.9+ mit Git-Datum 20251009 wesentlich älter ist. Die Seite bietet den offiziellen OpenRGB-1.1-AppImage-Download (x86_64), einen kopierbaren Vergleichsbefehl und eine lokale Analyse an. Der Befehl setzt nur das Ausführungsbit der lokal heruntergeladenen AppImage-Datei, startet dann OpenRGB ohne sudo und listet Geräte. OpenRGBs standardmäßige Geräteerkennung kann Hardwarezugriffe auslösen und ist im Gegensatz zur I2C-Open-only-Prüfung nicht streng read-only. Vorheriges OpenRGB 0.9+ wird nicht ersetzt. Quelle: https://openrgb.org/releases.html .

## Ubuntu 26.04 – OpenRGB 1.1 AppImage ohne FUSE (18.11.2026)

Das erste AppImage-Startprotokoll zeigte mehrfach `dlopen(): error loading libfuse.so.2`; OpenRGB 1.1 war daher **nicht gestartet**, und es gab keinen neuen GPU-Erkennungsbefund. Mit Version 1.2.5 steht ein bevorzugter FUSE-freier Weg ganz oben auf dem Linux-Dashboard: Das bereits heruntergeladene OpenRGB-1.1-AppImage wird über die dokumentierte Option `--appimage-extract` in einen eindeutigen temporären Ordner unter `/tmp/gpu-openrgb11.*` extrahiert; dann wird `squashfs-root/AppRun` ohne sudo mit `--version` und `--list-devices` aufgerufen. Der Befehl installiert nichts, verändert keine Windows-Partition und führt selbst keine direkten I²C-Registeroperationen durch. Die normale OpenRGB-Geräteerkennung kann jedoch Hardware ansprechen. Als optionale Alternative steht das für Ubuntu 26.04 passende Paket `libfuse2t64` bereit. Der Ergebnisparser unterscheidet ausdrücklich Runtime-Fehler von tatsächlichen RGB-Ergebnissen. Quelle: https://docs.appimage.org/user-guide/troubleshooting/fuse.html .

## Ubuntu Live Test: OpenRGB 1.1 scheitert an libOpenGL.so.0 (18.11.2026)

Nach erfolgreichem Extrahieren (`OPENRGB11_STATUS: EXTRACT_OK`) meldete `squashfs-root/AppRun` für Version und Geräteliste `error while loading shared libraries: libOpenGL.so.0: cannot open shared object file`, Exit 127. Daher ist weiterhin kein Geräteerkennungstest mit OpenRGB 1.1 durchgeführt worden. Die Paketquelle Ubuntu 26.04 (resolute) bestätigt `libopengl0` als Anbieter von `/usr/lib/x86_64-linux-gnu/libOpenGL.so.0`: https://packages.ubuntu.com/resolute/libopengl0 . Version 1.2.6 zeigt deshalb oben einen kopierbaren Befehl, der gezielt `sudo apt install libopengl0` in der laufenden Live-Sitzung ausführt, anschließend die bereits in `/tmp` entpackte OpenRGB-1.1-AppImage-Version verwendet, Versionsstart prüft und nur dann Geräte listet. Läuft die Software noch nicht, werden Fehlermeldung und `ldd`-Hinweise angezeigt. Kein Schluss auf Grafikkarten-RGB-Defekt bei Bibliotheksfehlern.

## 18.11.2026 – Nächster Schritt nach Linux-Abschluss (Version 1.2.7)

OpenRGB 1.1 läuft nach `libopengl0` erfolgreich und liefert Exit 0. Es erkennt 2× Corsair-RAM und MSI MPG B650 EDGE WIFI, aber nicht die Sapphire RGB-Steuerung. Dies ist für sich kein Defektbeweis: Die an Mainboard-ARGB gekoppelten be quiet!-Lüfter erscheinen nicht zwingend einzeln; Sapphire-Nitro-Glow ist über OpenRGB nicht garantiert unterstützt. Mit TriXX intern und externer MSI-Steuerung waren die LEDs zuvor ebenfalls dunkel. Da der nachweislich funktionierende Mainboard-5V-ARGB-Header ausprobiert wurde, sind die noch nicht ausgeschlossenen Fehlerquellen vor allem das Sapphire-ARGB-Verbindungskabel, dessen Kontaktierung oder der GPU-seitige Anschluss/LED-Schaltkreis. Die Webseite priorisiert deshalb eine stromlose Sichtprüfung, ein als kompatibel bestätigtes Ersatzkabel oder eine fachgerechte Durchgangsmessung und erst danach eine erneute Hardwareprüfung bzw. Service. **Keine** unbekannten Kabelbelegungen, 12V-RGB, Hotplug oder Register-/VBIOS-Schreibversuche. Offizielle Sapphire-Quelle: https://www.sapphiretech.com/de-de/consumer/nitro-radeon-rx-7900-xtx-vaporx-24g-gddr6 .

## Nitro Glow: Erweiterter Linux- und Kaltstart-Test (Version 1.3.1, 18.11.2026)

TriXX ist nicht als native Linux-App für die Sapphire RX 7900 XTX verfügbar; Windows-Betrieb in Wine ist für Hardwarezugriffe/AMD ADL nicht zuverlässig. Die angeschlossenen be quiet!-ARGB-Lüfter und RAM-LEDs können bereits beim Einschalten einen eigenen gespeicherten LED-Modus zeigen. Das erlaubt keinen Schluss darauf, dass die Sapphire selbst zwangsweise vor dem OS starten muss. Bei Sapphire kann ein über TriXX eingestellter External-Source-Modus über Neustarts erhalten bleiben (Community-Erfahrungsbericht, nicht offizielle Reset-Dokumentation).

Linux-Lab v1.3.1 stellt oben einen gezielten, ausführlichen OpenRGB-1.1-Diagnosebefehl bereit. Die Geräteliste wird mit `--loglevel 6` ausgegeben und in der Live-Sitzung nach `~/Downloads/gpu-openrgb-verbose.log` geschrieben. Die Log-Datei kann im Browser lokal importiert und automatisch analysiert werden. Der Parser unterscheidet PCI-/I2C-Adapter-Registrierung `1002:744C / 1DA2:E471` strikt von tatsächlich erkanntem Sapphire/Nitro-Glow-RGB-Gerät. Die normale OpenRGB-Erkennung kann Hardware ansprechen; es werden keine zusätzlichen I²C-Registernamen oder Schreibbefehle verwendet.

Danach ist ein verlängerter, stromloser Kaltstart dokumentiert: Bei vom Stromnetz getrenntem PC Sapphire-ARGB-Kabel entfernen, 20 Minuten ohne Netzstrom, Start ohne externes ARGB-Signal beobachten und erst dann bei Bedarf bereits installiertes TriXX unter Windows erneut testen. Dieser Kaltstart ist **kein offiziell bestätigter Werksreset**, sondern nur eine risikoarme Abgrenzung. MSI LED_SW1 wirkt laut Handbuch auf Mainboard-LEDs, nicht nachweislich auf den internen Sapphire-LED-Controller. Mainboard-CMOS-Reset oder VBIOS-Switch/Flash sind keine belegten Nitro-Glow-Reparaturen.

Quellen: https://www.sapphiretech.com/de-de/software ; https://gitlab.com/CalcProgrammer1/OpenRGB/-/work_items/3396 ; https://gitlab.com/CalcProgrammer1/OpenRGB/-/work_items/4817 ; https://manuals.plus/msi/mpg-b650-edge-wifi-motherboard-manual ; https://rog-forum.asus.com/t5/armoury-crate/armoury-crate-brick-locked-sapphire-7900-xt-nitro-rgb-mcu-need/m-p/1146799/highlight/true .

## OpenRGB 1.1: Recovery nach /tmp-Verlust (18.11.2026, V1.3.2)

Bildschirmfoto vom ausführlichen Diagnoseversuch meldet `OPENRGB_VERBOSE_ERROR: APPIMAGE_NOT_FOUND_IN_TMP`; es wurde deshalb **kein** GPU-Scan durchgeführt. Das passiert bei geleertem /tmp, z.B. einem Neustart der Ubuntu-Live-Umgebung. Der Web-Kopierbefehl wurde auf eine robuste Version umgestellt: Wenn die extrahierte OpenRGB-AppImage-Anwendung nicht mehr da ist, wird die heruntergeladene offizielle OpenRGB-1.1-AppImage-Datei aus ~/Downloads bei Bedarf erneut nach `/tmp` extrahiert. Falls `libOpenGL.so.0` fehlt, kann der Befehl das offizielle Ubuntu-Paket `libopengl0` erneut installieren. Danach OpenRGB-Versionsstart und Diagnose `--loglevel 6 --list-devices`, Ausgabe nach ~/Downloads/gpu-openrgb-verbose.log, die im Web lokal importiert werden kann. Falls auch Downloads nach einem Neustart fehlen, wird der offizielle Download angezeigt. Kein VBIOS-Switch erforderlich, solange das ausführliche Protokoll noch nicht erfolgreich erstellt wurde. OpenRGB kann bei der normalen Erkennung Hardware abfragen. Quellen: https://docs.appimage.org/user-guide/troubleshooting/fuse.html ; https://openrgb.org/releases.html ; https://manpages.ubuntu.com/manpages/tenacious/man1/openrgb.1.html .
