import { useState, useEffect, useRef } from 'react'
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
import { BookData } from '../../../types/BookData'
import { SaveBookDataResponse } from 'src/types/SaveBookDataResponse'
import { GeneralResponse } from 'src/types/GeneralResponse'

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
  const [booksDataArray, setBooksDataArray] = useState<BookData[]>([])
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

    // fetch books data to load initial view with user's books
    fetchBooksData()

    return (): void => {}
  }, [])

  // fetchBooksData fetches all book data on intial load
  const fetchBooksData = async (): Promise<void> => {
    try {
      const booksData = await window.electron.ipcRenderer.invoke('fetch-books-data')
      setBooksDataArray(booksData)
      setLoading(false)
    } catch (error) {
      console.log('Error fetching all books data:', error)
    }
  }

  // handleFileSelect selection of file, then save this book to library
  const handleSaveNewBook = async (file: File | null): Promise<void> => {
    if (!file || saveLoading) return

    // send file path to main process
    try {
      setSaveLoading(true)
      const result: SaveBookDataResponse = await window.electron.ipcRenderer.invoke(
        'save-new-book',
        file.path
      )

      console.log(saveLoading)

      if (result.success) {
        setBooksDataArray((prevBookData) => [...prevBookData, result.book_data])
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

  // handleDeleteBook
  const handleDeleteBook = async (uuid: UUID): Promise<void> => {
    // attempt to delete book
    try {
      const result: GeneralResponse = await window.electron.ipcRenderer.invoke(
        'delete-book',
        uuid
      )

      if (result.success) {
        setBooksDataArray((prevBookData) => prevBookData.filter((data) => data.id != uuid))
      } else {
        console.error(result.error)
        // TODO: show ui error
      }
    } catch (err) {
      console.error('Unexpeceted error deleteing book:', err)
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
              {booksDataArray &&
                booksDataArray.map((bookData, index) => (
                  <LibraryItem
                    key={index}
                    bookUUID={bookData.id}
                    bookTotalNumPages={bookData.num_pages}
                    bookCurrentPage={bookData.cur_page}
                    bookFrontCoverPage={bookData.front_cover_page}
                    bookZoomLevel={bookData.zoom_level}
                    bookZoomIndex={bookData.zoom_index}
                    bookTitle={bookData.title}
                    bookThumbnailURL={bookData.thumbnail_path}
                    handleDeleteBook={handleDeleteBook}
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
  bookUUID: UUID
  bookTitle: string | null
  bookTotalNumPages: number
  bookCurrentPage: number
  bookFrontCoverPage: number
  bookZoomLevel: number
  bookZoomIndex: number
  bookThumbnailURL: string
  handleDeleteBook: (uuid: UUID) => void
}

export const LibraryItem: React.FC<LibraryItemProps> = ({
  bookUUID,
  bookTitle,
  bookTotalNumPages,
  bookCurrentPage,
  bookFrontCoverPage,
  bookZoomLevel,
  bookZoomIndex,
  bookThumbnailURL,
  handleDeleteBook
}) => {
  const [editingTitle, setEditingTitle] = useState<boolean>(false)
  const [bookTitleText, setBookTitleText] = useState<string>(bookTitle || 'No title found')
  const [completedCheck, setCompletedCheck] = useState<boolean>(false)

  const navigate = useNavigate()

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })

  const percentageRead = (bookCurrentPage / bookTotalNumPages) * 100

  // handleOpenBook navigates to reader and passes book data
  const handleOpenBook = (): void => {
    // disabled if currently editting the library item's title
    if (editingTitle) return

    // TODO: change to be more general when added file_type to book data
    // make more general to work with other types of e-book formats
    const bookFilePath = `app://books/${bookTitle}.pdf`
    console.log('LIBRARY PAGE ZOOM:', bookZoomLevel, bookZoomIndex)
    navigate(`/reader`, {
      state: {
        bookUUID,
        bookTitle,
        bookFilePath,
        bookTotalNumPages,
        bookCurrentPage,
        bookZoomLevel,
        bookZoomIndex
      }
    })
  }

  // TODO:
  // handleSaveTitle saved new title of book
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
                    <NumberInput defaultValue={bookCurrentPage} size="xs" w={60} hideControls />
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
                    <NumberInput defaultValue={bookFrontCoverPage} size="xs" w={60} hideControls />
                    <ActionIcon size="md" variant="outline" aria-label="Settings">
                      <BiSave />
                    </ActionIcon>
                  </Group>
                </Group>
              </Menu.Item>
              <Menu.Divider />
              <Menu.Label>Danger zone</Menu.Label>
              <Menu.Item color="red" leftSection={<HiOutlineTrash />} onClick={() => handleDeleteBook(bookUUID)}>
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
            src={bookThumbnailURL}
            onClick={handleOpenBook}
          />
        </div>
        <div className={`${classes['title-box']} ${editingTitle ? classes['editing-border'] : ''}`}>
          {editingTitle ? (
            <Textarea
              ref={textareaRef}
              aria-label="Title textarea input"
              value={bookTitleText}
              p={0}
              className={classes['title-textarea']}
              variant="unstyled"
              maxRows={2}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setBookTitleText(event.currentTarget.value)}
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
          <Text>{`${bookCurrentPage}/${bookTotalNumPages}`}</Text>
          <Progress value={percentageRead} />
        </div>
      </Paper>
    </>
  )
}
