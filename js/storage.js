(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.Storage = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  var STORAGE_KEY = '40k-battle-log:games';

  function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  function loadGames() {
    var raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return [];
    }
    if (!raw) {
      return [];
    }
    try {
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed;
    } catch (e) {
      return [];
    }
  }

  function saveGame(game) {
    var games = loadGames();
    games.unshift(game);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    } catch (e) {
      throw new Error('Could not save game: browser storage is full or unavailable.');
    }
    return games;
  }

  function getGame(id) {
    return loadGames().find(function (g) {
      return g.id === id;
    });
  }

  return {
    generateId: generateId,
    loadGames: loadGames,
    saveGame: saveGame,
    getGame: getGame
  };
});
