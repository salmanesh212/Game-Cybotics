import crypto from 'crypto';
import { pool } from '../database/pool';
import { serverConfig } from '../config';
import { ScoringService } from './scoring.service';

const COLORS = ['🔴', '🟢', '🔵', '🟡', '🟣', '🟠'];
const EMOJIS = ['🤖', '🚀', '🎯', '😎', '😂', '🔥', '⭐', '⚡', '🧠', '👾'];

// Better PRNG than before, taking full hex seed
function mulberry32(a: number) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function generateRoundConfig(prng: () => number, roundNumber: number) {
    let poolItems = COLORS;
    let gridCells = 9;
    
    if (roundNumber >= 19) {
        poolItems = [...COLORS, ...EMOJIS];
        gridCells = 20;
    } else if (roundNumber >= 16) {
        poolItems = [...COLORS, ...EMOJIS];
        gridCells = 16;
    } else if (roundNumber >= 11) {
        poolItems = [...COLORS, ...EMOJIS];
        gridCells = 16;
    } else if (roundNumber >= 6) {
        poolItems = [...COLORS, ...EMOJIS];
        gridCells = 12;
    }
    
    const targetIdx = Math.floor(prng() * poolItems.length);
    const target = poolItems[targetIdx];
    
    const distractors = poolItems.filter(i => i !== target);
    const grid: string[] = [];
    
    for (let i = 0; i < gridCells; i++) {
        grid.push(distractors[Math.floor(prng() * distractors.length)]);
    }
    
    const targetCount = (roundNumber >= 16) ? 1 : 1 + Math.floor(prng() * 3);
    for (let i = 0; i < targetCount; i++) {
        grid[Math.floor(prng() * gridCells)] = target;
    }
    
    return {
        targetType: roundNumber > 5 ? 'mixed' : 'color',
        targetValue: target,
        grid
    };
}

function readGrid(value: unknown): string[] {
    const grid = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(grid) || !grid.every((item) => typeof item === 'string')) {
        throw new Error('Invalid stored round grid');
    }
    return grid;
}

