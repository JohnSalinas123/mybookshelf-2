import { useState, useEffect, useRef, forwardRef } from 'react'
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
  Textarea,
  Group,
  ActionIcon,
  Menu,
  NumberInput,
  Switch
} from '@mantine/core'
import { useNavigate } from 'react-router'

import { RxDotsHorizontal } from 'react-icons/rx'
import { HiOutlineTrash } from 'react-icons/hi'

import classes from './LibraryPage.module.css'
import { UUID } from 'crypto'
import { BiSave } from 'react-icons/bi'
import { BookData } from '@renderer/types/BookData'
import { SaveBookDataResponse } from '@renderer/types/SaveBookDataResponse'

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

interface LibraryProps {
  setTitleBarControls: (controls: React.ReactNode) => void
}

export const LibraryPage: React.FC<LibraryProps> = ({ setTitleBarControls }) => {
  const [pdfBooksData, setPdfBooksData] = useState<BookData[]>([])
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    // clear title bar controls
    setTitleBarControls(null)

    // set add book button
    setTitleBarControls(
      <FileButton onChange={(file) => handleSaveNewBook(file)} accept="application/pdf">
        {(props) => (
          <Button variant="outline" className="sub-button" {...props} radius="sm">
            Add book
          </Button>
        )}
      </FileButton>
    )

    // fetch pdf books data to load initial view with user's books
    fetchPdfBooks()

    return (): void => {}
  }, [])

  // fetchPdfBooks fetches pdf book data on intial load
  const fetchPdfBooks = async (): Promise<void> => {
    try {
      const pdfBooksData = await window.electron.ipcRenderer.invoke('fetch-pdf-books')
      setPdfBooksData(pdfBooksData)
      setLoading(false)
    } catch (error) {
      console.log('Error fetching PDF books:', error)
    }
  }

  // handleFileSelect selection of file, then save this book to library
  const handleSaveNewBook = async (file: File | null): Promise<void> => {
    if (!file || saveLoading) return

    // send file path to main process
    try {
      setSaveLoading(true)
      const result: SaveBookDataResponse = await window.electron.ipcRenderer.invoke(
        'save-pdf',
        file.path
      )

      console.log(saveLoading)

      if (result.success) {
        setPdfBooksData((prevBookData) => [...prevBookData, result.book_data])
      } else {
        console.error(result.error)
        // TODO: show ui error
      }
    } catch (err) {
      console.error('Unexpected error saving book:', err)
    } finally {
      setSaveLoading(false)
    }
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
                    pdfUUID={bookData.id}
                    pdfTotalNumPages={bookData.num_pages}
                    pdfCurrentPage={bookData.cur_page}
                    pdfZoomLevel={bookData.zoom_level}
                    pdfZoomIndex={bookData.zoom_index}
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
  pdfUUID: UUID
  pdfTitle: string | null
  pdfTotalNumPages: number
  pdfCurrentPage: number
  pdfZoomLevel: number
  pdfZoomIndex: number
  pdfThumbnailURL: string
}

