// ipcHandlers for book operations

import { app, ipcMain } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import pdf from 'pdf-parse'
import { fromPath } from 'pdf2pic'

import { BookData, DeletedBookData } from '../../types/BookData'
import { randomUUID } from 'crypto'

const bookCopyDirPath = path.join(app.getPath('userData'), 'books')
const thumbnailDirPath = path.join(app.getPath('userData'), 'thumbnails')
const dataDirPath = path.join(app.getPath('userData'), 'data')
const bookDataFilePath = path.join(dataDirPath, 'books.json')
const deletedBookDataFilePath = path.join(dataDirPath, 'deleted-books.json')

// setupBookIpcHandlers sets up ipc handlers for book operations
export const setupBookIpcHandlers = async (): Promise<void> => {
  await getBooksData()
  await saveNewBook()
  await saveBookCurrentPage()
  await saveBookZoomAndIndex()
  await updateBookAsMostRecent()
  await deleteBook()
  await bookSingleFieldUpdater()
  await updateBookThumbnailPage()
}

// getBooksData: retrives book data
const getBooksData = async (): Promise<void> => {
  // make directories and files for book data if they don't exist
  await fs.mkdir(bookCopyDirPath, { recursive: true }).catch(console.error)
  await fs.mkdir(thumbnailDirPath, { recursive: true }).catch(console.error)
  await fs.mkdir(dataDirPath, { recursive: true }).catch(console.error)

  try {
    await fs.access(bookDataFilePath)
  } catch {
    await fs.writeFile(bookDataFilePath, '[]', 'utf-8')
  }

  ipcMain.handle('fetch-books-data', async () => {
    try {
      let booksDataJson: BookData[] = []
      try {
        const booksData = await fs.readFile(bookDataFilePath, 'utf-8')
        booksDataJson = JSON.parse(booksData)
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT')
          throw error
      }

      return booksDataJson
    } catch (error) {
      console.log('Error fetching books data:', error)
      throw new Error('Failed to fetch books data')
    }
  })
}

// saveNewBook: save new book to library
const saveNewBook = async (): Promise<void> => {
  ipcMain.handle('save-new-book', async (_event, filePath) => {
    try {
      const fileName = path.basename(filePath)
      const bookFileCopyPath = path.join(bookCopyDirPath, fileName)

      // copy book to storage
      await fs.copyFile(filePath, bookFileCopyPath)

      // read book as a buffer
      const pdfBuffer = await fs.readFile(bookFileCopyPath)

      // TODO: generalize to work for other e-book file types, such as epub
      // extract number of pages
      const pdfInfo = await pdf(pdfBuffer)
      const numPages = pdfInfo.numpages

      // format filename for saving thumbnail
      //const fileNameTrim = fileName.replace('.pdf', '')

      const fileNameTrim = randomUUID()

      console.log('Filepath:', filePath)
      console.log('Filename:', fileName)
      console.log('Filename trimmed:', fileNameTrim)

      // generate first-page thumbnail
      const converter = fromPath(bookFileCopyPath, {
        density: 150,
        saveFilename: fileNameTrim,
        savePath: thumbnailDirPath,
        format: 'png',
        width: 300
      })

      //
      const thumbnailDefaultPage = 1

      try {
        await converter(thumbnailDefaultPage, { responseType: 'image' })
      } catch (err) {
        console.error('Error generating thumbnail:', err)
      }

      let booksDataJson: BookData[] = []
      try {
        const booksData = await fs.readFile(bookDataFilePath, 'utf-8')
        booksDataJson = JSON.parse(booksData)
      } catch (err) {
        console.log('Metadata file not found, creating a new one')
      }

      // thumbnail url
      const thumbnailURL = `app://thumbnails/${fileNameTrim}.${thumbnailDefaultPage}.png`

      // uuid for pdf in metadata file
      const bookUUID = crypto.randomUUID()

      // create_at, updated_at timestamp
      const timestamp = new Date().toISOString()

      const newBookObj: BookData = {
        id: bookUUID,
        title: fileName.replace('.pdf', ''),
        completed: false,
        file_name: fileNameTrim,
        file_name_complete: fileName,
        file_path: bookFileCopyPath,
        num_pages: numPages,
        cur_page: 0,
        thumbnail_page: thumbnailDefaultPage,
        zoom_level: 100,
        zoom_index: 7,
        thumbnail_path: thumbnailURL,
        created_at: timestamp,
        updated_at: timestamp
      }

      // add new book info to metadata
      booksDataJson.push(newBookObj)

      // TODO: test efficiency of loading entire metadata every time a book is added
      // -> find better way to appending to existing metadata
      // save updated metadata
      await fs.writeFile(bookDataFilePath, JSON.stringify(booksDataJson, null, 2))

      return {
        success: true,
        book_data: newBookObj
      }
    } catch (error) {
      console.error('Error saving new book:', error)
      return { success: false, error: `Failed to save new book: ${error}` }
    }
  })
}

