import ReactDOM from 'react-dom/client'
import App from './App'

import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'

import '@mantine/core/styles.css';

console.log('Attempting to render')
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <MantineProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </MantineProvider>
)
