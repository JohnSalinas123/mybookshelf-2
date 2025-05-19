import { TfiPencilAlt } from 'react-icons/tfi'

import classes from './ControlBar.module.css'
import { ActionIcon, MantineColorScheme, Popover } from '@mantine/core'
import cx from 'clsx'
import { IconMoonFilled, IconNote, IconNotes, IconSunFilled } from '@tabler/icons-react';

import { useState } from 'react'
import { NotesEditor } from '../NotesEditor'
import { ControlActionButton } from '../Buttons/ControlActionButton';

interface ControlBarProps {
  leftControls: React.ReactNode,
  middleControls: React.ReactNode,
  setColorScheme: (value: MantineColorScheme) => void
  computedColorScheme: 'light' | 'dark'
}

export const ControlBar: React.FC<ControlBarProps> = ({
  leftControls,
  middleControls,
  setColorScheme,
  computedColorScheme
}) => {
  // popover for notes state
  const [notesPopOpened, setNotesPopOpened] = useState(false)

  return (
    <>
      <div
        className={classes['title-bar']}
      >
        <div className={classes.controls}>
          <div className={classes['left-controls']}>{leftControls}</div>

          <div className={classes['middle-controls']}>
            {middleControls}
          </div>

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
                <ControlActionButton
                  onClick={() => setNotesPopOpened((prevState) => !prevState)}
                  aria-label="Toggle display of notes modal"
                >
                  <IconNote className={classes['control-icon']} />
                </ControlActionButton>
              </Popover.Target>

              <Popover.Dropdown>
                <NotesEditor />
              </Popover.Dropdown>
            </Popover>

            <ControlActionButton
              onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
              aria-label="Toggle color scheme"
            >
              <IconSunFilled className={cx(classes['control-icon'], classes['light-mode'])} stroke={1.5}/>
              <IconMoonFilled className={cx(classes['control-icon'], classes['dark-mode'])} stroke={1.5} />
            </ControlActionButton>
          </div>
        </div>
      </div>
    </>
  )
}
