# Flappy Sofia 🐤

Un clone di Flappy Bird personalizzabile con la foto di tua figlia (o chi vuoi tu)!

## Caratteristiche

- 🎮 **Gameplay classico** stile Flappy Bird
- 📱 **Mobile-friendly** - funziona con touch, click e tastiera
- 🖼️ **Sprite personalizzabile** - carica una foto come personaggio
- 🔊 **Suoni personalizzabili** - carica i tuoi suoni o usa quelli default
- ✨ **Effetti particellari** - stelline, piume e sbuffi
- 📈 **Difficoltà progressiva** - il gioco diventa più difficile man mano
- 💾 **Salvataggio locale** - high score, foto e suoni salvati nel browser
- 🚀 **Zero dipendenze** - tutto via CDN, nessun build step

## Come Giocare

- **Desktop**: Premi `Spazio` o `Freccia Su` per saltare
- **Mobile**: Tap sullo schermo per saltare
- Evita i tubi e il terreno!
- Ogni tubo superato = 1 punto

## Personalizzazione

Clicca su **⚙️ Impostazioni** per:
- Caricare una foto come sprite del personaggio
- Caricare suoni personalizzati (salto, punto, game over)
- Testare i suoni
- Resettare tutto

## Stack Tecnologico

- **Game Engine**: Vanilla JavaScript + Canvas API
- **UI**: Alpine.js
- **Styling**: TailwindCSS (Play CDN)
- **Audio**: Web Audio API (suoni generati, zero file esterni)
- **Storage**: localStorage

## Struttura File

```
flappy-sofia/
├── index.html    # Pagina principale con UI Alpine.js
├── game.js       # Engine del gioco
├── style.css     # Stili aggiuntivi
└── README.md     # Questo file
```

---

## Deploy su Cloudflare Pages

### Metodo 1: Upload Diretto (Più Veloce)

1. Vai su [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Nel menu laterale clicca **Workers & Pages**
3. Clicca **Create application** → **Pages** → **Upload assets**
4. Dai un nome al progetto (es. `flappy-sofia`)
5. Trascina i 3 file (`index.html`, `game.js`, `style.css`) nella zona di upload
6. Clicca **Deploy site**
7. Fatto! Il tuo gioco sarà disponibile su `https://flappy-sofia.pages.dev`

### Metodo 2: Collegamento a Git (Per Aggiornamenti Automatici)

1. Carica i file su un repository GitHub/GitLab

```bash
git init
git add index.html game.js style.css README.md
git commit -m "Initial commit - Flappy Sofia"
git remote add origin https://github.com/TUO-USERNAME/flappy-sofia.git
git push -u origin main
```

2. Vai su [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
4. Autorizza Cloudflare ad accedere al tuo repository
5. Seleziona il repository `flappy-sofia`
6. Configura il build:
   - **Build command**: lascia vuoto (non serve)
   - **Build output directory**: `/` oppure lascia vuoto
7. Clicca **Save and Deploy**

Ora ogni push su `main` aggiornerà automaticamente il sito!

### Dominio Personalizzato (Opzionale)

1. Vai nelle impostazioni del progetto su Cloudflare Pages
2. **Custom domains** → **Set up a custom domain**
3. Inserisci il tuo dominio (es. `flappy.tuodominio.com`)
4. Segui le istruzioni per configurare il DNS

---

## Sviluppo Locale

Per testare in locale:

```bash
# Con Python
python3 -m http.server 8080

# Con Node.js (se hai npx)
npx serve .

# Con PHP
php -S localhost:8080
```

Poi apri `http://localhost:8080` nel browser.

---

## Licenza

Fatto con ❤️ per Sofia. Usa come vuoi!
