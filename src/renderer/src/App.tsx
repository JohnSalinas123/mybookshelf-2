import { Route, Routes } from 'react-router-dom'
//import { Navbar } from './components/Navbar'
import { Library } from './components/Library'

import classes from './App.module.css'
import { Reader } from './components/ReaderPage'

function App(): JSX.Element {
  //const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      {/*<Navbar />*/}
      <div className={classes['main-container']}>
        <Routes>
          <Route index path="/" element={<Library />}></Route>
          <Route path="/reader" element={<Reader/>}></Route>
        </Routes>
      </div>
    </>
  )
}

export default App
