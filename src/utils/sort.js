const collator = new Intl.Collator('pt-PT', { sensitivity: 'base', numeric: true });

export function ptCompare(a, b) {
    return collator.compare(a ?? '', b ?? '');
}
