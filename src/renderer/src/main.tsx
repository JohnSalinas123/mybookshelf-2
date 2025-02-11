import ReactDOM from 'react-dom/client'
import App from './App'

import './index.css'
import { HashRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'

import '@mantine/core/styles.css'

//const theme = createTheme({
//
//})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <MantineProvider defaultColorScheme="dark">
    <HashRouter>
      <App />
    </HashRouter>
  </MantineProvider>
)
