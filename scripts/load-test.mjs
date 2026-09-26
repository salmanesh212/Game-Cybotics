import { createRequire } from 'node:module';

const baseUrl = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const roundsToRun = [10, 25, 50];
const clientRequire = createRequire(new URL('../client/package.json', import.meta.url));
const { io } = clientRequire('socket.io-client');
const socket = io(baseUrl, { transports: ['websocket'], reconnection: false, autoUnref: true });
let leaderboardUpdates = 0;
socket.on('leaderboard:update', () => { leaderboardUpdates += 1; });

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status} ${path}: ${body.error || response.statusText}`);
  return body;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Socket.IO connection timed out')), 7000);
  socket.once('connect', () => { clearTimeout(timeout); resolve(); });
  socket.once('connect_error', (error) => { clearTimeout(timeout); reject(error); });
});

async function play(index) {
  const { token } = await request('/players', {
    method: 'POST',
    body: JSON.stringify({ nickname: `LOAD${String(index).padStart(3, '0')}` }),
  });
  const auth = { 'x-player-token': token };
  const game = await request('/games/start', { method: 'POST', headers: auth });
  let round = game.firstRound;

  for (let number = 1; number <= game.totalRounds; number += 1) {
    // Exercise server measured reaction timing and the game's minimum duration.
    await delay(310);
    const result = await request(`/games/${game.gameId}/round`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        roundNumber: number,
        selectedValue: round.targetValue,
        ...(number === 1 && index === 1 ? { score: 999999, reactionTimeMs: 1 } : {}),
      }),
    });
    if (!result.completed) round = result.nextRound;
    if (number === game.totalRounds && !result.completed) throw new Error('Final round did not complete');

    if (number === 1 && index === 1) {
      const replay = await fetch(`${baseUrl}/api/games/${game.gameId}/round`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...auth },
        body: JSON.stringify({ roundNumber: 1, selectedValue: game.firstRound.targetValue }),
      });
      if (replay.status !== 400) throw new Error(`Duplicate round was not rejected (HTTP ${replay.status})`);
    }
  }

  const result = await request(`/games/${game.gameId}/finish`, { method: 'POST', headers: auth });
  if (result.totalScore <= 0 || result.totalScore >= 100000 || result.correct !== game.totalRounds) {
    throw new Error(`Invalid result or client score was accepted for ${game.gameId}`);
  }
  if (index === 1) {
    const duplicateFinish = await request(`/games/${game.gameId}/finish`, { method: 'POST', headers: auth });
    if (duplicateFinish.totalScore !== result.totalScore) throw new Error('Repeated finish changed the score');
  }
  return game.gameId;
}

for (const count of roundsToRun) {
  const startedAt = Date.now();
  const updatesBefore = leaderboardUpdates;
  const gameIds = await Promise.all(Array.from({ length: count }, (_, i) => play(i + 1)));
  if (new Set(gameIds).size !== count) throw new Error(`${count} players received duplicate game IDs`);

  const updateDeadline = Date.now() + 5000;
  while (leaderboardUpdates === updatesBefore && Date.now() < updateDeadline) await delay(50);
  if (leaderboardUpdates === updatesBefore) throw new Error(`No live leaderboard update for the ${count}-player batch`);

  const leaderboard = await request('/leaderboard');
  const visibleIds = new Set(leaderboard.map((entry) => entry.id));
  const visible = gameIds.filter((id) => visibleIds.has(id)).length;
  console.log(`${count} concurrent players completed; ${visible}/${count} in Top 10; Socket.IO leaderboard update received; ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
}

socket.close();
console.log('Load test completed. Run this only against a test event/database; it creates player and game records.');
