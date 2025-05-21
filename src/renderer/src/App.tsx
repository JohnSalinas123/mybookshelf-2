import { Route, Routes } from 'react-router-dom'
//import { Navbar } from './components/Navbar'
import { LibraryPage } from './components/Library/LibraryPage'

import classes from './App.module.css'
import { ReaderPage } from './components/Reader/ReaderPage'
import { ControlBar } from './components/ControlBar/ControlBar'
import { useState } from 'react'
import { useComputedColorScheme, useMantineColorScheme } from '@mantine/core'

function App(): JSX.Element {
  const [leftControls, setLeftControls] = useState<React.ReactNode>(null)
  const [middleControls, setMiddleControls] = useState<React.ReactNode>(null)

  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })

  return (
    <>
      <ControlBar
        leftControls={leftControls}
        middleControls={middleControls}
        setColorScheme={setColorScheme}
        computedColorScheme={computedColorScheme}
      />
      <div className={classes['main-container']}>
        <Routes>
          <Route
            index
            path="/"
            element={<LibraryPage setLeftControls={setLeftControls} setMiddleControls={setMiddleControls}/>}
          ></Route>
          <Route
            path="/reader"
            element={<ReaderPage setLeftControls={setLeftControls} setMiddleControls={setMiddleControls} />}
          ></Route>
        </Routes>
      </div>
    </>
  )
}

export default App
