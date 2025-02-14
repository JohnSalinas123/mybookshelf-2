import { Route, Routes } from 'react-router-dom'
//import { Navbar } from './components/Navbar'
import { LibraryPage } from './components/LibraryPage'

import classes from './App.module.css'
import { ReaderPage } from './components/ReaderPage'
import { TitleBar } from './components/TitleBar'
import { useState } from 'react'
import { useComputedColorScheme, useMantineColorScheme } from '@mantine/core'


function App(): JSX.Element {
  const [titleBarControls, setTitleBarControls] = useState<React.ReactNode>(null)

  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  
  return (
    <>
      <TitleBar controls={titleBarControls} setColorScheme={setColorScheme} computedColorScheme={computedColorScheme}/>
      <div className={classes['main-container']}>
        <Routes>
          <Route index path="/" element={<LibraryPage setTitleBarControls={setTitleBarControls}/>} ></Route>
          <Route path="/reader" element={<ReaderPage setTitleBarControls={setTitleBarControls}/>}></Route>
        </Routes>
      </div>
    </>
  )
}

export default App
