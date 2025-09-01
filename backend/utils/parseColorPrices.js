export default function parseColorPrices(str) {
    if (!str) return [];
    return String(str)
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => {
            const parts = p.split(':').map(s => s.trim());
            const value = parts[1];
            return value ? parseFloat(value) : undefined;
        })
        .filter(v => v !== undefined && !Number.isNaN(v));
}