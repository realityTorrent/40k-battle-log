const test = require('node:test');
const assert = require('node:assert/strict');

const App = require('../js/app.js');

function freshDataSourceModule() {
  delete require.cache[require.resolve('../js/storage.js')];
  delete require.cache[require.resolve('../js/data-source.js')];
  return require('../js/data-source.js');
}

function sampleGames() {
  return [
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
}

test('export -> publish round trip: DataSource.loadGames() resolves to exactly what App.buildExportJSON exported', function () {
  var games = sampleGames();
  var exportedJSON = App.buildExportJSON(games);

  global.fetch = function () {
    return Promise.resolve({
      ok: true,
      json: function () {
        return Promise.resolve(JSON.parse(exportedJSON));
      }
    });
  };

  const DataSource = freshDataSourceModule();
  return DataSource.loadGames().then(function (resolvedGames) {
    assert.deepEqual(resolvedGames, games);
  });
});
