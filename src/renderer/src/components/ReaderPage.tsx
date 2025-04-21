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
  const {
    bookUUID,
    bookTitle,
    bookFilePath,
    bookTotalNumPages,
    bookCurrentPage,
    bookZoomLevel,
    bookZoomIndex
  } = location.state || {}
  const navigate = useNavigate()

  // saved state
  //const [pdfPageSaved, setPdfPageSaved] = useState<boolean>(true)

  const [currentPage, setCurrentPage] = useState<number | string>(Number(bookCurrentPage))
  const [initialPage, setInitialPage] = useState<number>(bookCurrentPage)
  const [lastSavedPage, setLastSavedPage] = useState<number>(bookCurrentPage)

  const [numPages] = useState<number>(bookTotalNumPages || 0)

  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<List>(null)

  const [listHeight, setListHeight] = useState(window.innerHeight - 90)

  const varPageSizeArr = [
    25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400, 500
  ]

  //console.log("ZOOM bookZoomLevel", bookZoomLevel)

  const [varPageSize, setVarPageSize] = useState<number>(bookZoomLevel || 100)
  const [varPageSizeIndex, setVarPageSizeIndex] = useState<number>(bookZoomIndex || 7)

  const baseViewportWidth = 590
  // pageSize state
  const [pageSize, setPageSize] = useState<number>(590)

  useEffect(() => {
    if (!bookUUID) return

    // send IPC invoke to update metadata.json, placing this book at the first position
    window.electron.ipcRenderer.send('update-book-as-recent', bookUUID)
  }, [bookUUID])

  // updates height of pdf viewer list when height of app window is resized
  useEffect(() => {
    const updateHeight = (): void => setListHeight(window.innerHeight - 90)

    window.addEventListener('resize', updateHeight)

    return (): void => window.removeEventListener('resize', updateHeight)
  }, [])

  const currentPageRef = useRef(currentPage)
  const lastSavedPageRef = useRef(lastSavedPage)

  useEffect(() => {
    currentPageRef.current = currentPage
    console.log('UPDATING currentPageRef.current', currentPageRef.current)
  }, [currentPage])

  useEffect(() => {
    const savePageInterval = setInterval(async () => {
      const currentPageVal = Number(currentPageRef.current)

      if (Number(lastSavedPageRef.current) == currentPageVal) return

      console.log(Number(lastSavedPageRef.current), Number(currentPageRef.current))

      console.log(`Saving current page, ${currentPageVal}, of ${bookTitle}`)
      console.log(bookUUID)
      const pdfSavedBoolean = await window.electron.ipcRenderer.invoke(
        'save-pdf-page',
        bookUUID,
        currentPageVal
      )
      console.log(pdfSavedBoolean)
      if (pdfSavedBoolean) {
        console.log(`Saved page, ${currentPage}`)
        setLastSavedPage(currentPageVal)
        lastSavedPageRef.current = currentPageVal
      } else {
        console.log('Failed to save current page')
      }
    }, 5000)

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

  // handlePageChange handles page changes
  const handlePageChange = (value: string | number): void => {
    const parsedValue = typeof value === 'string' ? parseInt(value, 10) : value

    if (!isNaN(parsedValue)) {
      setCurrentPage(parsedValue)
      setInitialPage(parsedValue)
    }
  }

  // handlePageSizeChange handles changes in page zoom when user inputs manually
  const handlePageSizeChange = (value: string): void => {
    // remove percentage
    const numValue = Number(value.slice(0, -1))
    const minPageSize = varPageSizeArr[0]
    const maxPageSize = varPageSizeArr[varPageSizeArr.length - 1]

    //console.log('NEW PAGE SIZE', numValue)

    if (numValue < minPageSize) {
      setVarPageSize(minPageSize)
      setVarPageSizeIndex(0)
      window.electron.ipcRenderer.send('save-page-zoom', bookUUID, minPageSize, 0)
    } else if (numValue > maxPageSize) {
      setVarPageSize(maxPageSize)
      setVarPageSizeIndex(varPageSizeArr.length - 1)
      window.electron.ipcRenderer.send(
        'save-page-zoom',
        bookUUID,
        maxPageSize,
        varPageSizeArr.length - 1
      )
    } else {
      let tempPageIndex = 0
      for (let i = 0; i < varPageSizeArr.length - 1; i++) {
        if (numValue >= varPageSizeArr[i]) {
          tempPageIndex = i
        } else {
          break
        }
      }
      setVarPageSize(numValue)
      setVarPageSizeIndex(tempPageIndex)
      window.electron.ipcRenderer.send('save-page-zoom', bookUUID, numValue, tempPageIndex)
    }
  }

  // handlePageSizePlus handles increase in page zoom
  const handlePageSizePlus = (): void => {
    if (varPageSizeIndex + 1 < varPageSizeArr.length) {
      console.log('PAGE ZOOM PLUS')
      const newVarPageSizeIndex = varPageSizeIndex + 1
      setVarPageSizeIndex(newVarPageSizeIndex)
      setVarPageSize(varPageSizeArr[newVarPageSizeIndex])
      window.electron.ipcRenderer.send(
        'save-page-zoom',
        bookUUID,
        varPageSizeArr[newVarPageSizeIndex],
        newVarPageSizeIndex
      )
    }
  }

  // handlePageSizeMinus handles decrease in page zoom
  const handlePageSizeMinus = (): void => {
    if (varPageSizeIndex - 1 >= 0) {
      const newVarPageSizeIndex = varPageSizeIndex - 1
      setVarPageSizeIndex(newVarPageSizeIndex)
      setVarPageSize(varPageSizeArr[newVarPageSizeIndex])
      window.electron.ipcRenderer.send(
        'save-page-zoom',
        bookUUID,
        varPageSizeArr[newVarPageSizeIndex],
        newVarPageSizeIndex
      )
    }
  }

  console.log('ZOOM bookZoomLevel', bookZoomLevel)
  useEffect(() => {
    console.log('INITIAL PAGE ZOOM:', varPageSize)
    const pageSizeScaleFactor = varPageSize / 100
    console.log('ZOOM baseViewportW', baseViewportWidth)
    console.log('ZOOM CALC:', pageSizeScaleFactor, baseViewportWidth * pageSizeScaleFactor)
    setPageSize(baseViewportWidth * pageSizeScaleFactor)
  }, [varPageSize])

  return (
    <>
      <Stack gap={0} className={classes['reader-page']}>
        <div className={classes['pdf-controls']}>
          <div className={classes.left}>
            {/*<RxHamburgerMenu /> */}
            <Text>{`${bookTitle}`}</Text>
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
                max={bookTotalNumPages}
                hideControls
                defaultValue={bookCurrentPage}
              />
              <Text className={classes['page-total']}>{`/ ${bookTotalNumPages}`}</Text>
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
                onBlur={(e) => handlePageSizeChange(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePageSizeChange(e.currentTarget.value)
                  }
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
            bookFilePath={bookFilePath}
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
