export const ScoringService = {
    BASE_CORRECT: 100,
    BASE_WRONG: -50,
    
    // Exactly matches backend logic
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
    }
};
