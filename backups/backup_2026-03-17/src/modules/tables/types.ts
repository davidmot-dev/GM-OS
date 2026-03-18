export interface TableEntry {
    min: number;
    max: number;
    title: string;
    description: string;
    effect?: string;
}

export interface TableData {
    name: string;
    dice: string;
    entries: TableEntry[];
}

export interface TableResult {
    rawRoll: number;
    modifier: number;
    finalValue: number;
    entry: TableEntry;
    timestamp: number;
    tableName: string;
}

export interface TableBridge {
    listUniverses: () => Promise<string[]>;
    listTables: (universe: string) => Promise<string[]>;
    loadTable: (universe: string, tableName: string) => Promise<TableData | null>;
}
