(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.App = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  var Storage = typeof window !== 'undefined' ? window.Storage : (typeof require !== 'undefined' ? require('./storage.js') : undefined);
  var DataSource = typeof window !== 'undefined' ? window.DataSource : (typeof require !== 'undefined' ? require('./data-source.js') : undefined);

  var ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (ch) {
      return ESCAPE_MAP[ch];
    });
  }

  function gameToListItemHTML(game) {
    var players = (Array.isArray(game.players) ? game.players : [])
      .map(function (p) {
        return escapeHtml(p && p.name) + ' (' + escapeHtml(p && p.faction) + ')';
      })
      .join(' vs ');
    var dateStr = new Date(game.date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return (
      '<li data-game-id="' + escapeHtml(game.id) + '">' +
      '<span class="game-date">' + escapeHtml(dateStr) + '</span> - ' +
      '<span class="game-players">' + players + '</span> - ' +
      'Winner: <strong class="game-winner">' + escapeHtml(game.winner) + '</strong>' +
      '</li>'
    );
  }

  function renderGameDetailHTML(game) {
    var dateStr = new Date(game.date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    var playersHtml = (Array.isArray(game.players) ? game.players : [])
      .map(function (p) {
        return (
          '<li>' +
          '<span class="detail-player-name">' + escapeHtml(p && p.name) + '</span> - ' +
          '<span class="detail-player-faction">' + escapeHtml(p && p.faction) + '</span> - ' +
          'Score: <span class="detail-player-score">' + escapeHtml(p && p.score != null ? String(p.score) : '') + '</span>' +
          '</li>'
        );
      })
      .join('');
    var hasNotes = game.notes != null && String(game.notes).trim() !== '';
    var notesText = hasNotes ? escapeHtml(game.notes) : 'No notes recorded';

    return (
      '<p class="game-detail-date">' + escapeHtml(dateStr) + '</p>' +
      '<p class="game-detail-mission">Mission: ' + escapeHtml(game.mission) + '</p>' +
      '<p class="game-detail-winner">Winner: <strong>' + escapeHtml(game.winner) + '</strong></p>' +
      '<ul class="game-detail-players">' + playersHtml + '</ul>' +
      '<p class="game-detail-notes">Notes: ' + notesText + '</p>'
    );
  }

  function showGameDetail(game) {
    if (typeof document === 'undefined') {
      return;
    }
    if (!game) {
      return;
    }
    var contentEl = document.getElementById('game-detail-content');
    if (contentEl) {
      try {
        contentEl.innerHTML = renderGameDetailHTML(game);
      } catch (e) {
        contentEl.textContent = 'This game\'s data could not be displayed.';
      }
    }
    var entrySection = document.getElementById('entry-form-section');
    var listSection = document.getElementById('game-list-section');
    var detailSection = document.getElementById('game-detail');
    if (entrySection) {
      entrySection.hidden = true;
    }
    if (listSection) {
      listSection.hidden = true;
    }
    if (detailSection) {
      detailSection.hidden = false;
    }
  }

  function showGameList() {
    if (typeof document === 'undefined') {
      return;
    }
    var entrySection = document.getElementById('entry-form-section');
    var listSection = document.getElementById('game-list-section');
    var detailSection = document.getElementById('game-detail');
    if (entrySection) {
      entrySection.hidden = false;
    }
    if (listSection) {
      listSection.hidden = false;
    }
    if (detailSection) {
      detailSection.hidden = true;
    }
  }

  function validateGameForm(formValues) {
    var errors = [];
    var players = formValues.players || [];

    if (players.length < 2) {
      errors.push('At least 2 players are required.');
    }

    players.forEach(function (p, i) {
      if (!p.name || !String(p.name).trim()) {
        errors.push('Player ' + (i + 1) + ' is missing a name.');
      }
      if (!p.faction || !String(p.faction).trim()) {
        errors.push('Player ' + (i + 1) + ' is missing a faction.');
      }
      if (p.score === '' || p.score === null || p.score === undefined || isNaN(Number(p.score)) || Number(p.score) < 0) {
        errors.push('Player ' + (i + 1) + ' needs a valid score (0 or greater).');
      }
    });

    if (!formValues.mission || !String(formValues.mission).trim()) {
      errors.push('A mission is required.');
    }

    var winner = formValues.winner;
    if (!winner || !String(winner).trim()) {
      errors.push('A winner must be selected.');
    } else {
      var isDraw = winner === 'Draw';
      var matchesPlayer = players.some(function (p) {
        return p.name === winner;
      });
      if (!isDraw && !matchesPlayer) {
        errors.push('Winner must be one of the listed players or "Draw".');
      }
    }

    return { valid: errors.length === 0, errors: errors };
  }

  function buildExportJSON(games) {
    return JSON.stringify(games, null, 2);
  }

  function renderGameList(games) {
    if (typeof document === 'undefined') {
      return;
    }
    var listEl = document.getElementById('game-list');
    var emptyEl = document.getElementById('game-list-empty');
    if (!listEl) {
      return;
    }
    if (!games || games.length === 0) {
      listEl.innerHTML = '';
      if (emptyEl) {
        emptyEl.hidden = false;
      }
      return;
    }
    if (emptyEl) {
      emptyEl.hidden = true;
    }
    listEl.innerHTML = games
      .map(function (game) {
        try {
          return gameToListItemHTML(game);
        } catch (e) {
          return '';
        }
      })
      .join('');
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      var form = document.getElementById('entry-form');
      var playersContainer = document.getElementById('players');
      var addPlayerBtn = document.getElementById('add-player-btn');
      var template = document.getElementById('player-row-template');
      var winnerSelect = document.getElementById('winner');
      var formErrorsEl = document.getElementById('form-errors');
      var gameListEl = document.getElementById('game-list');
      var backToListBtn = document.getElementById('back-to-list-btn');
      var exportBtn = document.getElementById('export-btn');
      var exportStatusEl = document.getElementById('export-status');
      var currentGames = [];

      function getPlayerRows() {
        return playersContainer.querySelectorAll('.player-row');
      }

      function readPlayers() {
        return Array.prototype.map.call(getPlayerRows(), function (row) {
          return {
            name: row.querySelector('.player-name').value,
            faction: row.querySelector('.player-faction').value,
            score: row.querySelector('.player-score').value
          };
        });
      }

      function refreshWinnerOptions() {
        if (!winnerSelect) {
          return;
        }
        var currentValue = winnerSelect.value;
        var names = Array.prototype.map
          .call(getPlayerRows(), function (row) {
            return row.querySelector('.player-name').value;
          })
          .filter(function (name) {
            return name && name.trim();
          });

        winnerSelect.innerHTML = '';

        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '-- Select winner --';
        winnerSelect.appendChild(placeholder);

        names.forEach(function (name) {
          var opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          winnerSelect.appendChild(opt);
        });

        var drawOpt = document.createElement('option');
        drawOpt.value = 'Draw';
        drawOpt.textContent = 'Draw';
        winnerSelect.appendChild(drawOpt);

        if (names.indexOf(currentValue) !== -1 || currentValue === 'Draw') {
          winnerSelect.value = currentValue;
        }
      }

      function renderFormErrors(errors) {
        if (!formErrorsEl) {
          return;
        }
        formErrorsEl.innerHTML = errors
          .map(function (err) {
            return '<li>' + escapeHtml(err) + '</li>';
          })
          .join('');
      }

      if (addPlayerBtn && template && playersContainer) {
        addPlayerBtn.addEventListener('click', function () {
          var fragment = template.content.cloneNode(true);
          playersContainer.appendChild(fragment);
          refreshWinnerOptions();
        });
      }

      if (playersContainer) {
        playersContainer.addEventListener('click', function (e) {
          if (!e.target.classList.contains('remove-player-btn')) {
            return;
          }
          var rows = getPlayerRows();
          if (rows.length <= 2) {
            return;
          }
          var row = e.target.closest('.player-row');
          if (row) {
            row.remove();
            refreshWinnerOptions();
          }
        });

        playersContainer.addEventListener('input', function (e) {
          if (e.target.classList.contains('player-name')) {
            refreshWinnerOptions();
          }
        });
      }

      if (gameListEl) {
        gameListEl.addEventListener('click', function (e) {
          var li = e.target.closest('li[data-game-id]');
          if (!li) {
            return;
          }
          var id = li.getAttribute('data-game-id');
          var game = currentGames.find(function (g) {
            return g.id === id;
          });
          showGameDetail(game || Storage.getGame(id));
        });
      }

      if (backToListBtn) {
        backToListBtn.addEventListener('click', function () {
          showGameList();
        });
      }

      if (exportBtn) {
        exportBtn.addEventListener('click', function () {
          var games = Storage.loadGames();
          var json = buildExportJSON(games);
          var blob = new Blob([json], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          link.download = 'games.json';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          if (exportStatusEl) {
            exportStatusEl.textContent =
              'Exported ' + games.length + ' games as games.json — save it as data/games.json in the project and redeploy to publish.';
          }
        });
      }

      refreshWinnerOptions();
      DataSource.loadGames().then(function (games) {
        currentGames = games;
        renderGameList(games);
      });

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();

          var players = readPlayers();
          var formValues = {
            mission: document.getElementById('mission').value,
            notes: document.getElementById('notes').value,
            winner: winnerSelect ? winnerSelect.value : '',
            players: players
          };

          var result = validateGameForm(formValues);
          if (!result.valid) {
            renderFormErrors(result.errors);
            return;
          }

          renderFormErrors([]);

          var game = {
            id: Storage.generateId(),
            date: new Date().toISOString(),
            mission: formValues.mission,
            notes: formValues.notes,
            winner: formValues.winner,
            players: players.map(function (p) {
              return { name: p.name, faction: p.faction, score: Number(p.score) };
            })
          };

          try {
            Storage.saveGame(game);
          } catch (err) {
            renderFormErrors([err.message || 'Could not save game. Your browser storage may be full or unavailable.']);
            return;
          }

          var games = Storage.loadGames();
          currentGames = games;
          renderGameList(games);
          form.reset();
          refreshWinnerOptions();
        });
      }
    });
  }

  return {
    escapeHtml: escapeHtml,
    validateGameForm: validateGameForm,
    gameToListItemHTML: gameToListItemHTML,
    renderGameList: renderGameList,
    renderGameDetailHTML: renderGameDetailHTML,
    showGameDetail: showGameDetail,
    showGameList: showGameList,
    buildExportJSON: buildExportJSON
  };
});
