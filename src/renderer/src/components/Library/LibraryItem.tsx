import { useState } from 'react'
import { pdfjs } from 'react-pdf'

import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import {
  Paper,
  Stack,
  Image,
  Text,
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

import classes from './LibraryItem.module.css'
import { UUID } from 'crypto'
import { BiSave } from 'react-icons/bi'
import { BookData } from '../../../../types/BookData'

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


interface LibraryItemProps {
  bookUUID: UUID
  bookFileName: string
  bookTitle: string | null
  bookCompleted: boolean
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
  bookCompleted,
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
  const [bookTitleState, setBookTitleState] = useState<string>(bookTitle || 'No title found')
  const [bookCompletedState, setBookCompletedState] = useState<boolean>(bookCompleted)
  const [bookCurrentPageState, setCurrentPageState] = useState<number | string>(bookCurrentPage)
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
    updateBookField(bookUUID, 'title', bookTitleState)
  }

  const handleSaveNewCurrentPage = async (): Promise<void> => {
    updateBookField(bookUUID, 'cur_page', bookCurrentPageState)
  }

  const handleSaveCompleted = async (checkedVal : boolean): Promise<void> => {
    updateBookField(bookUUID, 'completed', checkedVal)
  }

  const handleUpdateThumbnailPage = async (): Promise<void> => {
    if (typeof bookThumbnailPageState != 'number' && Number.isFinite(bookThumbnailPageState)) return

    if (bookThumbnailPage == Number(bookThumbnailPageState)) return

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
        className={`${classes['library-item']} ${computedColorScheme === 'dark' ? classes.dark : classes.light}`}
      >
        <Group pb={3} justify="flex-end" w={'100%'}>
          <Menu shadow="md" position="top-start">
            <Menu.Target>
              <ActionIcon
                size="xs"
                variant="subtle"
                aria-label="Settings"
                
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
                      defaultValue={bookTitleState ? bookTitleState : ''}
                      onChange={(event) => setBookTitleState(event.currentTarget.value)}
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
                    checked={bookCompletedState}
                    onChange={(event) => {
                      const newCompletedState = event.currentTarget.checked
                      setBookCompletedState(newCompletedState)
                      handleSaveCompleted(newCompletedState)
                    }}
                  />
                </Group>
              </Menu.Item>
              <Menu.Label>Manual</Menu.Label>
              <Menu.Item className="normal-cursor" p={10} component="div" closeMenuOnClick={false}>
                <Group justify="space-between">
                  <Text size="md">Page</Text>
                  <Group>
                    <NumberInput defaultValue={bookCurrentPageState} size="sm" w={60} hideControls onChange={setCurrentPageState} />
                    <ActionIcon size="lg" variant="outline" aria-label="Settings" onClick={handleSaveNewCurrentPage}>
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
            radius="sm"
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
          <Progress value={bookCompleted ? 100 : percentageRead} color={`${bookCompleted ? 'grey' : 'blue'}`} />
        </div>
      </Paper>
    </>
  )
}