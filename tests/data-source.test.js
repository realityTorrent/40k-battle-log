const test = require('node:test');
const assert = require('node:assert/strict');

function makeFakeLocalStorage(initial) {
  var store = initial || {};
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

function freshDataSourceModule() {
  delete require.cache[require.resolve('../js/storage.js')];
  delete require.cache[require.resolve('../js/data-source.js')];
  return require('../js/data-source.js');
}

test('loadGames resolves with fetched data/games.json contents when fetch succeeds', function () {
  global.localStorage = makeFakeLocalStorage();
  var storageConsulted = false;
  var realGetItem = global.localStorage.getItem;
  global.localStorage.getItem = function () {
    storageConsulted = true;
    return realGetItem.apply(this, arguments);
  };
  global.fetch = function () {
    return Promise.resolve({
      ok: true,
      json: function () {
        return Promise.resolve([{ id: 'a' }]);
      }
    });
  };
  const DataSource = freshDataSourceModule();
  return DataSource.loadGames().then(function (games) {
    assert.deepEqual(games, [{ id: 'a' }]);
    assert.equal(storageConsulted, false);
  });
});

test('loadGames falls back to Storage.loadGames() when fetch rejects (network error / file://)', function () {
  var known = [{ id: 'local-1' }];
  global.localStorage = makeFakeLocalStorage({ '40k-battle-log:games': JSON.stringify(known) });
  global.fetch = function () {
    return Promise.reject(new Error('Failed to fetch'));
  };
  const DataSource = freshDataSourceModule();
  return DataSource.loadGames().then(function (games) {
    assert.deepEqual(games, known);
  });
});

test('loadGames falls back to Storage.loadGames() when fetch resolves with a non-ok status', function () {
  var known = [{ id: 'local-2' }];
  global.localStorage = makeFakeLocalStorage({ '40k-battle-log:games': JSON.stringify(known) });
  global.fetch = function () {
    return Promise.resolve({ ok: false, status: 404 });
  };
  const DataSource = freshDataSourceModule();
  return DataSource.loadGames().then(function (games) {
    assert.deepEqual(games, known);
  });
});

test('loadGames falls back to Storage.loadGames() when the parsed JSON body is not an array', function () {
  var known = [{ id: 'local-3' }];
  global.localStorage = makeFakeLocalStorage({ '40k-battle-log:games': JSON.stringify(known) });
  global.fetch = function () {
    return Promise.resolve({
      ok: true,
      json: function () {
        return Promise.resolve({ not: 'an array' });
      }
    });
  };
  const DataSource = freshDataSourceModule();
  return DataSource.loadGames().then(function (games) {
    assert.deepEqual(games, known);
  });
});

test('loadGames never rejects, even when fetch rejects and localStorage is empty', function () {
  global.localStorage = makeFakeLocalStorage();
  global.fetch = function () {
    return Promise.reject(new Error('network down'));
  };
  const DataSource = freshDataSourceModule();
  return DataSource.loadGames().then(function (games) {
    assert.deepEqual(games, []);
  });
});
