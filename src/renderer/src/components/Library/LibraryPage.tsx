import { useState, useEffect } from 'react'
import { pdfjs } from 'react-pdf'

import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import {
  FileButton,
  Loader,
  Skeleton,
  useComputedColorScheme,
} from '@mantine/core'


import classes from './LibraryPage.module.css'
import { UUID } from 'crypto'
import { BookData } from '../../../../types/BookData'
import { LibraryItem } from './LibraryItem'
import { ControlButton } from '../Buttons/ControlButton'
import { ControlActionButton } from '../Buttons/ControlActionButton'
import { IconFilter, IconSearch } from '@tabler/icons-react'
import { ControlDivider } from '../ControlBar/ControlDivider'
import { IpcResponse } from 'src/types/IpcResponse'

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
  setLeftControls: (controls: React.ReactNode) => void
  setMiddleControls: (controls: React.ReactNode) => void
}

export const LibraryPage: React.FC<LibraryProps> = ({ setLeftControls, setMiddleControls }) => {
  const [booksDataArray, setBooksDataArray] = useState<BookData[]>([])
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)

  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })

  useEffect(() => {
    // clear control bar
    setLeftControls(null)
    setMiddleControls(null)

    // set add book button
    setLeftControls(
      <>
        <FileButton onChange={(file) => handleSaveNewBook(file)} accept="application/pdf">
          {(props) => (
            <ControlButton {...props}>
              Add book
            </ControlButton>
          )}
        </FileButton>
        <ControlDivider/>
        <ControlActionButton
          aria-label="Filter"
        >
          <IconFilter style={{ width: '70%', height: '70%' }} stroke={1.5} />
        </ControlActionButton>
        <ControlDivider />
        <ControlActionButton
          aria-label="Filter"
        >
          <IconSearch style={{ width: '70%', height: '70%' }} stroke={1.5} />
        </ControlActionButton>
        
      </>
    )

    // fetch books data to load initial view with user's books
    fetchBooksData()

    return (): void => { }
  }, [])

  // fetchBooksData fetches all book data on intial load
  const fetchBooksData = async (): Promise<void> => {
    try {
      const response: IpcResponse<BookData[]> = await window.electron.ipcRenderer.invoke('fetch-books-data')

      if (!response.success) {
        throw new Error(response.error)
      }

      const booksData: BookData[] = response.data ?? []

      setBooksDataArray(booksData)
    } catch (error) {
      console.log('Error fetching all books data:', error)
    } finally {
      setLoading(false)
    }
  }

  // handleFileSelect selection of file, then save this book to library
  const handleSaveNewBook = async (file: File | null): Promise<void> => {
    if (!file || saveLoading) return

    // send file path to main process
    try {
      setSaveLoading(true)
      const response: IpcResponse<BookData> = await window.electron.ipcRenderer.invoke(
        'save-new-book',
        file.path
      )

      if (!response.success) {
        throw new Error(response.error)
      }

      if (!response.data) {
        throw new Error('Book data not received')
      }

      const bookData: BookData = response.data

      setBooksDataArray((prevBookData) => [...prevBookData, bookData])
      
    } catch (error) {
      console.error('Error saving new book:', error)
    } finally {
      setSaveLoading(false)
    }
  }

  // handleDeleteBook
  const handleDeleteBook = async (uuid: UUID): Promise<void> => {
    // attempt to delete book
    try {
      const response: IpcResponse<void> = await window.electron.ipcRenderer.invoke('delete-book', uuid)

      if (!response.success) {
        throw new Error(response.error)
      }


      setBooksDataArray((prevBookData) => prevBookData.filter((data) => data.id != uuid))
      
    } catch (err) {
      console.error('Error deleting book:', err)
    }
  }

  // updateBookField updates a book's specified field
  const updateBookField = async (
    uuid: string,
    field: string,
    value: string
  ): Promise<void> => {
    try {
      const response: IpcResponse<void> = await window.electron.ipcRenderer.invoke(
        'update-book-field',
        uuid,
        field,
        value
      )

      if (!response.success) {
        throw new Error(response.error)
      }

      // on success update state for specific book and field
      setBooksDataArray((prevBooks) => {
        const updatedBooks = prevBooks.map((book) => {
          if (book.id === uuid) {

            const fieldsArray = field.split('.')
            
            if (fieldsArray.length == 1) {
              const [singlefField] = fieldsArray
              return {
                ...book,
                [singlefField]: value
              }
            } else if (fieldsArray.length == 2) {
              const [outerField, innerField] = fieldsArray
              return {
                ...book,
                [outerField]: {
                  ...book[outerField],
                  [innerField]: value
                }
              }
            }
          }
          return book
        })
        return updatedBooks
      })
    } catch (err) {
      console.error(`Error updating ${field} for book ${uuid}:`, err)
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
              thumbnail_access_path: result.thumbnail_access_path
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
            
          }}
        >
          <Loader color="blue" size="xl" type="dots" />
        </div>
      ) : (
        <>
          <div className={classes['library-page']}>
            <div className={classes['library-grid']}>
              {booksDataArray &&
                booksDataArray.map((bookData, index) => (
                  <LibraryItem
                    key={index}
                    id={bookData.id}
                    title={bookData.title}
                    completed={bookData.completed}
                    totalPages={bookData.total_pages}
                    curPage={bookData.view_state.cur_page}
                    thumbnailPage={bookData.thumbnail_page}
                    zoomLevel={bookData.view_state.zoom_level}
                    zoomIndex={bookData.view_state.zoom_index}
                    thumbnailAccessPath={bookData.thumbnail_access_path}
                    fileAccessPath={bookData.file_access_path}
                    handleDeleteBook={handleDeleteBook}
                    updateBookField={updateBookField}
                    updateBookThumbnailPage={updateBookThumbnailPage}
                  />
                ))}
              {saveLoading && (
                <Skeleton key={-1} visible={saveLoading} className={classes.skeleton}>
                <div className={classes.skeleton}></div>
              </Skeleton>
              )}
              
            </div>
          </div>
        </>
      )}
    </>
  )
}
