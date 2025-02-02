import { ActionIcon } from '@mantine/core'
import { useLocation } from 'react-router-dom'

import classes from './ReaderPage.module.css'
import { FaArrowLeft  } from 'react-icons/fa'
import { useNavigate } from 'react-router';

export const Reader: React.FC = () => {
  const location = useLocation()
  const { pdfPath } = location.state || {}

  const navigate = useNavigate()

  if (!pdfPath) {
    return <div>Error: No PDF data found.</div>
  }

  const handleBackButton = (): void => {
    navigate(`/`)
  }

  return (
    <>  
        <div className={classes.reader}>
          <div className={classes.control}>
            <ActionIcon variant="filled" aria-label="Settings" onClick={handleBackButton}>
              <FaArrowLeft   style={{ width: '70%', height: '70%' }} />
            </ActionIcon>
          </div>
          <iframe
            src={pdfPath}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="PDF Viewer"
          />
        </div>
    </>
  )
}