export const LibraryItem: React.FC<LibraryItemProps> = ({
  pdfUUID,
  pdfTitle,
  pdfTotalNumPages,
  pdfCurrentPage,
  pdfZoomLevel,
  pdfZoomIndex,
  pdfThumbnailURL
}) => {
  const [editingTitle, setEditingTitle] = useState<boolean>(false)
  const [bookTitle, setBookTitle] = useState<string>(pdfTitle || 'No title found')

  const [completedCheck, setCompletedCheck] = useState<boolean>(false)

  const navigate = useNavigate()

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  //const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })

  //console.log(pdfTitle, pdfFilePath, pdfTotalNumPages, pdfCurrentPage, pdfThumbnailURL)

  const percentageRead = (pdfCurrentPage / pdfTotalNumPages) * 100
  //console.log(percentageRead)

  // handleOpenPdf opens file explorer for user to select a pdf to add
  const handleOpenPdf = (): void => {
    // disabled if currently editting the library item's title
    if (editingTitle) return

    // Open the PDF in the browser
    const pdfPath = `app://books/${pdfTitle}.pdf` // You can use the full path here
    console.log('LIBRARY PAGE ZOOM:', pdfZoomLevel, pdfZoomIndex)
    navigate(`/reader`, {
      state: {
        pdfUUID,
        pdfTitle,
        pdfPath,
        pdfTotalNumPages,
        pdfCurrentPage,
        pdfZoomLevel,
        pdfZoomIndex
      }
    })
  }

  // TODO: handleSaveTitle saves new title of pdf book
  // handleSaveTitle saved new title of pdf
  //const handleSaveTitle = ():void => {
  //
  //}

  useEffect(() => {
    if (editingTitle && textareaRef.current) {
      const textarea = textareaRef.current
      textarea.focus()
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    }
  }, [editingTitle])

  return (
    <>
      <Paper
        pt="3"
        pl="md"
        pr="md"
        pb="xs"
        shadow="sm"
        radius="md"
        withBorder
        className={`${classes.item} ${computedColorScheme === 'dark' ? classes.dark : classes.light}`}
      >
        <Group pb={3} justify="flex-end" w={'100%'}>
          <Menu shadow="md" width={200} position="top-start">
            <Menu.Target>
              <ActionIcon
                size="xs"
                variant="subtle"
                aria-label="Settings"
                color="rgba(255, 255, 255, 1)"
              >
                <RxDotsHorizontal />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Book settings</Menu.Label>
              <Menu.Item className="normal-cursor" closeMenuOnClick={false}>
                <Switch
                  size="xs"
                  checked={completedCheck}
                  label="Completed"
                  onChange={(event) => setCompletedCheck(event.currentTarget.checked)}
                />
              </Menu.Item>
              <Menu.Label>Manual</Menu.Label>
              <Menu.Item className="normal-cursor" p={4} component="div" closeMenuOnClick={false}>
                <Group justify="space-between">
                  <Text size="sm">Page</Text>
                  <Group>
                    <NumberInput size="xs" w={60} hideControls />
                    <ActionIcon size="md" variant="outline" aria-label="Settings">
                      <BiSave />
                    </ActionIcon>
                  </Group>
                </Group>
              </Menu.Item>
              <Menu.Item className="normal-cursor" p={4} component="div" closeMenuOnClick={false}>
                <Group justify="space-between">
                  <Stack justify="center" gap={0} p={0}>
                    <Text size="xs">Front</Text>
                    <Text size="xs">Cover Page</Text>
                  </Stack>
                  <Group>
                    <NumberInput size="xs" w={60} hideControls />
                    <ActionIcon size="md" variant="outline" aria-label="Settings">
                      <BiSave />
                    </ActionIcon>
                  </Group>
                </Group>
              </Menu.Item>
              <Menu.Divider />
              <Menu.Label>Danger zone</Menu.Label>
              <Menu.Item color="red" leftSection={<HiOutlineTrash />}>
                Delete book
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
        <div className={classes['thumbnail-box']}>
          <Image
            fit="contain"
            className={classes.thumbnail}
            radius="md"
            src={pdfThumbnailURL}
            onClick={handleOpenPdf}
          />
        </div>
        <div className={`${classes['title-box']} ${editingTitle ? classes['editing-border'] : ''}`}>
          {editingTitle ? (
            <Textarea
              ref={textareaRef}
              aria-label="Title textarea input"
              value={bookTitle}
              p={0}
              className={classes['title-textarea']}
              variant="unstyled"
              maxRows={2}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setBookTitle(event.currentTarget.value)}
              onBlur={() => {
                setTimeout(() => setEditingTitle(false), 100)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  setEditingTitle(false)
                }
              }}
              autoFocus
            />
          ) : (
            <Text
              onClick={(event) => {
                event.stopPropagation()
                setEditingTitle(true)
              }}
              p={0}
              className={classes.title}
            >
              {bookTitle}
            </Text>
          )}
        </div>
        <div className={classes['pageinfo-box']}>
          <Text>{`${pdfCurrentPage}/${pdfTotalNumPages}`}</Text>
          <Progress value={percentageRead} />
        </div>
      </Paper>
    </>
  )
}
