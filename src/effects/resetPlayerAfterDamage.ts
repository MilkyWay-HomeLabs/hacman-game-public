import * as React from "react";

/**
 * Parameters for resetting a player position after taking damage
 */
interface ResetPlayerParams {
    /** Position where the player should be teleported */
    startPosition: { x: number; y: number };
    /** Setter for player lives count */
    setLives: React.Dispatch<React.SetStateAction<number>>;
    /** Setter for forced player position (triggers teleport) */
    setForcedPlayerPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
    /** Setter for teleport signal counter */
    setTeleportSignal: React.Dispatch<React.SetStateAction<number>>;
    /** Setter for invulnerability state */
    setIsInvulnerable: React.Dispatch<React.SetStateAction<boolean>>;
    /** Ref tracking reset counter */
    resetCounterRef: { current: number };
    /** Ref indicating if a reset is in progress */
    resetInProgressRef: { current: boolean };
    /** Ref storing timeout ID for reset clearing */
    resetClearTimeoutRef: { current: number | null };
    /** Ref storing timeout ID for invulnerability */
    invulnerabilityTimeoutRef: { current: number | null };
}

/** Duration in ms before the reset state is cleared */
const RESET_DELAY_MS = 250;
/** Duration in ms for temporary invulnerability after damage */
const INVULNERABILITY_MS = 1500;

/**
 * Handles player reset after taking damage from spikes or enemies.
 *
 * This function:
 * - Decrements player lives by 1
 * - Teleports player to start position
 * - Triggers reset state with timeout
 * - Grants temporary invulnerability
 *
 * @param params - Reset configuration parameters
 *
 * @example
 * ```ts
 * resetPlayerAfterDamage({
 *   startPosition: { x: 1, y: 1 },
 *   setLives,
 *   setForcedPlayerPosition,
 *   setTeleportSignal,
 *   setIsInvulnerable,
 *   resetCounterRef,
 *   resetInProgressRef,
 *   resetClearTimeoutRef,
 *   invulnerabilityTimeoutRef
 * });
 *
 **/
export const resetPlayerAfterDamage = ({
  startPosition,
  setLives,
  setForcedPlayerPosition,
  setTeleportSignal,
  setIsInvulnerable,
  resetCounterRef,
  resetInProgressRef,
  resetClearTimeoutRef,
  invulnerabilityTimeoutRef
}: ResetPlayerParams) => {
  setLives(prev => prev - 1);
  setForcedPlayerPosition(startPosition);
  resetCounterRef.current += 1;
  resetInProgressRef.current = true;
  setTeleportSignal(s => s + 1);

  if (resetClearTimeoutRef.current) {
    clearTimeout(resetClearTimeoutRef.current);
  }
  resetClearTimeoutRef.current = window.setTimeout(() => {
    resetInProgressRef.current = false;
    resetCounterRef.current = 0;
    resetClearTimeoutRef.current = null;
  }, RESET_DELAY_MS);

  setIsInvulnerable(true);
  if (invulnerabilityTimeoutRef.current) {
    clearTimeout(invulnerabilityTimeoutRef.current);
  }
  invulnerabilityTimeoutRef.current = window.setTimeout(() => {
    setIsInvulnerable(false);
    invulnerabilityTimeoutRef.current = null;
  }, INVULNERABILITY_MS);
};