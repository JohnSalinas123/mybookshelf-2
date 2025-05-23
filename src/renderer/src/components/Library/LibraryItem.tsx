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
  id: UUID
  title: string | null
  completed: boolean
  totalPages: number
  curPage: number
  thumbnailPage: number
  zoomLevel: number
  zoomIndex: number
  thumbnailAccessPath: string
  fileAccessPath: string
  handleDeleteBook: (uuid: UUID) => void
  updateBookField: (uuid: UUID, field: string, value: any) => void
  updateBookThumbnailPage: (uuid: UUID, page: number) => void
}

export const LibraryItem: React.FC<LibraryItemProps> = ({
  id,
  title,
  completed,
  totalPages,
  curPage,
  thumbnailPage,
  zoomLevel,
  zoomIndex,
  thumbnailAccessPath,
  fileAccessPath,
  handleDeleteBook,
  updateBookField,
  updateBookThumbnailPage
}) => {
  const [bookTitleState, setBookTitleState] = useState<string>(title || 'No title found')
  const [bookCompletedState, setBookCompletedState] = useState<boolean>(completed)
  const [bookCurrentPageState, setCurrentPageState] = useState<number | string>(curPage)
  const [bookThumbnailPageState, setBookThumnailPageState] = useState<number | string>(
    thumbnailPage
  )

  const navigate = useNavigate()

  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })

  const percentageRead = (curPage / totalPages) * 100

  // handleOpenBook navigates to reader and passes book data
  const handleOpenBook = (): void => {
    // TODO: change to be more general when added file_type to book data
    // make more general to work with other types of e-book formats
    navigate(`/reader`, {
      state: {
        id,
        title,
        totalPages,
        curPage,
        zoomLevel,
        zoomIndex,
        fileAccessPath
      }
    })
  }

  const handleSaveTitle = async (): Promise<void> => {
    updateBookField(id, 'title', bookTitleState)
  }

  const handleSaveNewCurrentPage = async (): Promise<void> => {
    updateBookField(id, 'view_state.cur_page', bookCurrentPageState)
  }

  const handleSaveCompleted = async (checkedVal : boolean): Promise<void> => {
    updateBookField(id, 'completed', checkedVal)
  }

  const handleUpdateThumbnailPage = async (): Promise<void> => {
    if (typeof bookThumbnailPageState != 'number' && Number.isFinite(bookThumbnailPageState)) return

    if (thumbnailPage == Number(bookThumbnailPageState)) return

    updateBookThumbnailPage(id, Number(bookThumbnailPageState))
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
                      defaultValue={thumbnailPage}
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
                onClick={() => handleDeleteBook(id)}
              >
                Delete book
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
        <Paper className={classes['thumbnail-box']} withBorder shadow="xs">
          <Image
            fit="contain"
            className={classes.thumbnail}
            radius="sm"
            src={thumbnailAccessPath}
            onClick={handleOpenBook}
          />
        </Paper>
        <div className={classes['title-box']}>
          <Text p={0} className={classes.title}>
            {title}
          </Text>
        </div>
        <div className={classes['pageinfo-box']}>
          <Text>{`${curPage}/${totalPages}`}</Text>
          <Progress value={completed ? 100 : percentageRead} color={`${completed ? 'grey' : 'blue'}`} />
        </div>
      </Paper>
    </>
  )
}