// saveBookCurrentPage save book current page
const saveBookCurrentPage = async (): Promise<void> => {
  ipcMain.handle('save-book-page', async (_event, uuid, currentPage) => {
    let booksDataJson: BookData[] = []

    try {
      try {
        const booksData = await fs.readFile(bookDataFilePath, 'utf-8')
        booksDataJson = JSON.parse(booksData)
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT')
          throw error
      }

      let bookSavedBool = false

      // update books.json with new currentPage for book with specific uuid
      for (const bookDataItem of booksDataJson) {
        if (bookDataItem.id === uuid) {
          bookDataItem.cur_page = currentPage
          bookSavedBool = true
          break
        }
      }

      if (!bookSavedBool) return false

      await fs.writeFile(bookDataFilePath, JSON.stringify(booksDataJson, null, 2), 'utf-8')

      console.log(`Saved page ${currentPage} for book ${uuid}`)

      return true
    } catch (error) {
      console.log('Error saving book current page', error)
      return false
    }
  })
}

// saveBookZoomAndIndex save book zoom and zoom index
const saveBookZoomAndIndex = async (): Promise<void> => {
  ipcMain.on('save-page-zoom', async (_event, uuid, pageZoom, pageZoomIndex) => {
    let booksDataJson: BookData[] = []
    try {
      try {
        const data = await fs.readFile(bookDataFilePath, 'utf-8')
        booksDataJson = JSON.parse(data)
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT')
          throw error
      }

      // update metadata.json with new page zoom and zoom index for book with specific UUID arg
      for (const bookMetaData of booksDataJson) {
        if (bookMetaData.id === uuid) {
          bookMetaData.zoom_level = pageZoom
          bookMetaData.zoom_index = pageZoomIndex
          break
        }
      }

      // saves changes to file
      await fs.writeFile(bookDataFilePath, JSON.stringify(booksDataJson, null, 2), 'utf-8')
      console.log('Saved zoom_level & zoom_index:', pageZoom, pageZoomIndex)
    } catch (error) {
      console.log("Error updating book's zoom level and zoom index")
    }
  })
}

// updateBookAsMostRecent update book as most recently interacted with
const updateBookAsMostRecent = async (): Promise<void> => {
  ipcMain.on('update-book-as-recent', async (_event, uuid) => {
    let booksDataJson: BookData[] = []

    try {
      try {
        const data = await fs.readFile(bookDataFilePath, 'utf-8')
        booksDataJson = JSON.parse(data)
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT')
          throw error
      }

      for (let i = 0; i < booksDataJson.length; i++) {
        if (booksDataJson[i].id != uuid) continue

        const bookItemRemoved = booksDataJson.splice(i, 1)[0]
        if (bookItemRemoved) {
          booksDataJson = [bookItemRemoved, ...booksDataJson]
        }
        break
      }

      // save the update book metadata back to the file
      await fs.writeFile(bookDataFilePath, JSON.stringify(booksDataJson, null, 2), 'utf-8')
    } catch (error) {
      console.log('Error updating book to be most recently opened', error)
    }
  })
}

// deleteBook delete book from library
// keep archive of deleted data just in case
const deleteBook = async (): Promise<void> => {
  // check for existence of deleted-book.json, if doesn't exist create file
  try {
    await fs.access(deletedBookDataFilePath)
  } catch {
    await fs.writeFile(deletedBookDataFilePath, '[]', 'utf-8')
  }

  ipcMain.handle('delete-book', async (_event, uuid) => {
    // read books data json, find book with matching uuid
    let booksDataJson: BookData[] = []

    try {
      try {
        const booksData = await fs.readFile(bookDataFilePath, 'utf-8')
        booksDataJson = JSON.parse(booksData)
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT')
          throw error
      }

      // check if book attempting to delete exists
      const bookToDelete = booksDataJson.find((book) => book.id === uuid)

      if (!bookToDelete) {
        return { success: false, error: `Book with id ${uuid} not found` }
      }

      const updatedBooksAfterDeletion = booksDataJson.filter((book) => book.id !== uuid)

      await fs.writeFile(
        bookDataFilePath,
        JSON.stringify(updatedBooksAfterDeletion, null, 2),
        'utf-8'
      )

      console.log(`Successfully deleleted book with uuid ${uuid}`)

      // save deleted book to deleted-books.json
      let deletedBooksDataJson: DeletedBookData[] = []

      try {
        const deletedBooksData = await fs.readFile(deletedBookDataFilePath, 'utf-8')
        deletedBooksDataJson = JSON.parse(deletedBooksData)
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT')
          throw error
      }

      //TODO: check if deleted-books.json is at deletion limit if so
      // delete oldest deleted book row, also delete associated book file
      // and book thumbnail

      deletedBooksDataJson.push({
        ...bookToDelete,
        deleted_at: new Date().toISOString()
      })

      await fs.writeFile(
        deletedBookDataFilePath,
        JSON.stringify(deletedBooksDataJson, null, 2),
        'utf-8'
      )

      return {
        success: true
      }
    } catch (error) {
      console.log('Error fetching books data:', error)
      return { success: false, error: `Failed to save new book ${error}` }
    }
  })
}

