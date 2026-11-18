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
- Ubuntu Live-USB-Anleitung und lesender Linux-Hardware-Scan.
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
- tools/linux-readonly.sh – Linux-Read-only-Scan
- .nojekyll – statische Veröffentlichung

Alle Drittanbieter-Downloads verweisen auf die Originalhersteller beziehungsweise das jeweilige Open-Source-Projekt; keine Fremdsoftware wird in diesem Repository gebündelt.
