import { useLocation, useNavigate } from 'react-router-dom'

import classes from './ReaderPage.module.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActionIcon, Divider, NumberInput, Stack, Text } from '@mantine/core'
import { FaArrowLeft } from 'react-icons/fa'
import { Document, Page, pdfjs } from 'react-pdf'

import { AiFillPrinter, AiOutlineMinus, AiOutlinePlus } from 'react-icons/ai'
import { IoSettingsSharp } from 'react-icons/io5'

import { VariableSizeList as List } from 'react-window'
import React from 'react'

interface ReaderPageProps {
  setTitleBarControls: (controls: React.ReactNode) => void
}

export const Reader: React.FC<ReaderPageProps> = ({ setTitleBarControls }) => {
  const location = useLocation()
  const { pdfTitle, pdfPath, pdfTotalNumPages, pdfCurrentPage } = location.state || {}
  const navigate = useNavigate()

  const [currentPage, setCurrentPage] = useState<number | string>(Number(pdfCurrentPage) || 1)

  const [numPages] = useState<number>(pdfTotalNumPages || 0)

  const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy | null>(null)
  const [pageHeights, setPageHeights] = useState<number[]>([])
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

  useEffect(() => {
    const updateHeight = (): void => setListHeight(window.innerHeight - 90)

    window.addEventListener('resize', updateHeight)

    return (): void => window.removeEventListener('resize', updateHeight)
  }, [])

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
    if (!pdfDocument) return

    const loadPageHeights = async (): Promise<void> => {
      const pageNumbers = Array.from({ length: pdfDocument.numPages }, (_, i) => i + 1)
      const heights = await Promise.all(
        pageNumbers.map(async (pageNumber) => {
          const page = await pdfDocument.getPage(pageNumber)
          const viewport = page.getViewport({ scale: 1 })
          const scale = pageSize / viewport.width
          return viewport.height * scale
        })
      )

      setPageHeights(heights)
      listRef.current?.resetAfterIndex(0)
    }

    loadPageHeights()
  }, [pdfDocument, pageSize])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(Number(currentPage) - 1, 'start')
    }
  }, [currentPage, pageHeights])

  const handlePageChange = (value: string | number): void => {
    const parsedValue = typeof value === 'string' ? parseInt(value, 10) : value

    if (!isNaN(parsedValue)) {
      setCurrentPage(parsedValue)
    }
  }

  // handle page size changes
  const handlePageSizePlus = (): void => {
    if (varPageSizeIndex + 1 < varPageSizeArr.length) {
      const newVarPageSizeIndex = varPageSizeIndex + 1
      setVarPageSizeIndex(newVarPageSizeIndex)
      setVarPageSize(varPageSizeArr[newVarPageSizeIndex])
    }
  }

  const handlePageSizeMinus = (): void => {
    if (varPageSizeIndex - 1 >= 0) {
      const newVarPageSizeIndex = varPageSizeIndex - 1
      setVarPageSizeIndex(newVarPageSizeIndex)
      setVarPageSize(varPageSizeArr[newVarPageSizeIndex])
    }
  }

  useEffect(() => {
    const pageSizeScaleFactor = varPageSize / 100
    setPageSize(baseViewportWidth * pageSizeScaleFactor)
  }, [varPageSize])

  const SPACER_HEIGHT = 16

  const getPageHeight = useCallback(
    (index: number) => (pageHeights[index] || 800) + SPACER_HEIGHT,
    [pageHeights]
  )

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
                onChange={handlePageChange}
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
          <div style={{ width: pageSize }}>
            <Document file={pdfPath} onLoadSuccess={setPdfDocument} className={classes.document}>
              {pdfDocument && pageHeights.length > 0 && (
                <List
                  ref={listRef}
                  className={classes['page-list']}
                  width="100%"
                  height={listHeight} // Container height
                  itemCount={numPages}
                  itemSize={getPageHeight}
                  estimatedItemSize={800} // Avoid flickering
                  overscanCount={2} // Load extra pages before and after
                >
                  {({ index, style }) => (
                    <div style={style}>
                      <Page pageNumber={index + 1} width={pageSize - 10} />
                    </div>
                  )}
                </List>
              )}
            </Document>
          </div>
        </div>
      </Stack>
    </>
  )
}
