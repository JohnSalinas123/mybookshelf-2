import { VscChromeMinimize } from 'react-icons/vsc'
import { VscChromeMaximize } from 'react-icons/vsc'
import { VscChromeClose } from 'react-icons/vsc'

import './Navbar.css'

export const Navbar: React.FC = () => {
  return (
    <>
      <div className="nav">
        <div className="title-box">MyBookshelf</div>

        <ul className="window-controls">
          <li>
            <VscChromeMinimize />
          </li>
          <li>
            <VscChromeMaximize />
          </li>
          <li>
            <VscChromeClose />
          </li>
        </ul>
      </div>
    </>
  )
}
