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
  Group,
  ActionIcon,
  Menu,
  NumberInput,
  Switch,
  TextInput
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
      const booksData: BookData[] = await window.electron.ipcRenderer.invoke('fetch-books-data')
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
      const result: GeneralResponse = await window.electron.ipcRenderer.invoke('delete-book', uuid)

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

  // updateBookField updates a book's specified field
  const updateBookField = async (
    uuid: string,
    field: keyof BookData,
    value: BookData[typeof field]
  ): Promise<void> => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'update-book-field',
        uuid,
        field,
        value
      )

      if (!result?.success) {
        console.log(`Failed to update ${field} for book ${uuid}:`, result?.error)
      }

      // on success update state for specific book and field
      setBooksDataArray((prevBooks) => {
        const updatedBooks = prevBooks.map((book) => {
          if (book.id === uuid) {
            return {
              ...book,
              [field]: value
            }
          }
          return book
        })
        return updatedBooks
      })
    } catch (err) {
      console.error(`Unexpeceted error updating ${field} for book ${uuid}:`, err)
    }
  }

  // updateBookThumbnailPage
  const updateBookThumbnailPage = async (uuid: UUID, page: number): Promise<void> => {
    try {
      const result = await window.electron.ipcRenderer.invoke('update-book-thumbnail', uuid, page)

      if (!result?.success) {
        console.log(`Failed to update thumbnail for book ${uuid}:`, result?.error)
      }

      console.log(result)

      setBooksDataArray((prevBooks) => {
        const updatedBooks = prevBooks.map((book) => {
          if (book.id === uuid) {
            return {
              ...book,
              thumbnail_page: result.thumbnail_page,
              thumbnail_path: result.thumbnail_path
            }
          }
          return book
        })
        console.log(updatedBooks)
        return updatedBooks
      })



    } catch (err) {
      console.error(`Unexpeceted error updating thumbnail for book ${uuid}:`, err)
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
                    bookFileName={bookData.file_name_complete}
                    bookTotalNumPages={bookData.num_pages}
                    bookCurrentPage={bookData.cur_page}
                    bookThumbnailPage={bookData.thumbnail_page}
                    bookZoomLevel={bookData.zoom_level}
                    bookZoomIndex={bookData.zoom_index}
                    bookTitle={bookData.title}
                    bookThumbnailURL={bookData.thumbnail_path}
                    handleDeleteBook={handleDeleteBook}
                    updateBookField={updateBookField}
                    updateBookThumbnailPage={updateBookThumbnailPage}
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
  bookFileName: string
  bookTitle: string | null
  bookTotalNumPages: number
  bookCurrentPage: number
  bookThumbnailPage: number
  bookZoomLevel: number
  bookZoomIndex: number
  bookThumbnailURL: string
  handleDeleteBook: (uuid: UUID) => void
  updateBookField: (uuid: UUID, field: keyof BookData, value: BookData[typeof field]) => void
  updateBookThumbnailPage: (uuid: UUID, page: number) => void
}

export const LibraryItem: React.FC<LibraryItemProps> = ({
  bookUUID,
  bookFileName,
  bookTitle,
  bookTotalNumPages,
  bookCurrentPage,
  bookThumbnailPage,
  bookZoomLevel,
  bookZoomIndex,
  bookThumbnailURL,
  handleDeleteBook,
  updateBookField,
  updateBookThumbnailPage
}) => {
  const [bookTitleText, setBookTitleText] = useState<string>(bookTitle || 'No title found')
  const [completedCheck, setCompletedCheck] = useState<boolean>(false)
  const [bookThumbnailPageState, setBookThumnailPageState] = useState<number | string>(
    bookThumbnailPage
  )

  const navigate = useNavigate()

  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })

  const percentageRead = (bookCurrentPage / bookTotalNumPages) * 100

  // handleOpenBook navigates to reader and passes book data
  const handleOpenBook = (): void => {
    // TODO: change to be more general when added file_type to book data
    // make more general to work with other types of e-book formats
    const bookFilePath = `app://books/${bookFileName}`
    console.log(bookFilePath)
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

  const handleSaveTitle = async (): Promise<void> => {
    updateBookField(bookUUID, 'title', bookTitleText)
  }

  const handleUpdateThumbnailPage = async (): Promise<void> => {
    if (typeof bookThumbnailPageState != 'number' && Number.isFinite(bookThumbnailPageState)) return;

    if (bookThumbnailPage == Number(bookThumbnailPageState)) return;

    updateBookThumbnailPage(bookUUID, Number(bookThumbnailPageState))
  }

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
          <Menu shadow="md" position="top-start">
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
              <Menu.Item p={10} component="div" className="normal-cursor" closeMenuOnClick={false}>
                <Stack gap={2}>
                  <Text>Title</Text>
                  <Group p={0} justify="space-between" align="center">
                    <TextInput
                      defaultValue={bookTitle ? bookTitle : ''}
                      onChange={(event) => setBookTitleText(event.currentTarget.value)}
                      placeholder="Input placeholder"
                    />
                    <ActionIcon
                      size="md"
                      variant="outline"
                      aria-label="Settings"
                      onClick={handleSaveTitle}
                    >
                      <BiSave />
                    </ActionIcon>
                  </Group>
                </Stack>
              </Menu.Item>
              <Menu.Item className="normal-cursor" closeMenuOnClick={false}>
                <Group>
                  <Text>Completed</Text>
                  <Switch
                    size="sm"
                    checked={completedCheck}
                    onChange={(event) => setCompletedCheck(event.currentTarget.checked)}
                  />
                </Group>
              </Menu.Item>
              <Menu.Label>Manual</Menu.Label>
              <Menu.Item className="normal-cursor" p={10} component="div" closeMenuOnClick={false}>
                <Group justify="space-between">
                  <Text size="md">Page</Text>
                  <Group>
                    <NumberInput defaultValue={bookCurrentPage} size="sm" w={60} hideControls />
                    <ActionIcon size="lg" variant="outline" aria-label="Settings">
                      <BiSave size={20} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Menu.Item>
              <Menu.Item className="normal-cursor" p={10} component="div" closeMenuOnClick={false}>
                <Group justify="space-between">
                  <Stack justify="center" gap={0} p={0}>
                    <Text size="md">Front </Text>
                    <Text size="md">cover page</Text>
                  </Stack>
                  <Group>
                    <NumberInput
                      defaultValue={bookThumbnailPage}
                      size="sm"
                      w={60}
                      hideControls
                      onChange={setBookThumnailPageState}
                    />
                    <ActionIcon
                      size="lg"
                      variant="outline"
                      aria-label="Settings"
                      onClick={handleUpdateThumbnailPage}
                    >
                      <BiSave size={20} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Menu.Item>
              <Menu.Divider />
              <Menu.Label>Danger zone</Menu.Label>
              <Menu.Item
                color="red"
                leftSection={<HiOutlineTrash />}
                onClick={() => handleDeleteBook(bookUUID)}
              >
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
        <div className={classes['title-box']}>
          <Text p={0} className={classes.title}>
            {bookTitle}
          </Text>
        </div>
        <div className={classes['pageinfo-box']}>
          <Text>{`${bookCurrentPage}/${bookTotalNumPages}`}</Text>
          <Progress value={percentageRead} />
        </div>
      </Paper>
    </>
  )
}
