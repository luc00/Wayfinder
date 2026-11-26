import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoProject } from '../data/demoProject';
import {
  calculateSafeZoneStats,
  claimTicketInProject,
  completeTicketInProject,
  parseAiSummaryBlock,
  parseGrillingNotes,
  parseTicketsJson,
  recomputeTicketStatuses,
  releaseTicketInProject,
} from './mapLogic';
import {
  buildGrillingPrompt,
  buildMapCreationPrompt,
  buildTicketSessionPrompt,
} from './promptBuilder';

test('demo project starts with valid Frontier and Blocked tickets', () => {
  const demo = createDemoProject();
  const stats = calculateSafeZoneStats(demo);
  assert.equal(stats.totalTickets, 5);
  assert.equal(stats.frontierTickets, 2);
  assert.equal(stats.blockedTickets, 3);
  assert.equal(stats.doneTickets, 0);
  assert.equal(stats.fogCount, 2);
});

test('claiming and releasing a ticket updates status properly', () => {
  const demo = createDemoProject();
  const claimed = claimTicketInProject(demo, 1);
  assert.equal(claimed.activeTicketId, 1);
  assert.equal(claimed.tickets.find((t) => t.id === 1)?.status, 'CLAIMED');

  // Claiming another Frontier ticket releases the previous one back to Frontier
  const claimedTwo = claimTicketInProject(claimed, 2);
  assert.equal(claimedTwo.activeTicketId, 2);
  assert.equal(claimedTwo.tickets.find((t) => t.id === 1)?.status, 'FRONTIER');
  assert.equal(claimedTwo.tickets.find((t) => t.id === 2)?.status, 'CLAIMED');

  const released = releaseTicketInProject(claimedTwo, 2);
  assert.equal(released.activeTicketId, null);
  assert.equal(released.tickets.find((t) => t.id === 2)?.status, 'FRONTIER');
});

test('completing ticket #1 saves output, updates decisions, and unlocks ticket #3 but keeps #4 blocked', () => {
  const demo = createDemoProject();
  const claimed = claimTicketInProject(demo, 1);
  const completed = completeTicketInProject(claimed, 1, {
    summary: 'Confermato uso di getDisplayMedia + AudioContext merge su WebM VP9.',
    newTickets: [
      {
        title: 'Test fallback VP8 su browser datati',
        description: 'Verificare registrazione quando VP9 non è supportato.',
        category: 'TASK',
        dependencies: [],
      },
    ],
    newFogs: ['Come gestire il cambio microfono a registrazione avviata?'],
  });

  assert.equal(completed.activeTicketId, null);
  assert.equal(completed.tickets.find((t) => t.id === 1)?.status, 'DONE');
  assert.equal(
    completed.tickets.find((t) => t.id === 3)?.status,
    'FRONTIER',
    'Ticket #3 depends only on #1 so it must unlock'
  );
  assert.equal(
    completed.tickets.find((t) => t.id === 4)?.status,
    'BLOCKED',
    'Ticket #4 depends on #1 and #3 so it remains BLOCKED'
  );
  assert.equal(completed.tickets.length, 6);
  assert.equal(completed.tickets.find((t) => t.id === 6)?.status, 'FRONTIER');
  assert.ok(
    completed.decisions.some((d) => d.includes('Confermato uso di getDisplayMedia'))
  );
  assert.ok(
    completed.fog.includes('Come gestire il cambio microfono a registrazione avviata?')
  );
});

test('recomputeTicketStatuses prevents self-dependencies and unlocks cleared chains', () => {
  const tickets = recomputeTicketStatuses([
    {
      id: 1,
      title: 'A',
      description: '',
      category: 'TASK',
      status: 'DONE',
      dependencies: [],
      output: 'ok',
      createdAt: '',
    },
    {
      id: 2,
      title: 'B',
      description: '',
      category: 'TASK',
      status: 'BLOCKED',
      dependencies: [1, 2],
      output: '',
      createdAt: '',
    },
  ]);

  assert.deepEqual(tickets[1].dependencies, [1]);
  assert.equal(tickets[1].status, 'FRONTIER');
});

