const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const GAMES_JSON_PATH = path.join(ROOT, 'data', 'games.json');

const CONTENT_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css'
};

function createStaticServer() {
  return http.createServer(function (req, res) {
    var urlPath = req.url.split('?')[0];
    var filePath = path.join(ROOT, decodeURIComponent(urlPath));
    fs.readFile(filePath, function (err, data) {
      if (err) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      var ext = path.extname(filePath);
      var contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.end(data);
    });
  });
}

test('a plain static file server round-trips data/games.json and serves index.html verbatim', function (t) {
  var originalGamesJson = fs.readFileSync(GAMES_JSON_PATH, 'utf8');
  var fixture = [
    {
      id: 'fixture-1',
      date: '2026-01-01T00:00:00.000Z',
      mission: 'Static Site Proof',
      notes: 'served from disk',
      winner: 'Alice',
      players: [
        { name: 'Alice', faction: 'Necrons', score: 10 },
        { name: 'Bob', faction: 'Orks', score: 5 }
      ]
    }
  ];
  fs.writeFileSync(GAMES_JSON_PATH, JSON.stringify(fixture));

  var server = createStaticServer();

  t.after(function () {
    fs.writeFileSync(GAMES_JSON_PATH, originalGamesJson);
  });

  return new Promise(function (resolve, reject) {
    server.listen(0, '127.0.0.1', function () {
      var port = server.address().port;
      var base = 'http://127.0.0.1:' + port;

      fetch(base + '/data/games.json')
        .then(function (response) {
          return response.json();
        })
        .then(function (json) {
          assert.deepEqual(json, fixture);
          return fetch(base + '/index.html');
        })
        .then(function (response) {
          assert.equal(response.status, 200);
          return response.text();
        })
        .then(function (body) {
          assert.ok(body.includes('<script src="js/data-source.js">'));
        })
        .then(function () {
          server.close(function (err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        })
        .catch(function (err) {
          server.close(function () {
            reject(err);
          });
        });
    });
  });
});
