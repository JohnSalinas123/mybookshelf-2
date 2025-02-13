import { useLocation, useNavigate } from 'react-router-dom'

import classes from './ReaderPage.module.css'
import { useEffect, useRef, useState } from 'react'
import { ActionIcon, Divider, NumberInput, Stack, Text } from '@mantine/core'
import { FaArrowLeft } from 'react-icons/fa'

import { AiFillPrinter, AiOutlineMinus, AiOutlinePlus } from 'react-icons/ai'
import { IoSettingsSharp } from 'react-icons/io5'

import { VariableSizeList as List } from 'react-window'
import React from 'react'
import { PDFViewer } from './PDFViewer'

interface ReaderPageProps {
  setTitleBarControls: (controls: React.ReactNode) => void
}

export const ReaderPage: React.FC<ReaderPageProps> = ({ setTitleBarControls }) => {
  const location = useLocation()
  const { pdfUUID, pdfTitle, pdfPath, pdfTotalNumPages, pdfCurrentPage } = location.state || {}
  const navigate = useNavigate()

  // saved state
  const [pdfPageSaved, setPdfPageSaved] = useState<boolean>(true)

  const [currentPage, setCurrentPage] = useState<number | string>(Number(pdfCurrentPage))
  const [initialPage, setInitialPage] = useState<number>(pdfCurrentPage)

  const [numPages] = useState<number>(pdfTotalNumPages || 0)

  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<List>(null)

  const [listHeight, setListHeight] = useState(window.innerHeight - 90)

  const varPageSizeArr = [
    25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400, 500
  ]
  const [varPageSize, setVarPageSize] = useState<number>(100)
  const [varPageSizeIndex, setVarPageSizeIndex] = useState<number>(7)

  const baseViewportWidth = 590
  // pageSize state
  const [pageSize, setPageSize] = useState<number>(590)

  //
  useEffect(() => {
    const updateHeight = (): void => setListHeight(window.innerHeight - 90)

    window.addEventListener('resize', updateHeight)

    return (): void => window.removeEventListener('resize', updateHeight)
  }, [])

  const currentPageRef = useRef(currentPage)

  useEffect(() => {
    currentPageRef.current = currentPage
    console.log("UPDATING currentPageRef.current", currentPageRef.current)
  }, [currentPage])

  useEffect(() => {
    const savePageInterval = setInterval(async () => {
      const currentPageVal = Number(currentPageRef.current)
      console.log(`Saving current page, ${currentPageVal}, of ${pdfTitle}`)
      console.log(pdfUUID)
      const pdfSavedBoolean = await window.electron.ipcRenderer.invoke(
        'save-pdf-page',
        pdfUUID,
        currentPageVal
      )
      if (!pdfSavedBoolean) {
        console.log('Failed to save current page')
      } else {
        console.log(`Saved page, ${currentPage}`)
      }
    }, 15000)

    return (): void => clearInterval(savePageInterval)
  }, [])

  // set title bar controls
  useEffect(() => {
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

  const handlePageChange = (value: string | number): void => {
    const parsedValue = typeof value === 'string' ? parseInt(value, 10) : value

    if (!isNaN(parsedValue)) {
      setCurrentPage(parsedValue)
      setInitialPage(parsedValue)
    }
  }

  // handle page size changes
  const handlePageSizePlus = (): void => {
    const savedCurrentPage = Number(currentPage)
    console.log('SAVED CURRENT PAGE:', savedCurrentPage)
    if (varPageSizeIndex + 1 < varPageSizeArr.length) {
      const newVarPageSizeIndex = varPageSizeIndex + 1
      setVarPageSizeIndex(newVarPageSizeIndex)
      setVarPageSize(varPageSizeArr[newVarPageSizeIndex])
      setInitialPage(savedCurrentPage)
    }
  }

  const handlePageSizeMinus = (): void => {
    const savedCurrentPage = Number(currentPage)
    console.log('SAVED CURRENT PAGE:', savedCurrentPage)

    if (varPageSizeIndex - 1 >= 0) {
      const newVarPageSizeIndex = varPageSizeIndex - 1
      setVarPageSizeIndex(newVarPageSizeIndex)
      setVarPageSize(varPageSizeArr[newVarPageSizeIndex])
      setInitialPage(savedCurrentPage)
    }
  }

  useEffect(() => {
    const pageSizeScaleFactor = varPageSize / 100
    setPageSize(baseViewportWidth * pageSizeScaleFactor)
  }, [varPageSize])

  return (
    <>
      <Stack gap={0} className={classes['reader-page']}>
        <div className={classes['pdf-controls']}>
          <div className={classes.left}>
            {/*<RxHamburgerMenu /> */}
            <Text>{`${pdfTitle}`}</Text>
          </div>
          <div className={classes.center}>
            <div className={classes['control-group']}>
              <NumberInput
                value={currentPage}
                aria-label="Current page input"
                onBlur={(e) => handlePageChange(e.currentTarget.value)}
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

            <Divider
              className={classes.divider}
              orientation="vertical"
              size="sm"
              h={20}
              color="#717375"
            />
            <div className={classes['control-group']}>
              <ActionIcon
                variant="transparent"
                aria-label="Decrease page size button"
                color="white"
                onClick={handlePageSizeMinus}
              >
                <AiOutlineMinus style={{ width: '70%', height: '70%' }} />
              </ActionIcon>
              <NumberInput
                value={varPageSize}
                aria-label="Current size of page in percentage"
                allowDecimal={false}
                allowNegative={false}
                min={25}
                max={500}
                defaultValue={100}
                suffix="%"
                hideControls
                className={classes['size-percent']}
                onChange={(value: number | string) => {
                  const numValue = Number(value)
                  if (
                    numValue < varPageSizeArr[0] ||
                    numValue > varPageSizeArr[varPageSizeArr.length - 1]
                  )
                    return

                  setVarPageSize(Number(value))
                }}
              />
              <ActionIcon
                variant="transparent"
                aria-label="Increase page size button"
                color="white"
                onClick={handlePageSizePlus}
              >
                <AiOutlinePlus style={{ width: '70%', height: '70%' }} />
              </ActionIcon>
            </div>
          </div>
          <div className={classes.right}>
            <AiFillPrinter className={classes['sub-controls']} />
            <IoSettingsSharp className={classes['sub-controls']} />
          </div>
        </div>

        {/* PDF Viewer */}
        <div className={classes.reader} ref={containerRef}>
          <PDFViewer
            pdfPath={pdfPath}
            listRef={listRef}
            listHeight={listHeight}
            numPages={numPages}
            initialPage={initialPage}
            pageSize={pageSize}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </Stack>
    </>
  )
}
