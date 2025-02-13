import React, { useCallback, useState } from 'react'
import { useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { VariableSizeList as List } from 'react-window'

import classes from './PDFViewer.module.css'
import { Center, Loader } from '@mantine/core'

interface PDFViewerProps {
  pdfPath: string
  listRef: React.RefObject<List>
  listHeight: number
  numPages: number
  initialPage: number
  pageSize: number
  setCurrentPage: (page: number) => void
}

export const PDFViewer: React.FC<PDFViewerProps> = React.memo(
  ({ pdfPath, listRef, listHeight, numPages, initialPage, pageSize, setCurrentPage }) => {
    console.log('Rendering PDFViewer with props:', {
      pdfPath,
      listHeight,
      numPages,
      initialPage,
      pageSize
    })

    const [pageHeight, setPageHeight] = useState<number>(800)
    const SPACER_HEIGHT = 16
    const getPageHeight = useCallback(() => (pageHeight || 800) + SPACER_HEIGHT, [pageHeight])

    const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy | null>(null)

    useEffect(() => {
      console.log('CURRENT PAGE', initialPage)
      // scroll to saved page number
      if (listRef.current) {
        listRef.current.scrollToItem(Number(initialPage) - 1, 'start')
      }
    }, [listRef, listRef.current, pageHeight, initialPage])

    useEffect(() => {
      if (!pdfDocument) return

      const loadPageHeights = async (): Promise<void> => {
        const firstPage = await pdfDocument.getPage(1)
        const viewport = firstPage.getViewport({ scale: 1 })
        const scale = pageSize / viewport.width
        const height = viewport.height * scale
        console.log('Computed page height:', height)
        setPageHeight(height)
        listRef.current?.resetAfterIndex(0)
      }

      loadPageHeights()
    }, [pdfDocument, pageSize])

    return (
      <div style={{ width: pageSize }}>
        <Document file={pdfPath} onLoadSuccess={setPdfDocument} className={classes.document}>
          <List
            ref={listRef}
            className={classes['page-list']}
            width="100%"
            height={listHeight}
            itemCount={numPages}
            itemSize={getPageHeight}
            estimatedItemSize={800}
            overscanCount={1}
            onScroll={({ scrollOffset }) => {
              const baseScrollOffset = pageHeight / 2
              const visiblePageIndex = Math.floor(
                (baseScrollOffset + scrollOffset) / (pageHeight + SPACER_HEIGHT)
              )

              console.log('PAGEHEIGHT', pageHeight)
              console.log(baseScrollOffset)
              console.log('SCROLLOFFSET:', baseScrollOffset + scrollOffset)
              console.log((baseScrollOffset + scrollOffset) / pageHeight)
              console.log('VISIBLE PAGE INDEX', visiblePageIndex)

              setCurrentPage(visiblePageIndex + 1)
            }}
          >
            {({ index, style }) => (
              <div data-page={index + 1} style={style}>
                <Page
                  className="page-element"
                  pageNumber={index + 1}
                  width={pageSize}
                  loading={<PDFLoadingPage />}
                />
              </div>
            )}
          </List>
        </Document>
      </div>
    )
  }
)

PDFViewer.displayName = 'PdfViewer'

const PDFLoadingPage: React.FC = () => {
  return (
    <>
      <Center h="100%" w="100%">
        <Loader color="blue" />
      </Center>
    </>
  )
}
