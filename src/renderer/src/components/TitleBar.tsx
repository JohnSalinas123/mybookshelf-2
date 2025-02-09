import { VscChromeMinimize } from 'react-icons/vsc'
import { VscChromeMaximize } from 'react-icons/vsc'
import { VscChromeClose } from 'react-icons/vsc'

import classes from './TitleBar.module.css'
import { FaBook } from 'react-icons/fa'
import { ActionIcon, MantineColorScheme } from '@mantine/core'
import cx from 'clsx'

import { LuMoon, LuSun } from 'react-icons/lu'

interface TitleBarProps {
  controls: React.ReactNode
  setColorScheme: (value: MantineColorScheme) => void
  computedColorScheme: 'light' | 'dark'
}

export const TitleBar: React.FC<TitleBarProps> = ({
  controls,
  setColorScheme,
  computedColorScheme
}) => {
  const handleMinimize = (): void => {
    window.electron.windowControls.minimize()
  }

  const handleMaximize = (): void => {
    window.electron.windowControls.maximize()
  }

  const handleClose = (): void => {
    window.electron.windowControls.close()
  }

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

        <div className={classes['main-controls-box']}>
          <ActionIcon
            className="sub-button"
            onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
            variant="outline"
            aria-label="Toggle color scheme"
          >
            <LuSun className={cx(classes['theme-icon'], classes.light)} />
            <LuMoon className={cx(classes['theme-icon'], classes.dark)} />
          </ActionIcon>
          <ul className={classes['main-controls']}>
            <li onClick={handleMinimize}>
              <VscChromeMinimize />
            </li>
            <li onClick={handleMaximize}>
              <VscChromeMaximize />
            </li>
            <li onClick={handleClose}>
              <VscChromeClose />
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