// bookSingleFieldUpdater save book current page
const bookSingleFieldUpdater = async (): Promise<void> => {
  ipcMain.handle('update-book-field', async (_event, uuid, field, value) => {
    let booksDataJson: BookData[] = []

    try {
      try {
        const booksData = await fs.readFile(bookDataFilePath, 'utf-8')
        booksDataJson = JSON.parse(booksData)
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT')
          throw error
      }

      let bookSavedBool = false

      // update books.json with new currentPage for book with specific uuid
      for (const bookDataItem of booksDataJson) {
        if (bookDataItem.id === uuid) {
          bookDataItem[field] = value
          bookSavedBool = true
          break
        }
      }

      if (!bookSavedBool) return false

      await fs.writeFile(bookDataFilePath, JSON.stringify(booksDataJson, null, 2), 'utf-8')

      console.log(`Updated ${field} with ${value} for book ${uuid}`)

      return {
        success: true,
        updated_field: field,
        updated_value: value
      }
    } catch (error) {
      console.log(`Error updating ${field} with ${value} for book ${uuid}`, error)
      return { success: false, error: `Failed to update ${field}: ${error}` }
    }
  })
}

const updateBookThumbnailPage = async (): Promise<void> => {
  ipcMain.handle('update-book-thumbnail', async (_event, uuid, page) => {
    console.log(`attempting to update book thumbnail to page ${page}`)
    let booksDataJson: BookData[] = []

    try {
      // TODO: improve error handling for reading book file
      try {
        const bookData = await fs.readFile(bookDataFilePath, 'utf-8')
        booksDataJson = JSON.parse(bookData)
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT')
          throw error
      }

      const bookDataItem = booksDataJson.find((item) => item.id === uuid)

      if (!bookDataItem) {
        throw new Error(`No book found with uuid: ${uuid}`)
      }

      if (!bookDataItem.thumbnail_path || bookDataItem.thumbnail_path == '') {
        throw new Error(`Missing thumbnail path for book with uuid ${uuid}`)
      }

      if (!bookDataItem.file_path || bookDataItem.file_path == '') {
        throw new Error(`Missing file path for book with uuid ${uuid}`)
      }

      const thumbnailFileName = path.basename(bookDataItem.thumbnail_path)
      // TODO: generalize to work with other file formats
      const thumbnailFileNameTrimmed = thumbnailFileName.replace(
        `.${bookDataItem.thumbnail_page}.png`,
        ''
      )

      // generate new page as thumbnail
      const converter = fromPath(bookDataItem.file_path, {
        density: 150,
        saveFilename: thumbnailFileNameTrimmed,
        savePath: thumbnailDirPath,
        format: 'png',
        width: 300
      })

      try {
        await converter(page, { responseType: 'image' })
      } catch (error) {
        throw new Error(
          `Failed to generate thumbnail for book uuid ${uuid}: ${error instanceof Error ? error.message : String(error)}`
        )
      }

      // delete old thumbnail
      const oldThumbnailPath = path.join(thumbnailDirPath, thumbnailFileName)
      try {
        console.log(oldThumbnailPath)
        await fs.unlink(oldThumbnailPath)
        console.log(`Deleted old thumbnail: ${oldThumbnailPath}`)
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
          throw new Error(`Failed to delete old thumbnail: ${error}`)
        } else {
          console.warn(`Old thumbnail not found, skipping delete: ${oldThumbnailPath}`)
        }
      }

      // update thumbnail_page and save books data back to file
      const newThumbnailPath = `app://thumbnails/${bookDataItem.file_name}.${page}.png`
      bookDataItem.thumbnail_page = page
      bookDataItem.thumbnail_path = newThumbnailPath

      await fs.writeFile(bookDataFilePath, JSON.stringify(booksDataJson, null, 2))

      return {
        success: true,
        thumbnail_page: page,
        thumbnail_path: newThumbnailPath
      }
    } catch (error) {
      console.error(`Error updating book thumbnail page: ${error}`)
      return { success: false, error: `Failed to save new book: ${error}` }
    }
  })
}
