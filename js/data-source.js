(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.DataSource = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  var Storage = typeof window !== 'undefined' ? window.Storage : (typeof require !== 'undefined' ? require('./storage.js') : undefined);

  function loadGames() {
    try {
      return fetch('data/games.json')
        .then(function (response) {
          if (!response.ok) {
            return Storage.loadGames();
          }
          return response
            .json()
            .then(function (parsed) {
              if (!Array.isArray(parsed)) {
                return Storage.loadGames();
              }
              return parsed;
            })
            .catch(function () {
              return Storage.loadGames();
            });
        })
        .catch(function () {
          return Storage.loadGames();
        });
    } catch (e) {
      return Promise.resolve(Storage.loadGames());
    }
  }

  return {
    loadGames: loadGames
  };
});
