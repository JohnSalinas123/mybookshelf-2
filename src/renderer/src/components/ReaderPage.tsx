import { useLocation, useNavigate } from 'react-router-dom'

import classes from './ReaderPage.module.css'
import { useEffect, useRef, useState } from 'react'
import { ActionIcon, Divider, NumberInput, Stack, Text, useComputedColorScheme } from '@mantine/core'
import { FaArrowLeft } from 'react-icons/fa'

import { AiOutlineMinus, AiOutlinePlus } from 'react-icons/ai'

import { VariableSizeList as List } from 'react-window'
import React from 'react'
import { PDFViewer } from './PDFViewer'
import { ControlActionButton } from './Buttons/ControlActionButton'

interface ReaderPageProps {
  setLeftControls: (controls: React.ReactNode) => void
  setMiddleControls: (controls: React.ReactNode) => void
}

export const ReaderPage: React.FC<ReaderPageProps> = ({ setLeftControls, setMiddleControls }) => {
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
  const initialPageRef = useRef<number>(bookCurrentPage)

  const [listHeight, setListHeight] = useState(window.innerHeight - 40)

  const varPageSizeArr = [
    25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400, 500
  ]

  //console.log("ZOOM bookZoomLevel", bookZoomLevel)

  const [varPageSize, setVarPageSize] = useState<number>(bookZoomLevel || 100)
  const [varPageSizeIndex, setVarPageSizeIndex] = useState<number>(bookZoomIndex || 7)

  const baseViewportWidth = 590
  // pageSize state
  const [pageSize, setPageSize] = useState<number>(590)

  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })

  useEffect(() => {
    if (!bookUUID) return

    // send IPC invoke to update metadata.json, placing this book at the first position
    window.electron.ipcRenderer.send('update-book-as-recent', bookUUID)
  }, [bookUUID])

  // updates height of pdf viewer list when height of app window is resized
  useEffect(() => {
    const updateHeight = (): void => setListHeight(window.innerHeight - 40)

    window.addEventListener('resize', updateHeight)

    return (): void => window.removeEventListener('resize', updateHeight)
  }, [])

  const currentPageRef = useRef(currentPage)
  const lastSavedPageRef = useRef(lastSavedPage)

  useEffect(() => {
    if (Number(currentPage) <= 1) return

    console.log('CURRENT PAGE', currentPage)

    if (currentPageRef.current !== currentPage) {
      currentPageRef.current = currentPage
      console.log('TEST:', Number(currentPage))
      initialPageRef.current = Number(currentPage)
      console.log('UPDATING currentPageRef.current', currentPageRef.current)
    }
  }, [currentPage])

  useEffect(() => {
    const savePageInterval = setInterval(async () => {
      try {
        const currentPageVal = Number(currentPageRef.current)

        if (Number(lastSavedPageRef.current) == currentPageVal) return

        const result = await window.electron.ipcRenderer.invoke(
          'update-book-field',
          bookUUID,
          'cur_page',
          currentPageVal
        )

        if (result?.success) {
          console.log(`Successfully saved current page ${currentPage} for book ${bookUUID}`)
          setLastSavedPage(currentPageVal)
          lastSavedPageRef.current = currentPageVal
        } else {
          console.log(`Failed to save current page for book ${bookUUID}`)
        }
      } catch (error) {
        console.error(`Unexpected error saving page for book ${bookUUID}:`, error)
      }
    }, 5000)

    return (): void => clearInterval(savePageInterval)
  }, [])

  // set static title bar controls
  useEffect(() => {
    // clear title bar controls
    setLeftControls(null)
    setMiddleControls(null)

    // set back button to navigate back to reader
    setLeftControls(
      <>
        <ControlActionButton
          aria-label="Settings"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
        </ControlActionButton>
        
      </>
    )



  }, [])

  useEffect(() => {
    setMiddleControls(null)

    // set middle controls
    setMiddleControls(
      <>
        <Text className={classes.title}>
          {bookTitle}
        </Text>
        <div className={classes['pdf-controls']}>
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
              <ControlActionButton
                aria-label="Decrease page size button"
                onClick={handlePageSizeMinus}
              >
                <AiOutlineMinus style={{ width: '70%', height: '70%' }} />
              </ControlActionButton>
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
              <ControlActionButton
                aria-label="Increase page size button"
                onClick={handlePageSizePlus}
              >
                <AiOutlinePlus style={{ width: '70%', height: '70%' }} />
              </ControlActionButton>
            </div>
          </div>
        </div>
      </>
    )

  }, [currentPage, varPageSize])

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
      //console.log('PAGE ZOOM PLUS')
      const newVarPageSizeIndex = varPageSizeIndex + 1
      setVarPageSizeIndex(newVarPageSizeIndex)
      setVarPageSize(varPageSizeArr[newVarPageSizeIndex])
      setInitialPage(initialPageRef.current)
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
      setInitialPage(initialPageRef.current)
      window.electron.ipcRenderer.send(
        'save-page-zoom',
        bookUUID,
        varPageSizeArr[newVarPageSizeIndex],
        newVarPageSizeIndex
      )
    }
  }

  //console.log('ZOOM bookZoomLevel', bookZoomLevel)
  useEffect(() => {
    //console.log('INITIAL PAGE ZOOM:', varPageSize)
    const pageSizeScaleFactor = varPageSize / 100
    //console.log('ZOOM baseViewportW', baseViewportWidth)
    //console.log('ZOOM CALC:', pageSizeScaleFactor, baseViewportWidth * pageSizeScaleFactor)
    setPageSize(baseViewportWidth * pageSizeScaleFactor)
  }, [varPageSize])

  return (
    <>
      <Stack gap={0} className={classes['reader-page']}>
        

        {/* PDF Viewer */}
        <div className={`${classes.reader} ${computedColorScheme === 'dark' ? classes.dark : classes.light}`} ref={containerRef}>
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
