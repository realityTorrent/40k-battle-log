const test = require('node:test');
const assert = require('node:assert/strict');

const App = require('../js/app.js');

test('validateGameForm: 2 valid players, mission, and a winner -> valid', function () {
  const result = App.validateGameForm({
    mission: 'Recon',
    notes: '',
    winner: 'Alice',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 5 }
    ]
  });
  assert.equal(result.valid, true);
});

test('validateGameForm: only 1 player -> invalid, errors mention player count', function () {
  const result = App.validateGameForm({
    mission: 'Recon',
    notes: '',
    winner: 'Alice',
    players: [{ name: 'Alice', faction: 'Necrons', score: 10 }]
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(function (e) { return /player/i.test(e); }));
});

test('validateGameForm: a player missing faction -> invalid', function () {
  const result = App.validateGameForm({
    mission: 'Recon',
    notes: '',
    winner: 'Alice',
    players: [
      { name: 'Alice', faction: '', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 5 }
    ]
  });
  assert.equal(result.valid, false);
});

test('validateGameForm: no winner selected -> invalid', function () {
  const result = App.validateGameForm({
    mission: 'Recon',
    notes: '',
    winner: '',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 5 }
    ]
  });
  assert.equal(result.valid, false);
});

test('validateGameForm: 4 players and a valid winner among them -> valid', function () {
  const result = App.validateGameForm({
    mission: 'Recon',
    notes: '',
    winner: 'Carol',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 5 },
      { name: 'Carol', faction: 'Tau', score: 15 },
      { name: 'Dave', faction: 'Eldar', score: 8 }
    ]
  });
  assert.equal(result.valid, true);
});

test('validateGameForm: winner of "Draw" is accepted', function () {
  const result = App.validateGameForm({
    mission: 'Recon',
    notes: '',
    winner: 'Draw',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 10 }
    ]
  });
  assert.equal(result.valid, true);
});

test('validateGameForm: missing mission -> invalid', function () {
  const result = App.validateGameForm({
    mission: '',
    notes: '',
    winner: 'Alice',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 5 }
    ]
  });
  assert.equal(result.valid, false);
});

test('validateGameForm: negative score -> invalid', function () {
  const result = App.validateGameForm({
    mission: 'Recon',
    notes: '',
    winner: 'Alice',
    players: [
      { name: 'Alice', faction: 'Necrons', score: -1 },
      { name: 'Bob', faction: 'Orks', score: 5 }
    ]
  });
  assert.equal(result.valid, false);
});

test('validateGameForm: notes is optional and never flagged', function () {
  const result = App.validateGameForm({
    mission: 'Recon',
    notes: undefined,
    winner: 'Alice',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 5 }
    ]
  });
  assert.equal(result.valid, true);
});

test('gameToListItemHTML: escapes user-supplied strings', function () {
  const html = App.gameToListItemHTML({
    id: 'g1',
    date: new Date().toISOString(),
    mission: 'Recon',
    notes: '',
    winner: '<b>Alice</b>',
    players: [
      { name: '<script>alert(1)</script>', faction: 'Necrons', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 5 }
    ]
  });
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('gameToListItemHTML: includes player names and winner', function () {
  const html = App.gameToListItemHTML({
    id: 'g2',
    date: new Date().toISOString(),
    mission: 'Recon',
    notes: '',
    winner: 'Bob',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 3 },
      { name: 'Bob', faction: 'Orks', score: 12 }
    ]
  });
  assert.ok(html.includes('Alice'));
  assert.ok(html.includes('Bob'));
  assert.ok(html.includes('Bob'));
});

test('gameToListItemHTML: 3-player game shows winner, every name, and every faction', function () {
  const html = App.gameToListItemHTML({
    id: 'g3',
    date: new Date().toISOString(),
    mission: 'Recon',
    notes: '',
    winner: 'Carol',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 3 },
      { name: 'Bob', faction: 'Orks', score: 7 },
      { name: 'Carol', faction: 'Tau', score: 15 }
    ]
  });
  assert.ok(html.includes('Carol'));
  assert.ok(html.includes('Alice'));
  assert.ok(html.includes('Necrons'));
  assert.ok(html.includes('Bob'));
  assert.ok(html.includes('Orks'));
  assert.ok(html.includes('Tau'));
  assert.ok(html.includes('data-game-id="g3"'));
});

