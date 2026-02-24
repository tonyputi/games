# Flappy Sofia - Piano di Sviluppo

Clone di Flappy Bird personalizzabile con la foto di Sofia come sprite.

## Requisiti
- [x] Mobile-friendly (touch + tastiera)
- [x] Effetti sonori (jump, score, game over)
- [x] Stile grafico classico Flappy Bird
- [x] Sprite personalizzabile con foto
- [x] Suoni personalizzabili (con default via Web Audio API)
- [x] Difficoltà progressiva automatica
- [x] Deploy su Cloudflare Pages (solo file statici)

## Stack Tecnologico
- **Game Engine**: Vanilla JS + Canvas API
- **UI/Settings**: Alpine.js (gestione menu, upload, toggle)
- **Styling**: TailwindCSS (via Play CDN, no build step)
- **Audio default**: Web Audio API (zero file esterni)
- **Storage**: localStorage (immagini e suoni come data URL)
- **Deploy**: Cloudflare Pages (static files)

---

## Step di Sviluppo

### 1. Setup Progetto
- [x] Creare struttura file base (index.html, style.css, game.js)
- [x] Setup canvas HTML5 responsive
- [x] Configurare viewport per mobile

### 2. Game Loop Base
- [x] Implementare game loop con requestAnimationFrame
- [x] Gestire stati del gioco (menu, playing, game over)
- [ ] Implementare sistema di pausa

### 3. Sprite del Personaggio (Sofia)
- [x] Creare classe Bird/Player
- [x] Implementare placeholder circolare (per test)
- [x] Aggiungere supporto per immagine custom
- [x] Implementare fisica: gravità e salto
- [x] Aggiungere rotazione basata sulla velocità

### 4. Ostacoli (Tubi)
- [x] Creare classe Pipe
- [x] Generare tubi con gap casuale
- [x] Implementare movimento e riciclo tubi
- [x] Disegnare tubi stile classico (verdi con bordo)

### 5. Sfondo e Ambiente
- [x] Sfondo cielo con gradiente
- [x] Nuvole che scorrono (parallax)
- [x] Terreno/base che scorre

### 6. Collisioni e Punteggio
- [x] Rilevamento collisioni (tubi + terreno)
- [x] Sistema punteggio
- [x] Salvare high score in localStorage

### 7. Controlli
- [x] Input tastiera (spazio/freccia su)
- [x] Input mouse (click)
- [x] Input touch (tap) per mobile

### 8. Interfaccia Utente
- [x] Schermata titolo con istruzioni
- [x] Display punteggio durante il gioco
- [x] Schermata game over con punteggio e high score
- [x] Pulsante restart

### 9. Audio
- [x] Effetto sonoro salto (flap)
- [x] Effetto sonoro punto
- [x] Effetto sonoro collisione/game over
- [x] Controllo volume/mute

### 10. Personalizzazione Sprite
- [x] Input per caricare immagine custom
- [x] Ridimensionamento automatico immagine
- [x] Ritaglio circolare della faccia
- [x] Salvare preferenza in localStorage

### 11. Personalizzazione Suoni
- [x] Upload suono salto custom
- [x] Upload suono punto custom
- [x] Upload suono game over custom
- [x] Test suoni dalle impostazioni
- [x] Salvare suoni in localStorage

### 12. Polish Finale
- [x] Animazione flap delle ali (se si usa placeholder)
- [x] Effetti particellari (stelline al punto, polvere+piume alla morte, sbuffi al salto)
- [x] Difficoltà progressiva (velocità aumenta, gap diminuisce)
- [ ] Test su vari dispositivi

---

## Struttura File

```
flappy-sofia/
├── index.html      # Pagina principale
├── style.css       # Stili e responsive design
├── game.js         # Logica del gioco
├── assets/
│   ├── sounds/     # Effetti sonori
│   └── images/     # Sprite e sfondi
└── README.md       # Istruzioni per l'uso
```

---

## Note
- La foto di Sofia verrà aggiunta successivamente dall'utente
- Il gioco userà un placeholder (cerchio colorato) fino al caricamento dell'immagine
- High score e immagine custom salvati nel browser (localStorage)
