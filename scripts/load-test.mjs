const baseUrl = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const roundsToRun = [10, 25, 50];

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
      body: JSON.stringify({ roundNumber: number, selectedValue: round.targetValue }),
    });
    if (!result.completed) round = result.nextRound;
    if (number === game.totalRounds && !result.completed) throw new Error('Final round did not complete');
  }

  const result = await request(`/games/${game.gameId}/finish`, { method: 'POST', headers: auth });
  if (result.totalScore <= 0 || result.correct !== game.totalRounds) throw new Error(`Invalid result for ${game.gameId}`);
  return game.gameId;
}

for (const count of roundsToRun) {
  const startedAt = Date.now();
  const gameIds = await Promise.all(Array.from({ length: count }, (_, i) => play(i + 1)));
  if (new Set(gameIds).size !== count) throw new Error(`${count} players received duplicate game IDs`);

  const leaderboard = await request('/leaderboard');
  const visibleIds = new Set(leaderboard.map((entry) => entry.id));
  const visible = gameIds.filter((id) => visibleIds.has(id)).length;
  console.log(`${count} concurrent players: ${visible}/${count} games appeared in Top 10; ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
}

console.log('Load test completed. Run this only against a test event/database; it creates player and game records.');
