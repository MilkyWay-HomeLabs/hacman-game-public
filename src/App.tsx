import './App.css';
import './style/Enemies.css';
import './style/Buffs.css';
import './style/Debuffs.css';
import {usePlayerMovement} from './hooks/usePlayerMovement';
import {useEnemiesController} from './hooks/useEnemiesController';
import {usePlayerEffects} from "./hooks/usePlayerEffects.ts";
import {useMagnet} from "./hooks/useMagnet.ts";
import {useTimer} from "./hooks/useTimer.ts";
import { useAppEffects } from './hooks/useAppEffects.ts';
import {useGameState} from './hooks/useGameState';
import {useCollisionHandler} from './hooks/useCollisionHandler';
import useEnemyPickups from "./hooks/useEnemyPickups.ts";
import {useScoreSubmission} from "./hooks/useScoreSubmission.ts";
import {useResponsiveCellSize} from "./hooks/useResponsiveCellSize.ts";
import {buildReturnUrl} from "./utils/returnUrl.ts";
import {elapsedMs, formatTime, resolveTimeLeft} from "./domain/score.ts";
import {enemySpeedMultiplierForDifficulty, playerSpeedForDifficulty} from "./domain/speed.ts";
import {PlayScreen} from "./screens/PlayScreen.tsx";
import {GameOverScreen} from "./screens/GameOverScreen.tsx";
import {WinScreen} from "./screens/WinScreen.tsx";
import {TouchControls} from "./component/TouchControls.tsx";
import type {MazeData} from './types/maze';
import type {GalleryInfo} from './api/mappers/gallery';

interface AppProps {
    /** Maze to play (chosen in the difficulty dialog). Falls back to the dev testMaze. */
    mazeData?: MazeData | null;
    /** Gallery the maze belongs to; required to submit the score on win. */
    galleryId?: string;
    /** Gallery presentation data (image-folder id); null/absent hides the progress images. */
    gallery?: GalleryInfo | null;
}

