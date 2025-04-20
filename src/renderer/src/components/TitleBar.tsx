import { VscChromeMinimize } from 'react-icons/vsc'
import { VscChromeMaximize } from 'react-icons/vsc'
import { VscChromeClose } from 'react-icons/vsc'
import { TfiPencilAlt } from 'react-icons/tfi'

import classes from './TitleBar.module.css'
import { ActionIcon, MantineColorScheme, Image, Group, Popover } from '@mantine/core'
import cx from 'clsx'

import { LuMoon, LuSun } from 'react-icons/lu'
import { useState } from 'react'
import { NotesEditor } from './NotesEditor'

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
  // popover for notes state
  const [notesPopOpened, setNotesPopOpened] = useState(false)

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
            <Image className={classes.icon} src="bookshelf.png" />
            <div className={classes.title}>MyBookshelf</div>
          </div>
          <div className={classes['sub-controls']}>{controls}</div>
        </div>

        <div className={classes['main-controls-box']}>
          <Group gap={7}>
            <Popover
              width={500}
              opened={notesPopOpened}
              onChange={setNotesPopOpened}
              offset={{ mainAxis: 30, crossAxis: -100 }}
              withArrow
              arrowSize={12}
            >
              <Popover.Target>
                <ActionIcon
                  className="sub-button"
                  variant="outline"
                  onClick={() => setNotesPopOpened((prevState) => !prevState)}
                  aria-label="Toggle display of notes modal"
                >
                  <TfiPencilAlt className={classes['theme-icon']} />
                </ActionIcon>
              </Popover.Target>

              <Popover.Dropdown>
                <NotesEditor />
              </Popover.Dropdown>
            </Popover>

            <ActionIcon
              className="sub-button"
              onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
              variant="outline"
              aria-label="Toggle color scheme"
            >
              <LuSun className={cx(classes['theme-icon'], classes.light)} />
              <LuMoon className={cx(classes['theme-icon'], classes.dark)} />
            </ActionIcon>
          </Group>
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
