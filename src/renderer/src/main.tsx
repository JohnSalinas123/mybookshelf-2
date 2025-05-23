import ReactDOM from 'react-dom/client'
import App from './App'

import './index.css'
import { HashRouter } from 'react-router-dom'
import { createTheme, CSSVariablesResolver, MantineProvider } from '@mantine/core'

import '@mantine/core/styles.css'
import '@mantine/tiptap/styles.css';

const themeOverride = createTheme({
  other: {
    darkBG: '#262930',
    lightBG: '#eaecee'
  }
})

const resolver: CSSVariablesResolver = (theme) => ({
  variables: {},
  light: {
    '--mantine-color-body': theme.other.lightBG,
  },
  dark: {
    '--mantine-color-body': theme.other.darkBG,
  },
});


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <MantineProvider  theme={themeOverride}
    withCssVariables
    cssVariablesResolver={resolver}
      >
      
    <HashRouter>
      <App />
    </HashRouter>
  </MantineProvider>
)
