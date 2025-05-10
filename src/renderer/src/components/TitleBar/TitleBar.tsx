import { TfiPencilAlt } from 'react-icons/tfi'

import classes from './TitleBar.module.css'
import { ActionIcon, MantineColorScheme, Popover } from '@mantine/core'
import cx from 'clsx'

import { LuMoon, LuSun } from 'react-icons/lu'
import { useState } from 'react'
import { NotesEditor } from '../NotesEditor'

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

  return (
    <>
      <div
        className={`${classes['title-bar']} ${computedColorScheme == 'dark' ? classes['dark'] : classes['light']}`}
      >
        <div className={classes.controls}>
          <div className={classes['left-controls']}>{controls}</div>

          <div className={classes['right-controls']}>
            <Popover
              width={510}
              opened={notesPopOpened}
              onChange={setNotesPopOpened}
              offset={{ mainAxis: 30, crossAxis: -145 }}
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
              className={`sub-button`}
              onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
              variant="outline"
              aria-label="Toggle color scheme"
            >
              <LuSun className={cx(classes['mode-icon'], classes['light-mode'])} />
              <LuMoon className={cx(classes['mode-icon'], classes['dark-mode'])} />
            </ActionIcon>
          </div>
        </div>
      </div>
    </>
  )
}
