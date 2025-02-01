import { useState, useEffect } from 'react'
import { pdfjs } from 'react-pdf'
import { IoIosAddCircleOutline } from 'react-icons/io'

import './Library.css'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { Button, FileButton, Group, Loader, Paper, Stack, Image, Text } from '@mantine/core'

import classes from './Library.module.css'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface PdfBookData {
  title: string | null
  file_path: string
  num_pages: number
  thumbnail_path: string
}

//type IpcRendererEvent = {
//  sender: Electron.IpcRenderer
//  returnValue?: unknown
//}

export const Library: React.FC = () => {
  const [pdfBooksData, setPdfBooksData] = useState<PdfBookData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    // fetch pdf books data to load initial view with user's books
    fetchPdfBooks()


    //window.electron.ipcRenderer.send('fetch-pdf-books')

    /*
    window.electron.ipcRenderer.on(
      'pdf-data',
      (_event: IpcRendererEvent, pdfFileDataObjs: PdfBookData[]) => {
        setPdfBooksData(pdfFileDataObjs)
        setLoading(false)
      }
    )
    */

    window.electron.ipcRenderer.on('pdf-added', (_event, newBookData) => {
      setPdfBooksData((prevBookData) => [...prevBookData, newBookData])
    })

    return (): void => {
      window.electron.ipcRenderer.removeAllListeners('pdf-data')
    }
  }, [])
  
  const fetchPdfBooks = async(): Promise<void> => {
    try {
      const pdfBooksData = await window.electron.ipcRenderer.invoke('fetch-pdf-books')
      setPdfBooksData(pdfBooksData)
      setLoading(false)
    } catch (error) {
      console.log('Error fetching PDF books:', error)
    }

  }

  const handleFileSelect = (file: File | null): void => {
    if (!file) return

    // send fild path to main process
    window.electron.ipcRenderer.send('save-pdf', file.path)
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
            <Group className={classes['control-bar']}>
              <FileButton onChange={(file) => handleFileSelect(file)} accept="application/pdf">
                {(props) => (
                  <Button {...props} radius="xl" rightSection={<IoIosAddCircleOutline />}>
                    Add new book
                  </Button>
                )}
              </FileButton>
            </Group>

            <div className="library-grid">
              {pdfBooksData &&
                pdfBooksData.map((bookData, index) => (
                  <LibraryItem
                    key={index}
                    pdfFilePath={bookData.file_path}
                    pdfNumPages={bookData.num_pages}
                    pdfTitle={bookData.title}
                    pdfThumbnailURL={bookData.thumbnail_path}
                  />
                ))}
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
  pdfNumPages: number
  pdfThumbnailURL: string
}

export const LibraryItem: React.FC<LibraryItemProps> = ({
  pdfTitle,
  pdfFilePath,
  pdfNumPages,
  pdfThumbnailURL
}) => {

  console.log(pdfTitle, pdfFilePath, pdfNumPages, pdfThumbnailURL)

  //const handleClick = (data: string): void => {
  //  console.log(`Navigating to Reader with PDF data`)
  //  navigate(`/reader`, {state: {data}})
  //}

  /*
  const handleOpenPdf = (): void => {
    // Open the PDF in the browser
    const pdfUrl = `app://${pdfFilePath}` // You can use the full path here
    console.log(pdfUrl)
    window.open(pdfUrl, '_blank') // Open in a new browser tab
  }
  */

  return (
    <>
      <Paper pt="md" pl="md" pr="md" pb="xs" shadow="sm" radius="md" withBorder className={classes.item} >
        <div className={classes['thumbnail-box']}>
          <Image
            fit="contain"
            className={classes.thumbnail}
            radius="md"
            src={pdfThumbnailURL}
          />
        </div>
        <Text p={5} className={classes.title}>
            {typeof pdfTitle !== 'undefined' ? pdfTitle : 'No title found'}
        </Text>
      </Paper>
    </>
  )
}


