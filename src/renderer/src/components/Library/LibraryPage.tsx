import { useState, useEffect } from 'react'
import { pdfjs } from 'react-pdf'

import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import {
  Button,
  FileButton,
  Loader,
  Skeleton,
  useComputedColorScheme,
} from '@mantine/core'


import classes from './LibraryPage.module.css'
import { UUID } from 'crypto'
import { BookData } from '../../../../types/BookData'
import { SaveBookDataResponse } from 'src/types/SaveBookDataResponse'
import { GeneralResponse } from 'src/types/GeneralResponse'
import { LibraryItem } from './LibraryItem'
import { ControlButton } from '../Buttons/ControlButton'

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
      <FileButton onChange={(file) => handleSaveNewBook(file)} accept="application/pdf">
        {(props) => (
          <ControlButton {...props}>
            Add book
          </ControlButton>
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
          <div className={`${classes['library-page']} ${computedColorScheme === "light" ? classes.light : classes.dark}`}>
            <div className={classes['library-grid']}>
              {booksDataArray &&
                booksDataArray.map((bookData, index) => (
                  <LibraryItem
                    key={index}
                    bookUUID={bookData.id}
                    bookCompleted={bookData.completed}
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
          </div>
        </>
      )}
    </>
  )
}
