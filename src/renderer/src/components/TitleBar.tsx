import { VscChromeMinimize } from 'react-icons/vsc'
import { VscChromeMaximize } from 'react-icons/vsc'
import { VscChromeClose } from 'react-icons/vsc'

import classes from './TitleBar.module.css'
import { FaBook } from 'react-icons/fa'


interface TitleBarProps {
  controls: React.ReactNode
}

export const TitleBar: React.FC<TitleBarProps> = ({ controls }) => {
  return (
    <>
      <div className={classes['title-bar']}>
        <div className={classes['inner']}>
          <div className={classes['logo']}>
            <FaBook className={classes.icon} />
            <div className={classes.title}>MyBookshelf</div>
          </div>
          <div className={classes['sub-controls']}>{controls}</div>
        </div>

        <ul className={classes['main-controls']}>
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
