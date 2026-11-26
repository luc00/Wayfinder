import type { WayfinderProject } from '../types/wayfinder';

export function createDemoProject(): WayfinderProject {
  const now = '2026-11-26T09:00:00.000Z';
  return {
    id: 'demo-local-loom',
    name: 'Clone Locale di Loom',
    vagueIdea:
      'Voglio creare una web app locale stile Loom per registrare schermo + webcam in Picture-in-Picture e scaricare subito il video senza caricare nulla su server esterni.',
    grillingNotes: '',
    destination:
      'Una web app single-page browser-only che permette di registrare schermo, audio di sistema/microfono e overlay webcam circolare, salvare i chunk localmente su IndexedDB contro i crash e scaricare il video finale.',
    decisions: [
      'Stack frontend: React + TypeScript + Vite senza backend o database remoto.',
      'Persistenza temporanea durante la registrazione tramite IndexedDB per evitare perdita dati.',
      'Privacy totale: nessun upload cloud, elaborazione 100% client-side.',
      'Formato prioritario di registrazione nativo browser: WebM (VP9 + Opus) con fallback VP8.',
    ],
    fog: [
      'Qual è il comportamento migliore su Safari/WebKit per getDisplayMedia + AudioContext?',
      'Conviene integrare ffmpeg.wasm per esportare in MP4 o offrire WebM nativo + conversione opzionale?',
    ],
    outOfScope: [
      'Autenticazione utenti, link pubblici condivisibili o hosting video su cloud.',
      'Editor video multi-traccia con timeline avanzata o effetti AI sullo sfondo.',
      'App desktop Electron/Tauri nella prima versione.',
    ],
    tickets: [
      {
        id: 1,
        title: 'Verifica API cattura schermo, audio e compositing Canvas',
        description:
          'Analizzare compatibilità getDisplayMedia, getUserMedia e merge di stream audio tramite Web Audio API per evitare desincronizzazione tra microfono e audio di sistema.',
        category: 'RESEARCH',
        status: 'FRONTIER',
        dependencies: [],
        output: '',
        createdAt: now,
      },
      {
        id: 2,
        title: 'Definizione limiti durata, formati export e UX errori permessi',
        description:
          'Chiarire i vincoli di memoria per registrazioni > 15 minuti, decidere se offrire solo WebM o transcodifica MP4 opzionale e definire i messaggi di fallback quando i permessi vengono negati.',
        category: 'GRILLING',
        status: 'FRONTIER',
        dependencies: [],
        output: '',
        createdAt: now,
      },
      {
        id: 3,
        title: 'Prototipo MediaRecorder + overlay webcam Picture-in-Picture',
        description:
          'Implementare un prototipo minimale con Canvas 2D offscreen o video compositor che unisca lo stream schermo con la bolla circolare webcam spostabile prima dell’encoding.',
        category: 'PROTOTYPE',
        status: 'BLOCKED',
        dependencies: [1],
        output: '',
        createdAt: now,
      },
      {
        id: 4,
        title: 'Motore chunk IndexedDB e download file finale',
        description:
          'Scrivere il servizio di salvataggio incrementale ogni 2 secondi su IndexedDB con recupero automatico di sessioni interrotte e assemblaggio Blob finale per il download.',
        category: 'TASK',
        status: 'BLOCKED',
        dependencies: [1, 3],
        output: '',
        createdAt: now,
      },
      {
        id: 5,
        title: 'Barra controlli registrazione e scorciatoie da tastiera',
        description:
          'Creare la barra compatta per Pausa, Riprendi, Stop, Mute microfono, timer live e shortcut da tastiera con feedback visivo accessibile.',
        category: 'TASK',
        status: 'BLOCKED',
        dependencies: [3],
        output: '',
        createdAt: now,
      },
    ],
    activeTicketId: null,
    updatedAt: now,
  };
}

export function createBlankProject(name: string): WayfinderProject {
  const trimmed = name.trim() || 'Nuovo Progetto';
  return {
    id: `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: trimmed,
    vagueIdea: '',
    grillingNotes: '',
    destination: '',
    decisions: [],
    fog: [],
    outOfScope: [],
    tickets: [],
    activeTicketId: null,
    updatedAt: new Date().toISOString(),
  };
}