test('parseTicketsJson parses fenced JSON arrays and remaps dependency IDs', () => {
  const raw = `\`\`\`json
  [
    {
      "id": 10,
      "title": "Ricerca API",
      "description": "Test API",
      "category": "research",
      "dependencies": []
    },
    {
      "id": 20,
      "title": "Prototipo",
      "description": "Costruisci UI",
      "category": "PROTOTYPE",
      "dependencies": [10]
    }
  ]
  \`\`\``;

  const parsed = parseTicketsJson(raw, 1);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.tickets.length, 2);
    assert.equal(parsed.tickets[0].id, 1);
    assert.equal(parsed.tickets[0].category, 'RESEARCH');
    assert.equal(parsed.tickets[0].status, 'FRONTIER');
    assert.equal(parsed.tickets[1].id, 2);
    assert.deepEqual(parsed.tickets[1].dependencies, [1]);
    assert.equal(parsed.tickets[1].status, 'BLOCKED');
  }
});

test('parseTicketsJson returns readable error on invalid JSON', () => {
  const parsed = parseTicketsJson('{bad json');
  assert.equal(parsed.ok, false);
});

test('parseGrillingNotes extracts Destination, Decisions, Fog and Out of Scope sections', () => {
  const raw = `
Destination: App web per tracciare spese personali offline.
Decisions:
- Dati salvati solo in localStorage
- Nessun grafico complesso nella v1
Fog:
- Serve export CSV o JSON?
Out of Scope:
- Sincronizzazione bancaria automatica
  `;

  const parsed = parseGrillingNotes(raw);
  assert.equal(parsed.destination, 'App web per tracciare spese personali offline.');
  assert.deepEqual(parsed.decisions, [
    'Dati salvati solo in localStorage',
    'Nessun grafico complesso nella v1',
  ]);
  assert.deepEqual(parsed.fog, ['Serve export CSV o JSON?']);
  assert.deepEqual(parsed.outOfScope, ['Sincronizzazione bancaria automatica']);
});

test('parseAiSummaryBlock extracts outcome, fogs and suggested ticket titles', () => {
  const summary = `
Esito: Scelto MediaRecorder con fallback VP8.
Nuovo Fog: Verificare comportamento audio su Firefox Linux
Nuovo Ticket: Aggiungere test permessi negati
  `;
  const parsed = parseAiSummaryBlock(summary);
  assert.ok(parsed.outcome.includes('Scelto MediaRecorder'));
  assert.deepEqual(parsed.fogs, ['Verificare comportamento audio su Firefox Linux']);
  assert.deepEqual(parsed.ticketTitles, ['Aggiungere test permessi negati']);
});

test('prompt builders adapt to AI targets and include mandatory closing instruction', () => {
  const demo = createDemoProject();
  const grillingClaude = buildGrillingPrompt(demo.vagueIdea, 'Claude');
  assert.ok(grillingClaude.includes('<ruolo>'));

  const mapPrompt = buildMapCreationPrompt(demo, 'Gemini');
  assert.ok(mapPrompt.includes('Clone Locale di Loom') || mapPrompt.includes(demo.destination));
  assert.ok(mapPrompt.includes('"category": "RESEARCH"'));

  const ticket = demo.tickets[0];
  const sessionPkg = buildTicketSessionPrompt(demo, ticket, 'ChatGPT', false);
  assert.ok(
    sessionPkg.prompt.includes(
      'Alla fine della tua risposta, forniscimi un blocco riassuntivo compatto (max 10 righe) con: 1) Esito/Decisione presa, 2) Eventuali nuovi ticket o fog emersi, così che io possa aggiornare la mia mappa.'
    )
  );
  assert.ok(sessionPkg.estimatedTokens > 50);
});
