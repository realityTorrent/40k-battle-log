const test = require('node:test');
const assert = require('node:assert/strict');

function makeFakeLocalStorage() {
  var store = {};
  return {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem: function (key, value) {
      store[key] = String(value);
    },
    removeItem: function (key) {
      delete store[key];
    },
    clear: function () {
      store = {};
    }
  };
}

function freshStorageModule() {
  delete require.cache[require.resolve('../js/storage.js')];
  return require('../js/storage.js');
}

test('loadGames returns [] on an empty store', function () {
  global.localStorage = makeFakeLocalStorage();
  const Storage = freshStorageModule();
  assert.deepEqual(Storage.loadGames(), []);
});

test('saveGame persists a game such that loadGames returns it', function () {
  global.localStorage = makeFakeLocalStorage();
  const Storage = freshStorageModule();
  const game = {
    id: Storage.generateId(),
    date: new Date().toISOString(),
    mission: 'Recon',
    notes: '',
    winner: 'Alice',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 5 }
    ]
  };
  Storage.saveGame(game);
  const games = Storage.loadGames();
  assert.equal(games.length, 1);
  assert.equal(games[0].id, game.id);
  assert.equal(games[0].mission, 'Recon');
});

test('two saveGame calls leave the most recent game first', function () {
  global.localStorage = makeFakeLocalStorage();
  const Storage = freshStorageModule();
  const gameA = {
    id: Storage.generateId(),
    date: new Date().toISOString(),
    mission: 'First',
    notes: '',
    winner: 'Alice',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 5 }
    ]
  };
  Storage.saveGame(gameA);
  const gameB = {
    id: Storage.generateId(),
    date: new Date().toISOString(),
    mission: 'Second',
    notes: '',
    winner: 'Bob',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 3 },
      { name: 'Bob', faction: 'Orks', score: 12 }
    ]
  };
  Storage.saveGame(gameB);
  const games = Storage.loadGames();
  assert.equal(games.length, 2);
  assert.equal(games[0].mission, 'Second');
  assert.equal(games[1].mission, 'First');
});

test('loadGames returns [] (not a throw) when localStorage holds invalid JSON', function () {
  global.localStorage = makeFakeLocalStorage();
  global.localStorage.setItem('40k-battle-log:games', '{not valid json');
  const Storage = freshStorageModule();
  assert.doesNotThrow(function () {
    Storage.loadGames();
  });
  assert.deepEqual(Storage.loadGames(), []);
});

test('saveGame throws a clear error when localStorage.setItem fails (quota exceeded / unavailable)', function () {
  global.localStorage = makeFakeLocalStorage();
  global.localStorage.setItem = function () {
    throw new Error('QuotaExceededError');
  };
  const Storage = freshStorageModule();
  const game = {
    id: Storage.generateId(),
    date: new Date().toISOString(),
    mission: 'Recon',
    notes: '',
    winner: 'Alice',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 5 }
    ]
  };
  assert.throws(function () {
    Storage.saveGame(game);
  }, /storage is full or unavailable/);
});

test('getGame returns the matching game by id', function () {
  global.localStorage = makeFakeLocalStorage();
  const Storage = freshStorageModule();
  const game = {
    id: Storage.generateId(),
    date: new Date().toISOString(),
    mission: 'Recon',
    notes: '',
    winner: 'Alice',
    players: [
      { name: 'Alice', faction: 'Necrons', score: 10 },
      { name: 'Bob', faction: 'Orks', score: 5 }
    ]
  };
  Storage.saveGame(game);
  const found = Storage.getGame(game.id);
  assert.equal(found.mission, 'Recon');
  assert.equal(Storage.getGame('nonexistent'), undefined);
});
