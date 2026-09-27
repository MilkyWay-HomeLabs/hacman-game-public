import {type Dispatch, type SetStateAction, useEffect} from 'react';
import type {Buff, Debuff} from '../types/maze';
import type {EnemiesAPI} from './useEnemiesController';

type SetMap<T> = Dispatch<SetStateAction<Map<string, T>>>;

type Args = {
    enemyPositions: Map<string, string>;
    debuffPositions: Map<string, string>;
    buffPositions: Map<string, string>;
    debuffMetaAt: Map<string, Debuff>;
    buffMetaAt: Map<string, Buff>;
    enemiesApi: EnemiesAPI;
    setDebuffPositions: SetMap<string>;
    setDebuffMetaAt: SetMap<Debuff>;
    setBuffPositions: SetMap<string>;
    setBuffMetaAt: SetMap<Buff>;
    setEnemyPositions: SetMap<string>;
};

export default function useEnemyPickups({
                                            enemyPositions,
                                            debuffPositions,
                                            buffPositions,
                                            debuffMetaAt,
                                            buffMetaAt,
                                            enemiesApi,
                                            setDebuffPositions,
                                            setDebuffMetaAt,
                                            setBuffPositions,
                                            setBuffMetaAt,
                                            setEnemyPositions,
                                        }: Args) {
    useEffect(() => {
        for (const [key] of enemyPositions) {
            const [x, y] = key.split('-').map(Number);

            const debMeta = debuffMetaAt.get(key);
            if (debMeta) {
                const rules = debMeta.rules || {pickupBy: ['player', 'enemy'], destroyOnTouch: true};
                if ((rules.pickupBy || ['player', 'enemy']).includes('enemy')) {
                    const style = debuffPositions.get(key) || debMeta.style || '';
                    const debKind = (() => {
                        if (style.includes('debuff-7') || debMeta.type === 'spike') return 'spike';
                        if (style.includes('debuff-8') || debMeta.type === 'freeze') return 'freeze';
                        if (style.includes('debuff-9') || debMeta.type === 'rust') return 'rust';
                        return null;
                    })();

                    if (debKind === 'spike') {
                        try {
                            enemiesApi.destroyAt(x, y);
                        } catch {
                            // Best-effort enemy interaction: ignore if no runtime exists at (x,y).
                        }
                        setDebuffPositions(prev => {
                            const next = new Map(prev);
                            next.delete(key);
                            return next;
                        });
                        setDebuffMetaAt(prev => {
                            const next = new Map(prev);
                            next.delete(key);
                            return next;
                        });
                        setEnemyPositions(prev => {
                            const next = new Map(prev);
                            next.delete(key);
                            return next;
                        });
                        continue;
                    }

                    if (debKind === 'freeze') {
                        try {
                            enemiesApi.freezeAt(x, y, (debMeta?.effect?.durationMs ?? 2000));
                        } catch {
                            // Best-effort enemy interaction: ignore if no runtime exists at (x,y).
                        }
                        if (rules.destroyOnTouch) {
                            setDebuffPositions(prev => {
                                const next = new Map(prev);
                                next.delete(key);
                                return next;
                            });
                            setDebuffMetaAt(prev => {
                                const next = new Map(prev);
                                next.delete(key);
                                return next;
                            });
                        }
                    }

                    if (debKind === 'rust') {
                        const stacks = debMeta?.effect?.enemy?.rustStack ?? 1;
                        try {
                            enemiesApi.addRustAt(x, y, stacks);
                        } catch {
                            // Best-effort enemy interaction: ignore if no runtime exists at (x,y).
                        }
                        if (rules.destroyOnTouch) {
                            setDebuffPositions(prev => {
                                const next = new Map(prev);
                                next.delete(key);
                                return next;
                            });
                            setDebuffMetaAt(prev => {
                                const next = new Map(prev);
                                next.delete(key);
                                return next;
                            });
                        }
                    }
                }
            }

            const buffMeta = buffMetaAt.get(key);
            if (buffMeta) {
                const rules = buffMeta.rules || {pickupBy: ['player'], destroyOnTouch: true};
                if ((rules.pickupBy || ['player']).includes('enemy')) {
                    const style = buffPositions.get(key) || buffMeta.style || '';
                    const buffKind = (() => {
                        if (style.includes('buff-2') || buffMeta.type === 'speed') return 'speed';
                        if (style.includes('buff-4') || buffMeta.type === 'damage') return 'damage';
                        return null;
                    })();

                    if (buffKind === 'speed') {
                        try {
                            enemiesApi.addSpeedBuffAt(
                                x,
                                y,
                                (buffMeta?.effect?.speedMultiplier ?? 1.5),
                                (buffMeta?.effect?.durationMs ?? 8000)
                            );
                        } catch {
                            // Best-effort enemy interaction: ignore if no runtime exists at (x,y).
                        }
                        if (rules.destroyOnTouch) {
                            setBuffPositions(prev => {
                                const next = new Map(prev);
                                next.delete(key);
                                return next;
                            });
                            setBuffMetaAt(prev => {
                                const next = new Map(prev);
                                next.delete(key);
                                return next;
                            });
                        }
                    }

                    if (buffKind === 'damage') {
                        try {
                            enemiesApi.addSpeedBuffAt(x, y, 1.2, (buffMeta?.effect?.durationMs ?? 7000));
                        } catch {
                            // Best-effort enemy interaction: ignore if no runtime exists at (x,y).
                        }
                        if (rules.destroyOnTouch) {
                            setBuffPositions(prev => {
                                const next = new Map(prev);
                                next.delete(key);
                                return next;
                            });
                            setBuffMetaAt(prev => {
                                const next = new Map(prev);
                                next.delete(key);
                                return next;
                            });
                        }
                    }
                }
            }
        }
    }, [
        enemyPositions,
        debuffPositions,
        buffPositions,
        debuffMetaAt,
        buffMetaAt,
        enemiesApi,
        setDebuffPositions,
        setDebuffMetaAt,
        setBuffPositions,
        setBuffMetaAt,
        setEnemyPositions,
    ]);
}
