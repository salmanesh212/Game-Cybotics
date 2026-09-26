export const ScoringService = {
    BASE_CORRECT: 100,
    BASE_WRONG: -50,
    
    calculateRoundScore(isCorrect: boolean, reactionTimeMs: number, currentCombo: number) {
        if (!isCorrect) {
            return { score: this.BASE_WRONG, newCombo: 0, speedBonus: 0, comboMultiplier: 1.0 };
        }
        
        let speedBonus = 0;
        if (reactionTimeMs < 300) speedBonus = 100;
        else if (reactionTimeMs <= 500) speedBonus = 75;
        else if (reactionTimeMs <= 800) speedBonus = 50;
        else if (reactionTimeMs <= 1200) speedBonus = 25;
        
        const newCombo = currentCombo + 1;
        let comboMultiplier = 1.0;
        if (newCombo === 2) comboMultiplier = 1.2;
        else if (newCombo === 3) comboMultiplier = 1.5;
        else if (newCombo === 4) comboMultiplier = 1.8;
        else if (newCombo >= 5) comboMultiplier = 2.0;
        
        const score = Math.round((this.BASE_CORRECT + speedBonus) * comboMultiplier);
        return { score, newCombo, speedBonus, comboMultiplier };
    },
    
    calculateGameStats(rounds: any[]) {
        let totalScore = 0;
        let maxCombo = 0;
        let correct = 0;
        let errors = 0;
        let bestReaction = 999999;
        let sumReaction = 0;
        
        for (const r of rounds) {
            totalScore += r.score_earned || 0;
            if (r.combo_at > maxCombo) maxCombo = r.combo_at;
            if (r.is_correct) {
                correct++;
                if (r.reaction_time_ms < bestReaction) bestReaction = r.reaction_time_ms;
            } else if (r.is_correct === false) {
                errors++;
            }
            if (r.reaction_time_ms) {
                sumReaction += r.reaction_time_ms;
            }
        }
        
        const validRounds = correct + errors;
        const avgReaction = validRounds > 0 ? Math.round(sumReaction / validRounds) : 0;
        if (bestReaction === 999999) bestReaction = 0;
        
        return { totalScore, avgReaction, bestReaction, maxCombo, correct, errors };
    }
};