function App({mazeData: injectedMaze, galleryId, gallery}: AppProps = {}) {

    const {
        playerDirection, setPlayerDirection,
        forcedPlayerPosition, setForcedPlayerPosition,
        isInvulnerable, setIsInvulnerable,
        mazeData, activeDots, setActiveDots, collectedDots, setCollectedDots, initialTotalDots,
        enemyPositions, setEnemyPositions,
        buffPositions, setBuffPositions, buffMetaAt, setBuffMetaAt,
        debuffPositions, setDebuffPositions, debuffMetaAt, setDebuffMetaAt,
        lives, setLives, gameOver, setGameOver, gameWon, setGameWon,
        imageIndex, teleportSignal, setTeleportSignal,
        timerSeconds, setTimerSeconds, timerStarted, setTimerStarted,

        frozenUntil,
        difficulty,
        timerIntervalRef,
        timerDuration,
        resetCounterRef, invulnTimeoutRef, resetInProgressRef, resetClearTimeoutRef, initialPlayerPositionRef
    } = useGameState(injectedMaze);

    const {
        playerEffects,
        hasPlayerEffect,
        addPlayerEffect
    } = usePlayerEffects();

    const invertControls = (() => {
        // Debuff confuse. Reading the clock during render is intentional: this reflects whether
        // the timed effect is still active as of this render.
        const exp = playerEffects.get('confuse');
        // eslint-disable-next-line react-hooks/purity
        return typeof exp === 'number' && exp > Date.now();
    })();

    const {position: playerPosition, move: movePlayer, release: releasePlayer} = usePlayerMovement({
        initialPosition: (forcedPlayerPosition ?? mazeData?.player.start_position) ?? {x: 1, y: 1},
        maze: mazeData?.cells ?? [],
        onDirectionChange: setPlayerDirection,
        // eslint-disable-next-line react-hooks/purity -- reflects the freeze window as of this render
        disabled: (gameOver || gameWon || Date.now() < frozenUntil),
        invertControls,
        teleportSignal,
        teleportTo: mazeData?.player.start_position ?? {x: 1, y: 1},
        // Base glide speed scales with difficulty (easy 4 / medium 4.5 / hard 5 cells/s).
        baseSpeedCellsPerSec: playerSpeedForDifficulty(difficulty),
        // Buff 'speed': glide 1.5x faster while the timed effect is active.
        speedMultiplier: hasPlayerEffect('speed') ? 1.5 : 1
    });

    // Enemies movement controller (Random Walker baseline). It reads initial enemyPositions
    // to create runtimes and then continuously updates setEnemyPositions with moving enemies.
    const enemiesApi = useEnemiesController({
        cells: mazeData?.cells || [],
        player: playerPosition,
        playerInvisible: hasPlayerEffect('invisibility'),
        enemySpeedMultiplier: enemySpeedMultiplierForDifficulty(difficulty),
        enemyPositions,
        setEnemyPositions,
    });

    // now call useCollisionHandler with a real playerPosition (not null)
    useCollisionHandler({
        playerPosition,
        mazeData,
        enemyPositions,
        buffPositions,
        debuffPositions,
        buffMetaAt,
        debuffMetaAt,
        hasPlayerEffect,
        addPlayerEffect,
        enemiesApi,
        setGameOver,
        setLives,
        setForcedPlayerPosition,
        setTeleportSignal,
        setIsInvulnerable,
        resetCounterRef,
        resetInProgressRef,
        resetClearTimeoutRef,
        invulnTimeoutRef,
        setBuffPositions,
        setBuffMetaAt,
        setDebuffPositions,
        setDebuffMetaAt,
        setEnemyPositions,
        lives,
        isInvulnerable,
        gameOver,
        gameWon,
    });
    // Cell size scales with the viewport so the whole board fits without horizontal scroll.
    const CELL_SIZE = useResponsiveCellSize(mazeData?.width, mazeData?.height);
    useMagnet({
        playerPosition,
        hasPlayerEffect,
        setActiveDots,
        setCollectedDots
    });

    useTimer({
        timerStarted,
        setTimerStarted,
        setTimerSeconds,
        timerIntervalRef,
        onTimeExpired: () => {
            setGameOver(true);
        }
    });

    useAppEffects({
        mazeData,
        initialPlayerPositionRef,
        playerPosition,
        timerStarted,
        setTimerStarted,
        timerIntervalRef,
        setTimerSeconds,
        invulnTimeoutRef,
        resetClearTimeoutRef,
        gameOver,
        gameWon,
        activeDots,
        setActiveDots,
        setCollectedDots,
        hasPlayerEffect,
        playerEffects,
        setForcedPlayerPosition,
        setTeleportSignal,
        collectedDots,
        setGameWon,
    });

    useEnemyPickups({
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
    });

    // Elapsed play time (countdown: duration minus remaining). Submitted to the API on win.
    const scoreSubmission = useScoreSubmission({
        won: gameWon,
        galleryId,
        difficulty,
        timeMs: elapsedMs(timerDuration, timerSeconds),
    });


    const handleDeploy = () => {
        // Return the player to the Nebula gallery they came from (score is submitted via
        // the API on win). Host-validated to avoid an open redirect from document.referrer.
        window.location.href = buildReturnUrl({
            referrer: document.referrer,
            fallbackUrl: import.meta.env.VITE_NEBULA_RETURN_URL,
            galleryId,
        });
    };

    const timeLeft: number | null = resolveTimeLeft(timerStarted, timerSeconds);

    const handleRetry = () => {
        // Easiest reliable reset for all game state and refs
        // (ensures useGameInitializer runs again and timers are cleared)
        window.location.reload();
    };

    return (
        <div className="app-container">
            <h1 className="app-title">Maze Matrix</h1>
            {mazeData && (
                <PlayScreen
                    mazeData={mazeData}
                    playerPosition={playerPosition}
                    playerDirection={playerDirection}
                    isInvulnerable={isInvulnerable}
                    enemyPositions={enemyPositions}
                    buffPositions={buffPositions}
                    debuffPositions={debuffPositions}
                    activeDots={activeDots}
                    cellSize={CELL_SIZE}
                    timeLeft={timeLeft}
                    totalTime={timerDuration}
                    lives={lives}
                    imageIndex={imageIndex}
                    initialTotalDots={initialTotalDots}
                    collectedDots={collectedDots}
                    gameWon={gameWon}
                    onDeploy={handleDeploy}
                    formatTime={formatTime}
                    gallery={gallery}
                />
            )}
            {mazeData && !gameOver && !gameWon && (
                <TouchControls onMove={movePlayer} onRelease={releasePlayer} />
            )}
            {gameOver && <GameOverScreen onRetry={handleRetry} />}
            {gameWon && (
                <WinScreen
                    imageIndex={imageIndex}
                    gallery={gallery}
                    scoreStatus={scoreSubmission.status}
                    onRetryScore={scoreSubmission.retry}
                    onDeploy={handleDeploy}
                />
            )}
        </div>
    );
}

export default App;
