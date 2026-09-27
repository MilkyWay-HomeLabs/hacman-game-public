import { MazeGenerator } from '../utils/mazeGenerator';

const generator = new MazeGenerator(40, 40, 12345);
generator.generate();

const mazeData = generator.buildMazeData({
    player: {
        start_position: { x: 1, y: 1 },
        direction: 'right'
    },
    enemies: [
        {
            type: 'ghost',
            id: 'blinky',
            static_positions: [{ x: 3, y: 3 }],
            random_count: 2
        }
    ],
    buffs: [
        {
            type: 'teleport',
            id: 'tele1',
            static_positions: [{ x: 20, y: 20 }],
            random_count: 1
        }
    ],
    debuffs: [],
    dots: {
        static_positions: [],
        random_count: 100
    }
});

console.log(mazeData);
