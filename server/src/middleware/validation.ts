export function validateNickname(name: string): string {
    if (typeof name !== 'string') throw new Error('Nickname is required');
    const clean = name.normalize('NFKC').trim();
    if (clean.length < 2 || clean.length > 16) throw new Error('Nickname must contain 2 to 16 characters');
    // Allow alphanumeric, spaces, dashes, underscores
    if (!/^[a-zA-Z0-9_\- ]+$/.test(clean)) {
        throw new Error('Nickname contains invalid characters');
    }
    return clean;
}

export function validateGameId(id: string): void {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        throw new Error('Invalid Game ID');
    }
}

export function validateRoundData(data: any): void {
    if (!Number.isInteger(data.roundNumber) || data.roundNumber < 1 || data.roundNumber > 100) throw new Error('Invalid round number');
    // Allow null or string
    if (data.selectedValue !== null && typeof data.selectedValue !== 'string') {
        throw new Error('Invalid selected value');
    }
}
