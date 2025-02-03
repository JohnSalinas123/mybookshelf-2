
import { useLocation, useNavigate } from 'react-router-dom'

import classes from './ReaderPage.module.css'
import { useEffect } from 'react';
import { ActionIcon } from '@mantine/core';
import { FaArrowLeft } from 'react-icons/fa';

interface ReaderPageProps {
  setTitleBarControls: (controls: React.ReactNode) => void;
}

export const Reader: React.FC<ReaderPageProps> = ({setTitleBarControls}) => {
  const location = useLocation()
  const { pdfPath } = location.state || {}

  const navigate = useNavigate();

  useEffect(() => {
    // clear title bar controls
    setTitleBarControls(null)

    // set back button to navigate back to reader
    setTitleBarControls(
      <ActionIcon variant="outline" className="sub-button" aria-label="Settings" onClick={() => navigate(-1)}>
        <FaArrowLeft />
    </ActionIcon>
    )


  }, [])

  if (!pdfPath) {
    return <div>Error: No PDF data found.</div>
  }

  return (
    <>  
        <div className={classes.reader}>
          <iframe
            src={pdfPath}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="PDF Viewer"
          />
        </div>
    </>
  )
}
