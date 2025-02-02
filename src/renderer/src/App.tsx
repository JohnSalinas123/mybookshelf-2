import { Route, Routes } from 'react-router-dom'
//import { Navbar } from './components/Navbar'
import { Library } from './components/Library'

import classes from './App.module.css'
import { Reader } from './components/ReaderPage'
import { TitleBar } from './components/TitleBar'


function App(): JSX.Element {
  
  
  return (
    <>
      <TitleBar />
      <div className={classes['main-container']}>
        <Routes>
          <Route index path="/" element={<Library />}></Route>
          <Route path="/reader" element={<Reader />}></Route>
        </Routes>
      </div>
    </>
  )
}

export default App
