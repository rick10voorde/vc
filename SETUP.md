# VoChat Setup Guide - Lokaal Werkend Krijgen

Dit is de guide om VoChat lokaal werkend te krijgen voor jezelf.

## Wat je nodig hebt

### API Keys (gratis tiers beschikbaar)

1. **Deepgram API Key** (Speech-to-Text)
   - Ga naar: https://console.deepgram.com/
   - Maak een account (krijg $200 gratis credit)
   - Maak een API key aan
   - Kopieer de key

2. **Anthropic API Key** (AI Refinement met Claude)
   - Ga naar: https://console.anthropic.com/
   - Maak een account
   - Ga naar API Keys
   - Maak een nieuwe key aan
   - Kopieer de key

## Setup Stappen

### Stap 1: API Keys toevoegen

Open het bestand `apps/web/.env.local` en vervang de placeholders:

```env
NEXT_PUBLIC_SUPABASE_URL=https://eflhqeofkenyczflqwkz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Voeg jouw keys hier in:
DEEPGRAM_API_KEY=your_actual_deepgram_api_key_here
ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here
```

### Stap 2: Web App Starten

Open een PowerShell terminal:

```powershell
cd C:\Users\rickt\OneDrive\Desktop\vochat.io\apps\web
pnpm dev
```

De web app draait nu op **http://localhost:3002**

### Stap 3: Account Aanmaken + Profielen

1. Open browser: **http://localhost:3002**
2. Klik op "Sign Up"
3. Maak account aan met je email + wachtwoord
4. Bevestig je email (check je inbox)
5. Log in
6. Ga naar "Profiles"
7. Maak een paar profielen:
   - **Generic** (default): professional, English
   - **Slack**: casual, bullets enabled
   - **Terminal**: technical, preserve code enabled
8. Zet één profiel als **default** (groene rand)

### Stap 4: Desktop App Starten

Open een **nieuwe** PowerShell terminal (houd de web app draaien!):

```powershell
cd C:\Users\rickt\OneDrive\Desktop\vochat.io\apps\desktop
pnpm tauri dev
```

Dit start de desktop app. De eerste keer kan het een paar minuten duren (Rust compile).

### Stap 5: Inloggen in Desktop App

1. De desktop app opent automatisch
2. Log in met hetzelfde account als in de web app
3. Je zou je profielen moeten zien verschijnen
4. Check de system tray - daar staat het VoChat icoon

## Hoe te gebruiken

### Dictatie Flow

1. **Activeer**: Druk en **hou** `Ctrl + Win + Space` vast
2. **Spreek**: Zeg wat je wilt typen (je ziet live transcript)
3. **Release**: Laat de toetsen los als je klaar bent
4. **Wacht**: De app refineert je tekst met AI
5. **Insert**: Klik "Insert" of druk `Ctrl + Enter`
6. **Plak**: De tekst zit in je clipboard - druk `Ctrl + V` om te plakken

### Shortcuts

- **Ctrl + Win + Space** (hold): Start dictation
- **Esc**: Sluit overlay
- **Ctrl + Enter**: Insert text
- **Discard**: Gooi transcript weg

## Troubleshooting

### "Failed to get STT token"
- Check of web app draait (http://localhost:3002)
- Check of DEEPGRAM_API_KEY correct is in .env.local
- Herstart web app na .env changes

### "Failed to refine text"
- Check of ANTHROPIC_API_KEY correct is in .env.local
- Check of je ingelogd bent
- Herstart web app

### "Please sign in first"
- Log in via de desktop app
- Check of je profielen ziet in de desktop app

### Desktop app build errors
- Zorg dat Visual Studio Build Tools geïnstalleerd zijn
- Run in PowerShell, NIET in Git Bash
- Check BUILD.md voor details

### Geen audio
- Check microphone permissions
- Kijk in browser console (F12) voor errors
- Check of je mic werkt in andere apps

## Wat werkt nu

✅ Speech-to-text (live transcript via Deepgram)
✅ AI refinement (polish text via Claude)
✅ Profielen (tone/language/formatting)
✅ Clipboard copy (tekst gaat naar clipboard)
✅ Session persistence (blijf ingelogd)
✅ Usage tracking (words per week)

## Wat nog niet werkt

❌ Auto paste (moet handmatig Ctrl+V doen)
❌ Stripe billing (is optioneel voor lokaal gebruik)
❌ App detection (gebruikt altijd default profiel)

## Next Steps

Als dit allemaal werkt, kunnen we:
1. Auto-paste toevoegen (keyboard simulation in Rust)
2. App detection (welke app is actief)
3. Production build maken (.exe file)
4. Stripe integreren als je het wilt delen

## Kosten (met gratis tiers)

- **Deepgram**: $200 gratis credit = ~166 uur audio
- **Anthropic**: $5 gratis credit = ~10.000 refinements
- **Supabase**: Gratis tier = 500MB database + 2GB bandwidth

Voor persoonlijk gebruik kom je maanden ver met de gratis tiers!
