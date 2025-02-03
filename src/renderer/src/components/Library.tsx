import { useState, useEffect } from 'react'
import { pdfjs } from 'react-pdf'

import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import {
  Button,
  FileButton,
  Loader,
  Paper,
  Stack,
  Image,
  Text,
  Skeleton,
  Progress
} from '@mantine/core'
import { useNavigate } from 'react-router'

import classes from './Library.module.css'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface PdfBookData {
  title: string | null
  file_path: string
  num_pages: number
  cur_page: number
  thumbnail_path: string
}

//type IpcRendererEvent = {
//  sender: Electron.IpcRenderer
//  returnValue?: unknown
//}

interface LibraryProps {
  setTitleBarControls: (controls: React.ReactNode) => void
}

export const Library: React.FC<LibraryProps> = ({ setTitleBarControls }) => {
  const [pdfBooksData, setPdfBooksData] = useState<PdfBookData[]>([])
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    // clear title bar controls
    setTitleBarControls(null)

    // set add book button
    setTitleBarControls(
      <FileButton onChange={(file) => handleFileSelect(file)} accept="application/pdf">
        {(props) => (
          <Button variant="outline" className="sub-button" {...props} radius="sm">
            Add book
          </Button>
        )}
      </FileButton>
    )

    // fetch pdf books data to load initial view with user's books
    fetchPdfBooks()

    const handlePdfAdded = (_event, newBookData): void => {
      setPdfBooksData((prevBookData) => [...prevBookData, newBookData])
      setSaveLoading(false)
    }

    window.electron.ipcRenderer.on('pdf-added', handlePdfAdded)

    return (): void => {
      window.electron.ipcRenderer.removeAllListeners('pdf-added')
    }
  }, [])

  const fetchPdfBooks = async (): Promise<void> => {
    try {
      const pdfBooksData = await window.electron.ipcRenderer.invoke('fetch-pdf-books')
      setPdfBooksData(pdfBooksData)
      setLoading(false)
    } catch (error) {
      console.log('Error fetching PDF books:', error)
    }
  }

  const handleFileSelect = (file: File | null): void => {
    if (!file || saveLoading) return

    // send fild path to main process
    window.electron.ipcRenderer.send('save-pdf', file.path)
    setSaveLoading(true)
  }

  return (
    <>
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw'
          }}
        >
          <Loader color="blue" size="xl" type="dots" />
        </div>
      ) : (
        <>
          <Stack gap={0}>
            <div className={classes['library-grid']}>
              {pdfBooksData &&
                pdfBooksData.map((bookData, index) => (
                  <>
                    <LibraryItem
                      key={index}
                      pdfFilePath={bookData.file_path}
                      pdfTotalNumPages={bookData.num_pages}
                      pdfCurrentPage={bookData.cur_page}
                      pdfTitle={bookData.title}
                      pdfThumbnailURL={bookData.thumbnail_path}
                    />
                  </>
                ))}
              <Skeleton key={-1} visible={saveLoading}>
                <div className={classes.skeleton}></div>
              </Skeleton>
            </div>
          </Stack>
        </>
      )}
    </>
  )
}

interface LibraryItemProps {
  pdfTitle: string | null
  pdfFilePath: string
  pdfTotalNumPages: number
  pdfCurrentPage: number
  pdfThumbnailURL: string
}

export const LibraryItem: React.FC<LibraryItemProps> = ({
  pdfTitle,
  pdfFilePath,
  pdfTotalNumPages,
  pdfCurrentPage,
  pdfThumbnailURL
}) => {
  const navigate = useNavigate()

  console.log(pdfTitle, pdfFilePath, pdfTotalNumPages, pdfCurrentPage, pdfThumbnailURL)

  //const handleClick = (data: string): void => {
  //  console.log(`Navigating to Reader with PDF data`)
  //
  //}

  const percentageRead = (pdfCurrentPage / pdfTotalNumPages)*100
  console.log(percentageRead)

  const handleOpenPdf = (): void => {
    // Open the PDF in the browser
    const pdfPath = `app://books/${pdfTitle}.pdf` // You can use the full path here
    navigate(`/reader`, { state: { pdfPath, pdfTotalNumPages , pdfCurrentPage } })
  }

  return (
    <>
      <Paper
        pt="md"
        pl="md"
        pr="md"
        pb="xs"
        shadow="sm"
        radius="md"
        withBorder
        className={classes.item}
        onClick={handleOpenPdf}
      >
        <div className={classes['thumbnail-box']}>
          <Image fit="contain" className={classes.thumbnail} radius="md" src={pdfThumbnailURL} />
        </div>
        <Text p={5} className={classes.title}>
          {typeof pdfTitle !== 'undefined' ? pdfTitle : 'No title found'}
        </Text>
        <div className={classes['pageinfo-box']}>
          <Text>{`${pdfCurrentPage}/${pdfTotalNumPages}`}</Text>
          <Progress value={percentageRead} />
        </div>
      </Paper>
    </>
  )
}
