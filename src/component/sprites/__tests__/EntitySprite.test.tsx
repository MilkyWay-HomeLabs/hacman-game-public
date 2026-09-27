import {describe, expect, it} from 'vitest';
import {render} from '@testing-library/react';
import {BuffSprite, DebuffSprite, EnemySprite, PlayerSprite} from '../EntitySprite';

describe('EntitySprite', () => {
    it('renders the pacman with both mouth frames and an eye', () => {
        const {container} = render(<PlayerSprite/>);
        expect(container.querySelector('svg')).toBeTruthy();
        expect(container.querySelector('.pac-open')).toBeTruthy();
        expect(container.querySelector('.pac-closed')).toBeTruthy();
        expect(container.querySelector('.pac-eye')).toBeTruthy();
    });

    it('renders the ghost with a body, eyes and pupils', () => {
        const {container} = render(<EnemySprite/>);
        expect(container.querySelector('.enemy-body')).toBeTruthy();
        expect(container.querySelectorAll('.enemy-eye').length).toBe(2);
        expect(container.querySelectorAll('.enemy-pupil').length).toBe(2);
    });

    it('renders the buff star body', () => {
        const {container} = render(<BuffSprite/>);
        expect(container.querySelector('.buff-body')).toBeTruthy();
    });

    it('renders the debuff triangle with an exclamation mark', () => {
        const {container} = render(<DebuffSprite/>);
        expect(container.querySelector('.debuff-body')).toBeTruthy();
        expect(container.querySelectorAll('.debuff-mark').length).toBe(2);
    });

    it('marks every sprite as decorative (aria-hidden)', () => {
        for (const Sprite of [PlayerSprite, EnemySprite, BuffSprite, DebuffSprite]) {
            const {container} = render(<Sprite/>);
            expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
        }
    });
});
