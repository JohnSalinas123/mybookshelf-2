import { useLocation, useNavigate } from 'react-router-dom'

import classes from './ReaderPage.module.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActionIcon, NumberInput, Stack, Text } from '@mantine/core'
import { FaArrowLeft } from 'react-icons/fa'
import { Document, Page, pdfjs } from 'react-pdf'

import { AiFillPrinter } from 'react-icons/ai'
import { IoSettingsSharp } from 'react-icons/io5'
import { RxHamburgerMenu } from 'react-icons/rx'

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

  const viewportWidth = 590

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
          const scale = viewportWidth / viewport.width
          return viewport.height * scale
        })
      )

      setPageHeights(heights)
      listRef.current?.resetAfterIndex(0)
    }

    loadPageHeights()
  }, [pdfDocument])

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
            <RxHamburgerMenu />
            <Text>{`${pdfTitle}`}</Text>
          </div>
          <div className={classes.center}>
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
          <div className={classes.right}>
            <AiFillPrinter className={classes['sub-controls']} />
            <IoSettingsSharp className={classes['sub-controls']} />
          </div>
        </div>

        {/* PDF Viewer */}
        <div className={classes.reader} ref={containerRef}>
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
                    <Page pageNumber={index + 1} width={viewportWidth} />
                  </div>
                )}
              </List>
            )}
          </Document>
        </div>
      </Stack>
    </>
  )
}
