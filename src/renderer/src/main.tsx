import ReactDOM from 'react-dom/client'
import App from './App'

import './index.css'
import { BrowserRouter } from 'react-router-dom'

console.log('Attempting to render')
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
