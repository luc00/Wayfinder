import type { AIModelTarget, Ticket, WayfinderProject } from '../types/wayfinder';

export interface PromptPackage {
  prompt: string;
  estimatedTokens: number;
  includedDecisionsCount: number;
  totalDecisionsCount: number;
}

export const AI_MODEL_LINKS: Record<AIModelTarget, { label: string; url: string }> = {
  Gemini: { label: 'Apri Gemini', url: 'https://gemini.google.com/app' },
  ChatGPT: { label: 'Apri ChatGPT', url: 'https://chatgpt.com/' },
  Claude: { label: 'Apri Claude', url: 'https://claude.ai/new' },
  Grok: { label: 'Apri Grok', url: 'https://grok.com/' },
};

function getAiFormattingNote(targetAi: AIModelTarget): string {
  switch (targetAi) {
    case 'Claude':
      return 'Usa tag XML essenziali (<esito>, <fog>) o elenchi puntati secchi senza preamboli.';
    case 'Gemini':
      return 'Rispondi in Markdown strutturato e compatto con intestazioni brevi.';
    case 'ChatGPT':
      return 'Usa elenchi numerati concisi e blocchi di codice puliti senza testo superfluo.';
    case 'Grok':
      return 'Sii diretto, pragmatico e privo di convenevoli; vai subito ai fatti tecnici.';
  }
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function selectRelevantDecisions(
  decisions: string[],
  ticket: Ticket,
  includeAll: boolean
): string[] {
  if (includeAll || decisions.length <= 4) {
    return decisions;
  }

  const queryText = `${ticket.title} ${ticket.description}`.toLowerCase();
  const keywords = Array.from(
    new Set(
      queryText
        .split(/[^a-zàèéìòù0-9]+/i)
        .filter((w) => w.length >= 4)
    )
  );

  const scored = decisions.map((decision, index) => {
    const lower = decision.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 2;
    }
    // Always slightly favor foundational or most recent decisions
    if (index < 2) score += 1;
    if (index >= decisions.length - 2) score += 1;
    // Reference to direct dependencies boosts relevance
    for (const depId of ticket.dependencies) {
      if (lower.includes(`#${depId}`)) score += 4;
    }
    return { decision, score, index };
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored
    .slice(0, Math.min(5, decisions.length))
    .sort((a, b) => a.index - b.index)
    .map((item) => item.decision);
}

export function buildGrillingPrompt(vagueIdea: string, targetAi: AIModelTarget): string {
  const idea = vagueIdea.trim() || '[INSERISCI QUI LA TUA IDEA DI PROGETTO]';

  if (targetAi === 'Claude') {
    return `<ruolo>
Sei un Principal Architect che applica il metodo Wayfinder (anti-context-rot).
Il tuo unico obiettivo ora è intervistare l'utente in ampiezza (Breadth-First Grilling) PRIMA di scrivere qualsiasi codice o piano dettagliato.
</ruolo>

<idea_iniziale>
${idea}
</idea_iniziale>

<istruzioni>
1. Fammi esattamente 5-7 domande mirate "in ampiezza" su:
   - Risultato concreto atteso (Destination)
   - Vincoli tecnici, stack o piattaforma
   - Formato dell'output e utenti target
   - Cosa escludere esplicitamente nella prima versione (Out of Scope)
   - Rischi o punti oscuri critici (Fog)
2. NON proporre codice né architetture complete adesso.
3. ${getAiFormattingNote(targetAi)}
4. Dopo che avrò risposto, riassumi le risposte in esattamente 4 sezioni pronte da copiare in LLM-Attention-Degradation-Helper:
   Destination: ...
   Decisions: ...
   Fog: ...
   Out of Scope: ...
</istruzioni>`;
  }

  return `# RUOLO: Architetto Breadth-First (Metodo Wayfinder)
Non scrivere codice e non proporre piani dettagliati adesso. Il tuo obiettivo è chiarire i confini del progetto con una rapida intervista in ampiezza (Grilling).

## Idea Iniziale
${idea}

## Cosa devi fare ora
Fammi 5–7 domande essenziali e ad alto impatto per sbloccare questi 4 pilastri:
1. **Destination:** Qual è l'artefatto minimo funzionante che deve esistere alla fine?
2. **Decisions:** Quali vincoli di stack, dati, privacy o UX sono già fissi?
3. **Fog:** Quali incognite tecniche o di prodotto rischiano di far deragliare il lavoro?
4. **Out of Scope:** Cosa NON dobbiamo costruire adesso per evitare over-engineering?

## Stile risposta (${targetAi})
${getAiFormattingNote(targetAi)}
Alla fine del nostro scambio, produci un riepilogo formattato con le 4 intestazioni esatte: \`Destination:\`, \`Decisions:\`, \`Fog:\`, \`Out of Scope:\`.`;
}

export function buildMapCreationPrompt(
  project: WayfinderProject,
  targetAi: AIModelTarget
): string {
  const destination = project.destination.trim() || project.vagueIdea.trim() || 'Da definire';
  const decisionsList =
    project.decisions.length > 0
      ? project.decisions.map((d) => `- ${d}`).join('\n')
      : '- Nessuna decisione ancora fissata';
  const fogList =
    project.fog.length > 0
      ? project.fog.map((f) => `- ${f}`).join('\n')
      : '- Nessun punto oscuro segnalato';
  const outOfScopeList =
    project.outOfScope.length > 0
      ? project.outOfScope.map((o) => `- ${o}`).join('\n')
      : '- Nessuna esclusione esplicita';

  return `# GENERAZIONE MAPPA TICKET — WAYFINDER STUDIO (${targetAi})
Scomponi il progetto seguente in 5–8 micro-ticket autonomi, eseguibili ciascuno in una singola chat fresca (sotto il 15% di contesto) per evitare context rot.

## Pilastri del Progetto
**Destination:** ${destination}

**Decisions Taken (non ridiscutere):**
${decisionsList}

**Fog (incognite da chiarire):**
${fogList}

**Out of Scope (vietato includere):**
${outOfScopeList}

## Regole di Scomposizione
- Categorie ammesse: \`RESEARCH\` (verifica fattibilità/API), \`GRILLING\` (chiarire una Fog), \`PROTOTYPE\` (artefatto minimo testabile), \`TASK\` (implementazione specifica).
- Ogni ticket deve essere piccolo, atomico e avere dipendenze esplicite via \`id\` numerico.
- Metti prima i ticket \`RESEARCH\` o \`GRILLING\` senza dipendenze per sbloccare la \`FRONTIER\`.
- ${getAiFormattingNote(targetAi)}

## Formato Output OBBLIGATORIO
Restituisci SOLO un array JSON valido (senza testo extra prima o dopo) con questa struttura esatta:
\`\`\`json
[
  {
    "id": 1,
    "title": "Titolo breve e azionabile",
    "description": "Obiettivo specifico e criterio di completamento in 1-2 frasi.",
    "category": "RESEARCH",
    "dependencies": []
  },
  {
    "id": 2,
    "title": "Secondo ticket dipendente dal primo",
    "description": "Descrizione chiara del risultato atteso.",
    "category": "PROTOTYPE",
    "dependencies": [1]
  }
]
\`\`\``;
}

export function buildTicketSessionPrompt(
  project: WayfinderProject,
  ticket: Ticket,
  targetAi: AIModelTarget,
  includeAllDecisions = false
): PromptPackage {
  const relevantDecisions = selectRelevantDecisions(
    project.decisions,
    ticket,
    includeAllDecisions
  );

  const dependencyOutputs = ticket.dependencies
    .map((depId) => project.tickets.find((t) => t.id === depId))
    .filter((dep): dep is Ticket => Boolean(dep && dep.output.trim()));

  const destinationBlock =
    project.destination.trim() || project.vagueIdea.trim() || 'Non specificata';

  const decisionsBlock =
    relevantDecisions.length > 0
      ? relevantDecisions.map((d) => `- ${d}`).join('\n')
      : '- Nessuna decisione preliminare specifica';

  const outOfScopeBlock =
    project.outOfScope.length > 0
      ? project.outOfScope.map((o) => `- ${o}`).join('\n')
      : '- Evita over-engineering e funzionalità non richieste dal ticket.';

  const depsContextBlock =
    dependencyOutputs.length > 0
      ? `\n\n## Output dai Ticket Prerequisiti\n${dependencyOutputs
          .map((d) => `- **Ticket #${d.id} (${d.title}):** ${d.output.trim()}`)
          .join('\n')}`
      : '';

  const closingInstruction =
    'Alla fine della tua risposta, forniscimi un blocco riassuntivo compatto (max 10 righe) con: 1) Esito/Decisione presa, 2) Eventuali nuovi ticket o fog emersi, così che io possa aggiornare la mia mappa.';

  let prompt = '';

  if (targetAi === 'Claude') {
    prompt = `<contesto_wayfinder>
Stai operando in una chat fresca (Safe Zone < 15% contesto) su un singolo ticket autonomo.
Regole anti-overplanning: esegui SOLO questo ticket, non ridiscutere le decisioni già prese e non anticipare ticket futuri.
${getAiFormattingNote(targetAi)}
</contesto_wayfinder>

<destination>
${destinationBlock}
</destination>

<decisioni_rilevanti>
${decisionsBlock}
</decisioni_rilevanti>

<out_of_scope>
${outOfScopeBlock}
</out_of_scope>${
      dependencyOutputs.length > 0
        ? `\n\n<prerequisiti_completati>\n${dependencyOutputs
            .map((d) => `- Ticket #${d.id} (${d.title}): ${d.output.trim()}`)
            .join('\n')}\n</prerequisiti_completati>`
        : ''
    }

<ticket_attivo id="${ticket.id}" categoria="${ticket.category}">
Titolo: ${ticket.title}
Obiettivo specifico: ${ticket.description || ticket.title}
</ticket_attivo>

<chiusura_obbligatoria>
${closingInstruction}
</chiusura_obbligatoria>`;
  } else {
    prompt = `# SESSIONE SINGOLO TICKET — WAYFINDER STUDIO (${targetAi})
**Regole Anti-Overplanning:** Stai lavorando in una chat fresca su UN SOLO ticket. Concentrati esclusivamente sull'obiettivo di questo ticket, non ridiscutere le decisioni confermate e ignora tutto ciò che è Out of Scope.
${getAiFormattingNote(targetAi)}

## Destination Essenziale
${destinationBlock}

## Decisioni Rilevanti (Vincoli Attivi)
${decisionsBlock}

## Out of Scope (Da Ignorare)
${outOfScopeBlock}${depsContextBlock}

## Ticket #${ticket.id} [${ticket.category}] — ${ticket.title}
${ticket.description || ticket.title}

## Istruzione Finale Obbligatoria
${closingInstruction}`;
  }

  return {
    prompt,
    estimatedTokens: estimateTokens(prompt),
    includedDecisionsCount: relevantDecisions.length,
    totalDecisionsCount: project.decisions.length,
  };
}