export class GameService {
    static async startGame(playerId: string, eventId: string) {
        const seed = crypto.randomBytes(4).readUInt32BE(0); // Using actual 32-bit integer for seed
        const totalRounds = serverConfig.DEFAULT_ROUNDS;
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const gameRes = await client.query(
                'INSERT INTO games (player_id, event_id, seed, total_rounds, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [playerId, eventId, seed.toString(), totalRounds, 'active']
            );
            const gameId = gameRes.rows[0].id;
            
            const prng = mulberry32(seed);
            
            const roundConfigs = [];
            for (let r = 1; r <= totalRounds; r++) {
                const conf = generateRoundConfig(prng, r);
                roundConfigs.push({ roundNumber: r, ...conf });
                await client.query(
                    'INSERT INTO game_rounds (game_id, round_number, target_type, target_value, grid_data) VALUES ($1, $2, $3, $4, $5)',
                    [gameId, r, conf.targetType, conf.targetValue, JSON.stringify(conf.grid)]
                );
            }

            await client.query(
                'UPDATE game_rounds SET presented_at = clock_timestamp() WHERE game_id = $1 AND round_number = 1',
                [gameId]
            );
            
            await client.query('COMMIT');
            
            return {
                gameId,
                totalRounds,
                firstRound: roundConfigs[0]
            };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
    
    static async getRoundConfig(gameId: string, roundNumber: number) {
        const res = await pool.query(
            'UPDATE game_rounds SET presented_at = COALESCE(presented_at, clock_timestamp()) WHERE game_id = $1 AND round_number = $2 RETURNING target_type, target_value, grid_data',
            [gameId, roundNumber]
        );
        if (res.rows.length === 0) throw new Error('Round not found');
        const row = res.rows[0];
        return {
            roundNumber: roundNumber,
            targetType: row.target_type,
            targetValue: row.target_value,
            grid: readGrid(row.grid_data)
        };
    }
    
    static async submitRound(gameId: string, roundNumber: number, selectedValue: string | null) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const gameRes = await client.query('SELECT status FROM games WHERE id = $1 FOR UPDATE', [gameId]);
            if (gameRes.rows.length === 0 || gameRes.rows[0].status !== 'active') {
                throw new Error('Game is not active');
            }
            
            const roundRes = await client.query(
                'SELECT target_value, grid_data, answered_at FROM game_rounds WHERE game_id = $1 AND round_number = $2 FOR UPDATE',
                [gameId, roundNumber]
            );
            
            if (roundRes.rows.length === 0) throw new Error('Round not found');
            // Check answered_at, not selected_value, to prevent re-submission of timeouts
            if (roundRes.rows[0].answered_at !== null) throw new Error('Round already submitted');

            const orderRes = await client.query(
                'SELECT COUNT(*)::int AS answered FROM game_rounds WHERE game_id = $1 AND answered_at IS NOT NULL',
                [gameId]
            );
            if (roundNumber !== orderRes.rows[0].answered + 1) throw new Error('Rounds must be submitted in order');

            const timingRes = await client.query(
                'SELECT GREATEST(1, FLOOR(EXTRACT(EPOCH FROM (clock_timestamp() - presented_at)) * 1000))::int AS elapsed_ms FROM game_rounds WHERE game_id = $1 AND round_number = $2 AND presented_at IS NOT NULL',
                [gameId, roundNumber]
            );
            if (timingRes.rows.length === 0) throw new Error('Round has not been presented');
            const reactionTimeMs = timingRes.rows[0].elapsed_ms as number;
            if (reactionTimeMs < 75 || reactionTimeMs > 30000) throw new Error('Invalid response timing');
            
            const grid = readGrid(roundRes.rows[0].grid_data);
            if (selectedValue !== null && !grid.includes(selectedValue)) {
                throw new Error('Selected value not in grid');
            }
            
            const isCorrect = selectedValue === roundRes.rows[0].target_value;
            
            const prevRoundRes = await client.query(
                'SELECT combo_at FROM game_rounds WHERE game_id = $1 AND round_number = $2',
                [gameId, roundNumber - 1]
            );
            const currentCombo = prevRoundRes.rows.length > 0 ? prevRoundRes.rows[0].combo_at : 0;
            
            const { score, newCombo, speedBonus, comboMultiplier } = ScoringService.calculateRoundScore(isCorrect, reactionTimeMs, currentCombo);
            
            await client.query(
                'UPDATE game_rounds SET selected_value = $1, is_correct = $2, reaction_time_ms = $3, score_earned = $4, combo_at = $5, answered_at = NOW() WHERE game_id = $6 AND round_number = $7',
                [selectedValue, isCorrect, reactionTimeMs, score, newCombo, gameId, roundNumber]
            );

            await client.query(
                'UPDATE game_rounds SET presented_at = clock_timestamp() WHERE game_id = $1 AND round_number = $2',
                [gameId, roundNumber + 1]
            );
            
            await client.query('COMMIT');
            return { isCorrect, score, combo: newCombo, speedBonus, comboMultiplier };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
    
    static async finishGame(gameId: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const gameRes = await client.query('SELECT status, started_at, total_rounds FROM games WHERE id = $1 FOR UPDATE', [gameId]);
            if (gameRes.rows.length === 0) throw new Error('Game not found');
            if (gameRes.rows[0].status === 'completed') {
                const existing = await client.query(
                    'SELECT score AS "totalScore", max_combo AS "maxCombo", correct_answers AS correct, errors, avg_reaction_ms AS "avgReaction", best_reaction_ms AS "bestReaction" FROM games WHERE id = $1',
                    [gameId]
                );
                await client.query('COMMIT');
                return existing.rows[0];
            }
            if (gameRes.rows[0].status !== 'active') throw new Error('Game not active');
            
            const roundsRes = await client.query('SELECT * FROM game_rounds WHERE game_id = $1 ORDER BY round_number ASC', [gameId]);
            const rounds = roundsRes.rows;
            
            if (rounds.some((r: any) => r.answered_at === null)) {
                throw new Error('Not all rounds submitted');
            }
            
            // Validate realistic duration
            const durationMs = new Date().getTime() - new Date(gameRes.rows[0].started_at).getTime();
            // Assuming absolute minimum of 300ms per round
            if (durationMs < gameRes.rows[0].total_rounds * 300) {
                throw new Error('Game duration too short');
            }
            
            const stats = ScoringService.calculateGameStats(rounds);
            
            await client.query(`
                UPDATE games 
                SET status = 'completed', score = $1, max_combo = $2, correct_answers = $3, errors = $4, avg_reaction_ms = $5, best_reaction_ms = $6, finished_at = NOW(), submitted = TRUE
                WHERE id = $7
            `, [stats.totalScore, stats.maxCombo, stats.correct, stats.errors, stats.avgReaction, stats.bestReaction, gameId]);
            
            await client.query('COMMIT');
            return stats;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
    
    static async getGameState(gameId: string) {
        const res = await pool.query('SELECT id, player_id as "playerId", event_id as "eventId", total_rounds as "totalRounds", status FROM games WHERE id = $1', [gameId]);
        return res.rows[0];
    }
    
    static async expireStaleGames() {
        await pool.query("UPDATE games SET status = 'expired' WHERE status = 'active' AND started_at < NOW() - INTERVAL '10 minutes'");
    }
}
