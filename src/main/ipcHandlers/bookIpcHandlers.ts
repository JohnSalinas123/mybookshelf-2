// ipcHandlers for book operations

import { app, ipcMain } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import pdf from 'pdf-parse'
import { fromPath } from 'pdf2pic'

import { BookData, DeletedBookData } from '../../types/BookData'
import { randomUUID } from 'crypto'
import { gmConvert } from '../ utility/gmagic'

const booksDirPath = path.join(app.getPath('userData'), 'books')
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
  await fs.mkdir(booksDirPath, { recursive: true }).catch(console.error)
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

      // get original book title from filePath
      const originalFileName = path.basename(filePath)
      const rawBookExt = path.extname(originalFileName).toLowerCase()
      const bookFileExt = rawBookExt.slice(1)
      const originalBookTitle = originalFileName.replace(rawBookExt, '')

      const bookFileUUID = randomUUID()
      const bookUUIDFileName = `${bookFileUUID}.${bookFileExt}`

      const newBookStoragePath = path.join(booksDirPath, bookUUIDFileName)

      // copy book to storage
      try {
         await fs.copyFile(filePath, newBookStoragePath)
      } catch (err) {
        throw new Error(`Failed to copy book file to books dir: ${err}`)
      }
     console.log("Saved book file to books dir")

      // read book as a buffer
      const bookBuffer = await fs.readFile(newBookStoragePath)

      // TODO: generalize to work for other e-book file types, such as epub
      // extract number of pages
      const pdfInfo = await pdf(bookBuffer)
      const numPages = pdfInfo.numpages


      // generate first-page thumbnail
      const thumbnailFileUUID = randomUUID()
      const thumbnailDefaultPage = 1
      const thumbnailExt = 'png'
      
      const thumbnailTempFileUUID = randomUUID()

      const converter = fromPath(newBookStoragePath, {
        density: 150,
        saveFilename: thumbnailTempFileUUID,
        savePath: thumbnailDirPath,
        width: 400
      })

      try {
        await converter(thumbnailDefaultPage, { responseType: 'image' })
      } catch (error) {
        throw new Error(`Failed to generate new thumnaib`)
      }
      

      const newthumbnailStoragePath = path.join(thumbnailDirPath, `${thumbnailFileUUID}.${thumbnailDefaultPage}.${thumbnailExt}`)
      const thumbanailTempFilePath = path.join(thumbnailDirPath, `${thumbnailTempFileUUID}.${thumbnailDefaultPage}.${thumbnailExt}`)
      await gmConvert(thumbanailTempFilePath, newthumbnailStoragePath)
      

      console.log("Saved new thumbnail")

      // delete temp thumbnail
      try {
        await fs.unlink(thumbanailTempFilePath)
      } catch(err) {
        throw new Error(`Failed to delete book temp thumbnail: ${err}`)
      }
      console.log("Deleted temp thumbnail")

      let booksDataJson: BookData[] = []
      try {
        const booksData = await fs.readFile(bookDataFilePath, 'utf-8')
        booksDataJson = JSON.parse(booksData)
      } catch (err) {
        console.log('Books json file not found, creating a new one')
      }

      // thumbnail access path
      const thumbnailAccessPath = `app://thumbnails/${thumbnailFileUUID}.${thumbnailDefaultPage}.${thumbnailExt}`

      // file access path
      const file_access_path = `app://books/${bookFileUUID}.${bookFileExt}`

      // uuid for pdf in metadata file
      const bookEntryUUID = crypto.randomUUID()

      // initial timestamp for created_at, updated_at
      const timestamp = new Date().toISOString()

      const newBookObj: BookData = {
        id: bookEntryUUID,
        title: originalBookTitle,
        completed: false,
        file_id: bookFileUUID,
        file_ext: bookFileExt,
        file_access_path: file_access_path,
        total_pages: numPages,
        view_state: {
          cur_page: 1,
          zoom_level: 100,
          zoom_index: 7,
        },
        thumbnail_id: thumbnailFileUUID,
        thumbnail_ext: thumbnailExt,
        thumbnail_page: thumbnailDefaultPage,
        thumbnail_access_path: thumbnailAccessPath,
        created_at: timestamp,
        updated_at: timestamp
      }

      // add new book data to json
      booksDataJson.push(newBookObj)
      console.log("Added book to books json")

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
          bookDataItem.view_state.cur_page = currentPage
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
          bookMetaData.view_state.zoom_level = pageZoom
          bookMetaData.view_state.zoom_index = pageZoomIndex
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

      console.log(`Attempting to delete book ${uuid}`)

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

      // delete book file
      try {
        const bookFileName = `${bookToDelete.file_id}.${bookToDelete.file_ext}`
        const bookFilePath = path.join(booksDirPath, bookFileName)
        await fs.unlink(bookFilePath)
      } catch(err) {
        throw new Error(`Failed to delete book file: ${err}`)
      }
      console.log(`Deleted book file ${uuid}`)

      // delete book thumbnail
      try {
        const thumbnailFileName = `${bookToDelete.thumbnail_id}.${bookToDelete.thumbnail_page}.${bookToDelete.thumbnail_ext}`
        const thumbnailFilePath = path.join(thumbnailDirPath, thumbnailFileName)
        await fs.unlink(thumbnailFilePath)
      } catch(err) {
        throw new Error(`Failed to delete book thumbnail: ${err}`)
      }
      console.log(`Deleted book thumbnail ${uuid}`)

      // delete book from books json data
      const updatedBooksAfterDeletion = booksDataJson.filter((book) => book.id !== uuid)

      await fs.writeFile(
        bookDataFilePath,
        JSON.stringify(updatedBooksAfterDeletion, null, 2),
        'utf-8'
      )

      console.log(`Deleted book from books.json ${uuid}`)

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

      console.log(`Added data to deleted_books.json ${uuid}`)

      return {
        success: true
      }
    } catch (error) {
      console.log('Error deleting book:', error)
      return { success: false, error: `Failed to delete book ${error}` }
    }
  })
}

