/**
 * Types liés aux systèmes de santé et de dégâts.
 */

export interface PersistenceBadge {
    id: string;
    label: string;
    description: string;
    severity: 'minor' | 'major' | 'critical';
    location?: string;
}

export interface HealthSystem {
    type: string;
    data: Record<string, unknown>;
    state: 'healthy' | 'scratched' | 'wounded' | 'critical' | 'dead';
    badges: PersistenceBadge[];
}

export interface DamageImpact {
    value: number;
    type?: string;
    location?: string;
    isRecovery?: boolean;
}
