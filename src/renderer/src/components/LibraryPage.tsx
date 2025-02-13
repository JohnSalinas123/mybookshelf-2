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
  Progress,
  useComputedColorScheme,
} from '@mantine/core'
import { useNavigate } from 'react-router'

import classes from './LibraryPage.module.css'

if (process.env.NODE_ENV === 'development') {
  // In dev, the public folder is served at root:
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
} else {
  // In production, use the URL relative to the current location.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdf.worker.min.mjs',
    window.location.href
  ).toString()
}

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

export const LibraryPage: React.FC<LibraryProps> = ({ setTitleBarControls }) => {
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
                  <LibraryItem
                    key={index}
                    pdfTotalNumPages={bookData.num_pages}
                    pdfCurrentPage={bookData.cur_page}
                    pdfTitle={bookData.title}
                    pdfThumbnailURL={bookData.thumbnail_path}
                  />
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
  pdfTotalNumPages: number
  pdfCurrentPage: number
  pdfThumbnailURL: string
}

export const LibraryItem: React.FC<LibraryItemProps> = ({
  pdfTitle,
  pdfTotalNumPages,
  pdfCurrentPage,
  pdfThumbnailURL
}) => {
  const navigate = useNavigate()

  //const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  //console.log(pdfTitle, pdfFilePath, pdfTotalNumPages, pdfCurrentPage, pdfThumbnailURL)

  const percentageRead = (pdfCurrentPage / pdfTotalNumPages) * 100
  //console.log(percentageRead)

  const handleOpenPdf = (): void => {
    // Open the PDF in the browser
    const pdfPath = `app://books/${pdfTitle}.pdf` // You can use the full path here
    navigate(`/reader`, { state: { pdfTitle, pdfPath, pdfTotalNumPages, pdfCurrentPage } })
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
        onClick={handleOpenPdf}
        className={`${classes.item} ${computedColorScheme === 'dark' ? classes.dark : classes.light}`}
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
