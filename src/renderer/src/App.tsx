import { Route, Routes } from 'react-router-dom'
//import { Navbar } from './components/Navbar'
import { Library } from './components/Library'

import classes from './App.module.css'
import { Reader } from './components/ReaderPage'
import { TitleBar } from './components/TitleBar'
import { useState } from 'react'


function App(): JSX.Element {
  const [titleBarControls, setTitleBarControls] = useState<React.ReactNode>(null)
  
  return (
    <>
      <TitleBar controls={titleBarControls}/>
      <div className={classes['main-container']}>
        <Routes>
          <Route index path="/" element={<Library setTitleBarControls={setTitleBarControls}/>} ></Route>
          <Route path="/reader" element={<Reader setTitleBarControls={setTitleBarControls}/>}></Route>
        </Routes>
      </div>
    </>
  )
}

export default App
