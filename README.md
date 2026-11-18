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
