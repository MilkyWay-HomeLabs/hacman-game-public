export const testMaze = {
    "width": 40, // maze width in cells
    "height": 40, // maze height in cells
    "random_seed": 12345, // random seed for maze generation
    "difficulty": "medium",
    "placement_rules": {
        "allowed_on": "road", // allowed on the road only (0 = cell value)
        "avoid_adjacent_walls": false // false avoid placing enemies next to walls
    },
    "cells": [ // maze cells
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    "player": {
        "start_position": {"x": 21, "y": 21}, // Player's starting positon (x, y)
        "direction": "right" // Optional starting direction: "up", "down", "left", "right"
    },
    "enemies": [ // store enemies in the maze
        {
            "type": "ghost", // enemy type
            "id": "blinky", // unique enemy id
            "style": "enemy-1", // css style from style/Enemies.css
            "static_positions": [{"x": 10, "y": 1}], // static positon
            "random_count": 2, // random count
            "notes": "mix static and random enemies" // description
        },
        {
            "type": "scorpion",
            "id": "scorpius",
            "style": "enemy-6",
            "static_positions": [], // no static position
            "random_count": 1 // only one random position enemy
        },
        {
            "type": "patroller",
            "id": "patrolA",
            "style": "enemy-7",
            "static_positions": [{"x": 28, "y": 1}],
            "random_count": 0
        }
    ],
    "buffs": [ // store buffs in the maze
        // Speed (buff-2): +60% speed for 8s
        {
            "type": "speed",
            "id": "speed_up_1",
            "style": "buff-2",
            "static_positions": [],
            "random_count": 2,
            "effect": {"id": "buff-2", "kind": "speed", "scope": "player", "durationMs": 8000, "speedMultiplier": 1.6},
            "rules": {"pickupBy": ["player", "enemy"], "destroyOnTouch": true}
        },
        // Health (buff-1): +1 life
        {
            "type": "health",
            "id": "extra_life",
            "style": "buff-1",
            "static_positions": [],
            "random_count": 1,
            "effect": {"id": "buff-1", "kind": "health", "scope": "player", "durationMs": 0},
            "rules": {"pickupBy": ["player"], "destroyOnTouch": true}
        },
        // Shield (buff-3): invulnerability 6s
        {
            "type": "shield",
            "id": "shield_small",
            "style": "buff-3",
            "static_positions": [],
            "random_count": 2,
            "effect": {"id": "buff-3", "kind": "shield", "scope": "player", "durationMs": 6000, "invulnerable": true},
            "rules": {"pickupBy": ["player"], "destroyOnTouch": true}
        },
        // Damage/Power (buff-4): kill enemies on touch for 7s
        {
            "type": "damage",
            "id": "power_mode",
            "style": "buff-4",
            "static_positions": [{"x": 28, "y": 1}],
            "random_count": 1,
            "effect": {"id": "buff-4", "kind": "damage", "scope": "player", "durationMs": 7000, "killOnTouch": true},
            "rules": {"pickupBy": ["player", "enemy"], "destroyOnTouch": true}
        },
        // EMP Pulse (buff-5): freeze enemies in radius and disarm debuffs
        {
            "type": "emp",
            "id": "emp_pulse",
            "style": "buff-5",
            "static_positions": [],
            "random_count": 1,
            "effect": {
                "id": "buff-5",
                "kind": "emp",
                "scope": "global",
                "durationMs": 0,
                "extra": {"empRange": 4, "enemyFreezeMs": 2500, "disarmDebuffs": ["spike", "glitch"]}
            },
            "rules": {"pickupBy": ["player"], "destroyOnTouch": true}
        },
        // Teleport (buff-6): instant teleport to a random road tile
        {
            "type": "teleport",
            "id": "tele1",
            "style": "buff-6",
            "static_positions": [{"x": 21, "y": 20}],
            "random_count": 1,
            "description": "teleport - one static and one random position",
            "effect": {"id": "buff-6", "kind": "teleport", "scope": "player", "durationMs": 0},
            "rules": {"pickupBy": ["player"], "destroyOnTouch": true}
        },
        // Time bonus (buff-7): +20s
        {
            "type": "time",
            "id": "bonus_time",
            "style": "buff-7",
            "static_positions": [],
            "random_count": 1,
            "effect": {"id": "buff-7", "kind": "time", "scope": "player", "durationMs": 0, "timeBonusSec": 20},
            "rules": {"pickupBy": ["player"], "destroyOnTouch": true}
        },
        // Invisibility (buff-8): enemies ignore player for 6s
        {
            "type": "invisibility",
            "id": "ghost_mode",
            "style": "buff-8",
            "static_positions": [],
            "random_count": 1,
            "effect": {"id": "buff-8", "kind": "invisibility", "scope": "player", "durationMs": 6000},
            "rules": {"pickupBy": ["player"], "destroyOnTouch": true}
        },
        // Magnet (buff-9): auto collect dots within range 3 for 8s
        {
            "type": "magnet",
            "id": "magnetize",
            "style": "buff-9",
            "static_positions": [],
            "random_count": 1,
            "effect": {"id": "buff-9", "kind": "magnet", "scope": "player", "durationMs": 8000, "magnetRange": 3},
            "rules": {"pickupBy": ["player"], "destroyOnTouch": true}
        },
        // Random (buff-10): random one of the above
        {
            "type": "random",
            "id": "randomizer",
            "style": "buff-10",
            "static_positions": [],
            "random_count": 1,
            "effect": {"id": "buff-10", "kind": "random", "scope": "player", "durationMs": 0},
            "rules": {"pickupBy": ["player"], "destroyOnTouch": true}
        }
    ],
    "debuffs": [ // store debuffs in the maze
        // Poison (debuff-1)
        {
            "type": "poison",
            "id": "poison_cloud",
            "style": "debuff-1",
            "effect": {"id": "debuff-1", "kind": "poison", "scope": "player", "durationMs": 6000},
            "static_positions": [],
            "random_count": 1,
            "rules": {"pickupBy": ["player", "enemy"], "destroyOnTouch": true}
        },
        // Slow (debuff-2): player speed down for 6s; enemies can ignore or be affected later
        {
            "type": "slow",
            "id": "slow_60",
            "style": "debuff-2",
            "effect": {
                "id": "debuff-2",
                "kind": "slow",
                "scope": "player",
                "durationMs": 6000,
                "player": {"speedMultiplier": 0.6}
            },
            "static_positions": [],
            "random_count": 2,
            "rules": {"pickupBy": ["player", "enemy"], "destroyOnTouch": true}
        },
        // Blind (debuff-3)
        {
            "type": "blind",
            "id": "darkness",
            "style": "debuff-3",
            "effect": {
                "id": "debuff-3",
                "kind": "blind",
                "scope": "player",
                "durationMs": 6000,
                "player": {"visionRange": 2}
            },
            "static_positions": [],
            "random_count": 1,
            "rules": {"pickupBy": ["player", "enemy"], "destroyOnTouch": true}
        },
        // Burn (debuff-4)
        {
            "type": "burn",
            "id": "hot_floor",
            "style": "debuff-4",
            "effect": {"id": "debuff-4", "kind": "burn", "scope": "player", "durationMs": 3000},
            "static_positions": [],
            "random_count": 1,
            "rules": {"pickupBy": ["player", "enemy"], "destroyOnTouch": true}
        },
        // Drain (debuff-5)
        {
            "type": "drain",
            "id": "mana_drain",
            "style": "debuff-5",
            "effect": {"id": "debuff-5", "kind": "drain", "scope": "player", "durationMs": 0},
            "static_positions": [],
            "random_count": 1,
            "rules": {"pickupBy": ["player", "enemy"], "destroyOnTouch": true}
        },
        // Confuse (debuff-6)
        {
            "type": "confuse",
            "id": "confusion_field",
            "style": "debuff-6",
            "effect": {
                "id": "debuff-6",
                "kind": "confuse",
                "scope": "player",
                "durationMs": 5000,
                "player": {"controlInverted": true}
            },
            "static_positions": [],
            "random_count": 1,
            "rules": {"pickupBy": ["player", "enemy"], "destroyOnTouch": true}
        },
        // Freeze (debuff-8): player frozen for 2s; enemies stepping on could be frozen in future movement system
        {
            "type": "freeze",
            "id": "freeze_2s",
            "style": "debuff-8",
            "effect": {
                "id": "debuff-8",
                "kind": "freeze",
                "scope": "player",
                "durationMs": 2000,
                "player": {"speedMultiplier": 0.4}
            },
            "static_positions": [],
            "random_count": 1,
            "rules": {"pickupBy": ["player", "enemy"], "destroyOnTouch": true}
        },
        // Spike (debuff-7): lethal to enemies; harmful to player (handled with lives/shield)
        {
            "type": "spike",
            "id": "spike_trap",
            "style": "debuff-7",
            "effect": {
                "id": "debuff-7",
                "kind": "spike",
                "scope": "global",
                "durationMs": 0,
                "enemy": {"destroy": true}
            },
            "static_positions": [],
            "random_count": 2,
            "rules": {"pickupBy": ["player", "enemy"], "destroyOnTouch": true}
        },
        // Rust (debuff-9)
        {
            "type": "rust",
            "id": "rust_zone",
            "style": "debuff-9",
            "effect": {
                "id": "debuff-9",
                "kind": "rust",
                "scope": "global",
                "durationMs": 4000,
                "enemy": {"rustStack": 1}
            },
            "static_positions": [],
            "random_count": 1,
            "rules": {"pickupBy": ["player", "enemy"], "destroyOnTouch": true}
        },
        // Glitch (debuff-10)
        {
            "type": "glitch",
            "id": "glitch_zone",
            "style": "debuff-10",
            "effect": {"id": "debuff-10", "kind": "glitch", "scope": "player", "durationMs": 6000},
            "static_positions": [],
            "random_count": 1,
            "rules": {"pickupBy": ["player", "enemy"], "destroyOnTouch": true}
        }
    ],
    "dots": { // store dots in the maze
        "static_positions": [
            {"x": 2, "y": 11},
            {"x": 3, "y": 11},
            {"x": 4, "y": 11}
        ],
        "random_count": 3
    }
}