test('renderGameDetailHTML: 3-player game includes every name, faction, and score', function () {
  const html = App.renderGameDetailHTML({
    id: 'd1',
    date: new Date().toISOString(),
    mission: 'Recon',
    notes: 'Great game',
    winner: 'Carol',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 5 },
      { name: 'Carol', faction: 'Tau', score: 15 }
    ]
  });
  assert.ok(html.includes('Alice'));
  assert.ok(html.includes('Necrons'));
  assert.ok(html.includes('10'));
  assert.ok(html.includes('Bob'));
  assert.ok(html.includes('Orks'));
  assert.ok(html.includes('5'));
  assert.ok(html.includes('Carol'));
  assert.ok(html.includes('Tau'));
  assert.ok(html.includes('15'));
});

test('renderGameDetailHTML: includes mission, winner, and notes text', function () {
  const html = App.renderGameDetailHTML({
    id: 'd2',
    date: new Date().toISOString(),
    mission: 'Purge the Xenos',
    notes: 'Close game, last turn objective grab',
    winner: 'Alice',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 8 }
    ]
  });
  assert.ok(html.includes('Purge the Xenos'));
  assert.ok(html.includes('Alice'));
  assert.ok(html.includes('Close game, last turn objective grab'));
});

test('renderGameDetailHTML: empty notes render explicit "No notes recorded" placeholder', function () {
  const html = App.renderGameDetailHTML({
    id: 'd3',
    date: new Date().toISOString(),
    mission: 'Recon',
    notes: '',
    winner: 'Draw',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 10 }
    ]
  });
  assert.ok(html.includes('No notes recorded'));
});

test('renderGameDetailHTML: 2-player game renders both players', function () {
  const html = App.renderGameDetailHTML({
    id: 'd4',
    date: new Date().toISOString(),
    mission: 'Recon',
    notes: '',
    winner: 'Alice',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 5 }
    ]
  });
  assert.ok(html.includes('Alice'));
  assert.ok(html.includes('Bob'));
});

test('buildExportJSON: empty games array serializes to "[]"', function () {
  const json = App.buildExportJSON([]);
  assert.equal(json, '[]');
});

test('buildExportJSON: round-trips a 3-game array through JSON.parse with order preserved', function () {
  const games = [
    {
      id: 'g3',
      date: '2026-09-17T12:00:00.000Z',
      mission: 'Purge the Xenos',
      notes: 'Close game',
      winner: 'Carol',
      players: [
        { name: 'Carol', faction: 'Tau', score: 15 },
        { name: 'Dave', faction: 'Eldar', score: 12 }
      ]
    },
    {
      id: 'g2',
      date: '2026-09-16T12:00:00.000Z',
      mission: 'Recon',
      notes: '',
      winner: 'Bob',
      players: [
        { name: 'Alice', faction: 'Necrons', score: 3 },
        { name: 'Bob', faction: 'Orks', score: 12 }
      ]
    },
    {
      id: 'g1',
      date: '2026-09-15T12:00:00.000Z',
      mission: 'Recon',
      notes: 'First game',
      winner: 'Draw',
      players: [
        { name: 'Alice', faction: 'Necrons', score: 10 },
        { name: 'Bob', faction: 'Orks', score: 10 }
      ]
    }
  ];
  const json = App.buildExportJSON(games);
  const parsed = JSON.parse(json);
  assert.deepEqual(parsed, games);
});

test('renderGameDetailHTML: 5-player game renders every player entry', function () {
  const html = App.renderGameDetailHTML({
    id: 'd5',
    date: new Date().toISOString(),
    mission: 'Recon',
    notes: 'Big battle',
    winner: 'Eve',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 1 },
      { name: 'Bob', faction: 'Orks', score: 2 },
      { name: 'Carol', faction: 'Tau', score: 3 },
      { name: 'Dave', faction: 'Eldar', score: 4 },
      { name: 'Eve', faction: 'Space Marines', score: 5 }
    ]
  });
  ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'].forEach(function (name) {
    assert.ok(html.includes(name), name + ' should appear');
  });
  ['Necrons', 'Orks', 'Tau', 'Eldar', 'Space Marines'].forEach(function (faction) {
    assert.ok(html.includes(faction), faction + ' should appear');
  });
});

test('gameToListItemHTML: malformed game with no players array does not throw', function () {
  assert.doesNotThrow(function () {
    App.gameToListItemHTML({ id: 'bad', date: new Date().toISOString(), mission: 'X', notes: '', winner: 'X' });
  });
});

test('renderGameDetailHTML: malformed game with no players array does not throw', function () {
  assert.doesNotThrow(function () {
    App.renderGameDetailHTML({ id: 'bad', date: new Date().toISOString(), mission: 'X', notes: '', winner: 'X' });
  });
});

test('gameToListItemHTML: a player missing name/faction/score does not throw', function () {
  assert.doesNotThrow(function () {
    App.gameToListItemHTML({
      id: 'bad2',
      date: new Date().toISOString(),
      mission: 'X',
      notes: '',
      winner: 'X',
      players: [{}]
    });
  });
});
