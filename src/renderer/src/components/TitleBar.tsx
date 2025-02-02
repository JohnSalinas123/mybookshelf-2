import { VscChromeMinimize } from 'react-icons/vsc'
import { VscChromeMaximize } from 'react-icons/vsc'
import { VscChromeClose } from 'react-icons/vsc'

import classes from './TitleBar.module.css'
import { RiArrowLeftSLine } from "react-icons/ri";
import { FaArrowLeft, FaBook } from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'
import { ActionIcon, Button } from '@mantine/core'

export const TitleBar: React.FC = () => {
  const location = useLocation();
  const path = location.pathname

  const navigate = useNavigate();

  //const showAddBook = path === '/';
  const showBackButton = path === '/reader'

  const handleBack = (): void => {
    navigate(-1)
  }

  return (
    <>
      <div className={classes['title-bar']}>
        <div className={classes['inner']}>
          <div className={classes['logo']}>
            <FaBook className={classes.icon}/>
            <div className={classes.title}>MyBookshelf</div>
          </div>
          <div className={classes['sub-controls']}>
            {showBackButton && (
              <ActionIcon className={classes['sub-button']} variant='outline' aria-label="Back" onClick={handleBack} size={22}>
                <RiArrowLeftSLine  size={18}/>
              </ActionIcon>
            )}
          </div>
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
