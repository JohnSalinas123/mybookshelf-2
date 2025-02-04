import { useLocation, useNavigate } from 'react-router-dom'

import classes from './ReaderPage.module.css'
import { useEffect, useRef, useState } from 'react'
import { ActionIcon, Group, NumberInput, Stack, Text } from '@mantine/core'
import { FaArrowLeft } from 'react-icons/fa'
import { Document, Page } from 'react-pdf'

import { AiFillPrinter } from 'react-icons/ai'
import { IoSettingsSharp } from 'react-icons/io5'
import { RxHamburgerMenu } from 'react-icons/rx'

interface ReaderPageProps {
  setTitleBarControls: (controls: React.ReactNode) => void
}

export const Reader: React.FC<ReaderPageProps> = ({ setTitleBarControls }) => {
  const location = useLocation()
  const { pdfTitle, pdfPath, pdfTotalNumPages, pdfCurrentPage } = location.state || {}
  const navigate = useNavigate()

  // state to track book page data
  const [currentPage, setCurrentPage] = useState<number | string>(Number(pdfCurrentPage))

  // refs to page containers
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // set currentPage state to pdfCurrentPage
    setCurrentPage(pdfCurrentPage)

    // clear title bar controls
    setTitleBarControls(null)

    // set back button to navigate back to reader
    setTitleBarControls(
      <ActionIcon
        variant="outline"
        className="sub-button"
        aria-label="Settings"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft />
      </ActionIcon>
    )
  }, [])

  useEffect(() => {

    // check if currentPage is number
    console.log(currentPage)
    console.log(typeof currentPage)
    if (typeof currentPage != 'number' || isNaN(currentPage)) return;

    const targetPage = pageRefs.current[currentPage - 1];
    if (targetPage) {
      targetPage.scrollIntoView({behavior: 'instant', block: 'start'})
    }

  } ,[currentPage, pdfTotalNumPages])

  if (!pdfPath || !pdfTotalNumPages || !pdfCurrentPage) {
    return <div>Error: No PDF data found.</div>
  }

  console.log(pdfTitle)

  return (
    <>
      <Stack gap={0} className={classes['reader-page']}>
        <div className={classes['pdf-controls']}>
          <div className={classes.left}>
            <RxHamburgerMenu />
            <Text>{pdfTitle}</Text>
          </div>
          <div className={classes.center}>
            <NumberInput
              aria-label="Current page input"
              onChange={setCurrentPage}
              className={classes['page-input']}
              allowDecimal={false}
              allowNegative={false}
              min={0}
              max={pdfTotalNumPages}
              hideControls
              defaultValue={pdfCurrentPage}
            />
            <Text className={classes['page-total']}>{`/ ${pdfTotalNumPages}`}</Text>
          </div>
          <div className={classes.right}>
            <AiFillPrinter className={classes['sub-controls']} />
            <IoSettingsSharp className={classes['sub-controls']} />
          </div>
        </div>
        <div className={classes.reader}>
          <Document className={classes.pdf} file={pdfPath} loading={''}
            onLoadSuccess={() => {
              if (typeof currentPage != 'number') return;
              const targetPage = pageRefs.current[currentPage - 1]
              if (targetPage) {
                targetPage.scrollIntoView({ behavior: 'instant' , block: 'start' })
              }
            }}
          >
            {Array.from({ length: pdfTotalNumPages }, (_, index) => (
              <div key ={index} ref={(el) => (pageRefs.current[index] = el)}>
                <Page className={classes.page} scale={1.5} pageNumber={index + 1} />
              </div>
              
            ))}
          </Document>

          {/*
            <iframe
              src={pdfPath}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="PDF Viewer"
            />
            */}
        </div>
      </Stack>
    </>
  )
}
