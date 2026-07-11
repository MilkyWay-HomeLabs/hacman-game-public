import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import GameContainer from './GameContainer.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GameContainer/>
    </StrictMode>,
)
