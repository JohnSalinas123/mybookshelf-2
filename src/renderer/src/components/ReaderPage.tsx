import { useLocation, useNavigate } from 'react-router-dom'

import classes from './ReaderPage.module.css'
import { useEffect, useRef, useState } from 'react'
import { ActionIcon, NumberInput, Stack, Text } from '@mantine/core'
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

  const initialPage = Math.max(1, Number(pdfCurrentPage) || 1)

  const [visibleRange, setVisibleRange] = useState<{ start: number; end: number }>({
    start: Math.max(1, initialPage - 2),
    end: Math.min(initialPage + 2, Number(pdfTotalNumPages))
  })

  console.log('INTIAL VISIBLE RANGE:', visibleRange.start, visibleRange.end)

  // refs to page containers
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])

  const containerRef = useRef<HTMLDivElement>(null)

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
    console.log('USE EFFECT OUTER')
    if (!containerRef.current) return

    console.log('USE EFFECT INNER')

    const expansionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement
          console.log(
            `Observed page ${target.dataset.pageNumber}: isIntersecting = ${entry.isIntersecting}`
          )
          if (entry.isIntersecting) {
            setVisibleRange((prev) => {
              const pageNumber = Number(target.dataset.pageNumber)
              console.log(
                `Intersected Page: ${pageNumber}, Visible Range: ${prev.start}-${prev.end}`
              )

              if (pageNumber === prev.start) {
                // expanding page upwards
                if (prev.start <= 1) return prev
                console.log('Expanding upwards')
                return {
                  start: Math.max(1, prev.start - 3),
                  end: prev.end
                }
              } else if (pageNumber === prev.end && prev.end < Number(pdfTotalNumPages)) {
                // expanding downwards
                console.log('Expanding downwards')
                return {
                  start: prev.start,
                  end: Math.min(Number(pdfTotalNumPages), prev.end + 3)
                }
              }
              return prev
            })
          }
        })
      },
      { root: containerRef.current, threshold: 0.1 }
    )

    // observer for tracking the current page
    const currentPageObserver = new IntersectionObserver(
      (entries) => {
        let closestPage: number | null = null;
        let closestDistance = Infinity;

        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const target = entry.target as HTMLElement;
          const pageNumber = Number(target.dataset.pageNumber)
          const distanceFromCenter = Math.abs(entry.boundingClientRect.top)

          // find page closest to the center
          if (distanceFromCenter < closestDistance) {
            closestDistance = distanceFromCenter;
            closestPage = pageNumber;
          }
        });

        if (closestPage !== null) {
          console.log("CLOSEST PAGE: ", closestPage)
          setCurrentPage(closestPage)
        }


      }, {root: containerRef.current, threshold: 0.5}
    );

    // setup current page observer
    const pagesInRange = pagesToRender;
    pagesInRange.forEach((pageNumber) => {
      const pageElem = pageRefs.current[pageNumber - 1];

      if (pageElem) {
        pageElem.dataset.pageNumber = pageNumber.toString();
        currentPageObserver.observe(pageElem)
      }
    });

    const timer = setTimeout(() => {
      
      // setup for expansion observer
      // observe the first rendered page in current range
      const firstPageIndex = visibleRange.start - 1
      const firstPageEl = pageRefs.current[firstPageIndex]

      // observe the last rendered page in current range
      const lastPageIndex = visibleRange.end - 1
      const lastPageEl = pageRefs.current[lastPageIndex]

      console.log('Observing First:', firstPageIndex + 1, firstPageEl)
      console.log('Observing Last:', lastPageIndex + 1, lastPageEl)

      if (firstPageEl) {
        firstPageEl.dataset.pageNumber = (firstPageIndex + 1).toString()
        expansionObserver.observe(firstPageEl)
      }

      if (lastPageEl) {
        lastPageEl.dataset.pageNumber = (lastPageIndex + 1).toString()
        expansionObserver.observe(lastPageEl)
      }

    }, 300)

    return (): void => {
      clearTimeout(timer)
      expansionObserver.disconnect()
    }
  }, [visibleRange, pdfTotalNumPages])

  if (!pdfPath || !pdfTotalNumPages || (!pdfCurrentPage && pdfCurrentPage != 0)) {
    return <div>Error: No PDF data found.</div>
  }

  const pagesToRender: number[] = []
  for (let i = visibleRange.start; i <= visibleRange.end; i++) {
    if (i >= 1 && i <= Number(pdfTotalNumPages)) {
      pagesToRender.push(i)
    }
  }

  const handlePageChange = (value: number):void => {
    const newPage = Math.min(Math.max(1, value), Number(pdfTotalNumPages))
    setCurrentPage(newPage)
    setVisibleRange({
      start: Math.max(1, newPage - 2),
      end: Math.min(newPage + 2, Number(pdfTotalNumPages))
    })

    // scroll to the center page after range update
    setTimeout(() => {
      const targetPage = pageRefs.current[newPage - 1]
      if (targetPage) {
        targetPage.scrollIntoView({behavior: 'instant', block: 'center'})
      }
    }, 200)

  }

  console.log('PAGES TO RENDER', pagesToRender)

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
              onBlur={() => handlePageChange(Number(currentPage)) }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handlePageChange(Number(currentPage))
                }
              }}
              onChange={(value) => {
                if (value !== null && typeof value === 'number') {
                  setCurrentPage(value)
                }
              }}
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
        <div className={classes.reader} ref={containerRef}>
          <Document
            className={classes.pdf}
            file={pdfPath}
            loading={''}
            onLoadSuccess={() => {
              if (typeof currentPage != 'number') return

              const container = containerRef.current
              const targetPage = pageRefs.current[currentPage - 1]

              if (container && targetPage) {
                container.style.overflow = 'hidden'
                requestAnimationFrame(() => {
                  container.scrollTop = targetPage.offsetTop - container.offsetHeight / 2
                  container.style.overflow = ''
                })
              }

              setTimeout(() => {
                const targetPage = pageRefs.current[currentPage - 1]
                console.log(currentPage)
                console.log('SCROLLING TO PAGE:', targetPage)
                if (targetPage) {
                  targetPage.scrollIntoView({ behavior: 'instant', block: 'center' })
                }
              }, 200)
            }}
          >
            {pagesToRender.map((pageNumber) => (
              <div key={pageNumber} ref={(el) => (pageRefs.current[pageNumber - 1] = el)}>
                <Page className={classes.page} scale={1.5} pageNumber={pageNumber} />
              </div>
            ))}
          </Document>
        </div>
      </Stack>
    </>
  )
}