// bookSingleFieldUpdater save book current page
const bookSingleFieldUpdater = async (): Promise<void> => {
  ipcMain.handle('update-book-field', async (_event, uuid, field, value) => {
    let booksDataJson: BookData[] = []

    // handle single nested fields
    const fieldsArray = field.split('.')

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

          if (fieldsArray.length == 0) {
            throw new Error(`Missing field(s) in single field updater`)
          }

          if (fieldsArray.length > 2) {
            throw new Error(`Fields limit exceeded at ${fieldsArray.length}`)
          }

          if (fieldsArray.length == 2) {
            bookDataItem[fieldsArray[0]][fieldsArray[1]] = value
          } else {
            bookDataItem[field] = value
          }

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
    } catch (err) {
      console.log(`Error updating ${field} with ${value} for book ${uuid}`, err)
      return { success: false, error: `Failed to update ${field}: ${err}` }
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

      if (!bookDataItem.thumbnail_id || bookDataItem.thumbnail_id == '' || !bookDataItem.thumbnail_ext
        || bookDataItem.thumbnail_ext == ''
      ) {
        throw new Error(`Missing thumbnail_id or thumbnail_ext for book with uuid ${uuid}`)
      }

      if (!bookDataItem.file_id || bookDataItem.file_id == '' || !bookDataItem.file_ext || bookDataItem.file_ext == '') {
        throw new Error(`Missing file_id or file_ext for book with uuid ${uuid}`)
      }


      const bookFileName = `${bookDataItem.file_id}.${bookDataItem.file_ext}`
      const bookFilePath = path.join(booksDirPath, bookFileName)
      

      // generate new page as thumbnail
      const converter = fromPath(bookFilePath, {
        density: 150,
        saveFilename: bookDataItem.thumbnail_id,
        savePath: thumbnailDirPath,
        format: bookDataItem.thumbnail_ext,
        width: 300
      })

      try {
        await converter(page, { responseType: 'image' })
      } catch (error) {
        throw new Error(
          `Failed to generate new thumbnail for book uuid ${uuid}: ${error instanceof Error ? error.message : String(error)}`
        )
      }

      // delete old thumbnail
      try {
        const oldThumbnailStoragePath = path.join(thumbnailDirPath, `${bookDataItem.thumbnail_id}.${bookDataItem.thumbnail_page}.${bookDataItem.thumbnail_ext}`)
        await fs.unlink(oldThumbnailStoragePath)
      } catch(err) {
        throw new Error(`Failed to delete book temp thumbnail: ${err}`)
      }
      console.log("Deleted old thumbnail")

      const tempThumbnailStoragePath = path.join(thumbnailDirPath, `${bookDataItem.thumbnail_id}.${page}.${bookDataItem.thumbnail_ext}`)
      const newThumbnailUUID = randomUUID()
      const newThumbnailStoragePath = path.join(thumbnailDirPath, `${newThumbnailUUID}.${page}.${bookDataItem.thumbnail_ext}`)
      await gmConvert(tempThumbnailStoragePath, newThumbnailStoragePath)

      console.log(`Post processed image at ${tempThumbnailStoragePath} and outputed at ${newThumbnailStoragePath}`)

      // delete temp thumbnail
      try {
        await fs.unlink(tempThumbnailStoragePath)
      } catch(err) {
        throw new Error(`Failed to delete book temp thumbnail: ${err}`)
      }
      console.log("Deleted temp thumbnail")

      // update thumbnail_page and save books data back to file
      const newThumbnailAccessPath = `app://thumbnails/${newThumbnailUUID}.${page}.${bookDataItem.thumbnail_ext}`
      bookDataItem.thumbnail_id = newThumbnailUUID
      bookDataItem.thumbnail_page = page
      bookDataItem.thumbnail_access_path = newThumbnailAccessPath

      await fs.writeFile(bookDataFilePath, JSON.stringify(booksDataJson, null, 2))

      return {
        success: true,
        thumbnail_access_path: newThumbnailAccessPath,
        thumbnail_page: page,
      }
    } catch (error) {
      console.error(`Error updating book thumbnail page: ${error}`)
      return { success: false, error: `Failed to save new book: ${error}` }
    }
  })
}

