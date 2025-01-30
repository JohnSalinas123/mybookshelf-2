import { Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Library } from './components/Library'
import './App.css'

function App(): JSX.Element {
  //const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <Navbar />
      <Routes>
        <Route index path="/" element={<Library />}></Route>
        {/*<Route path="/reader/:pdfPath" element={<Reader/>}></Route>*/}
      </Routes>
    </>
  )
}

export default App
