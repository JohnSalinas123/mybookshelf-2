// ipcHandlers for book operations

import { app, IpcMainInvokeEvent } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import pdf from 'pdf-parse'


import { BookData } from '../../types/BookData'
import { UUID } from 'crypto'
import { deleteBookFile, fetchAllBookData, saveBookFile, updateBooksData } from '../operations/bookOperations'
import { deleteThumbnailFile, generateBookThumbnail } from '../operations/thumbnailOperations'
import { fetchDeletedData, updateDeletedData } from '../operations/deletedOperations'
import { IpcResponse } from '../../types/IpcResponse'

const booksDirPath = path.join(app.getPath('userData'), 'books')
//const thumbnailDirPath = path.join(app.getPath('userData'), 'thumbnails')
const dataDirPath = path.join(app.getPath('userData'), 'data')
const bookDataFilePath = path.join(dataDirPath, 'books.json')
//const deletedBookDataFilePath = path.join(dataDirPath, 'deleted-books.json')


// handleGetBookdsData: handles getting books data
export const handleGetBooksData = async (): Promise<BookData[]> => {

    try {
      return await fetchAllBookData()
    } catch (error) {
      console.log('Error fetching books data:', error)
      throw new Error('Failed to fetch books data')
    }
}

// saveNewBook: save new book to library
export const handleSaveNewBook = async (_event: IpcMainInvokeEvent, filePath: string): Promise<IpcResponse<BookData>> => {
    try {

      // copy book to storage
      const {path: bookFilePath, uuid: bookUUID, ext: bookExt } = await saveBookFile(filePath)
      console.log("Saved book file to books dir")

      // TODO: generalize to work for other e-book file types, such as epub
      // extract number of pages
      const bookBuffer = await fs.readFile(bookFilePath)
      const pdfInfo = await pdf(bookBuffer)
      const numPages = pdfInfo.numpages

      // generate first-page thumbnail
      const thumbnailDefaultPage = 1
      const {uuid: thumbnailUUID, ext: thumbnailExt} = await generateBookThumbnail(bookFilePath, thumbnailDefaultPage)

      const booksDataJson: BookData[] = await fetchAllBookData()

      // thumbnail access path
      const thumbnailAccessPath = `app://thumbnails/${thumbnailUUID}.${thumbnailDefaultPage}.${thumbnailExt}`

      // file data to store
      const file_access_path = `app://books/${bookUUID}.${bookExt}`
      const originalBookTitle = path.basename(filePath)

      // uuid for book entry in book data file
      const bookEntryUUID = crypto.randomUUID()

      // initial timestamp for created_at, updated_at
      const timestamp = new Date().toISOString()

      const newBookObj: BookData = {
        id: bookEntryUUID,
        title: originalBookTitle,
        completed: false,
        file_id: bookUUID,
        file_ext: bookExt,
        file_access_path: file_access_path,
        total_pages: numPages,
        view_state: {
          cur_page: 1,
          zoom_level: 100,
          zoom_index: 7,
        },
        thumbnail_id: thumbnailUUID,
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
      // save updated book data
      await updateBooksData(booksDataJson)

      return {
        success: true,
        data: newBookObj
      }
    } catch (error) {
      console.error(`Error saving new book from ${filePath}: ${error}`)
      return { success: false, error: `Failed to save new book: ${error}` }
    }
}

// saveBookCurrentPage save book current page
export const handleSaveBookCurrentPage = async (_event: IpcMainInvokeEvent, uuid : UUID, currentPage : number): Promise<IpcResponse<void>> => {
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

      if (!bookSavedBool) {
        throw new Error(`Failed to update book data with new current page`)
      }

      await fs.writeFile(bookDataFilePath, JSON.stringify(booksDataJson, null, 2), 'utf-8')

      console.log(`Saved page ${currentPage} for book ${uuid}`)

      return {success: true, data: null}
    } catch (error) {
      console.log(`Error saving book current page for ${uuid}: ${error}`)
      return {success: false, error: `Failed to save book current page: ${error}`}
    }
}

// saveBookZoomAndIndex save book zoom and zoom index
export const handleSaveBookZoomAndIndex = async (_event: IpcMainInvokeEvent, uuid: UUID, pageZoom: number, pageZoomIndex: number): Promise<IpcResponse<void>> => {
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
      return {success: true, data: null}
    } catch (error) {
      console.log(`Error saving zoom level and zoom index for ${uuid}: ${error}`)
      return {success: false, error: `Failed to save zoom level and zoom index: ${error}`}
    }
}

// updateBookAsMostRecent update book as most recently interacted with
export const handleUpdateBookAsMostRecent = async (_event: IpcMainInvokeEvent, uuid: UUID): Promise<IpcResponse<void>> => {
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

      return {success: true, data: null}
    } catch (error) {
      console.log(`Error updating book as most recent ${uuid}: ${error}`)
      return {success: false, error: `Failed to update book as most recent: ${error}`}
    }
}

// handleDeleteBook delete book from library
// keep archive of deleted data just in case
export const handleDeleteBook = async (_event: IpcMainInvokeEvent, uuid: UUID): Promise<IpcResponse<void>> => {
    
    // read books data json, find book with matching uuid
    try {

      const booksData = await fetchAllBookData()

      const bookToDelete = booksData.find((book) => book.id === uuid)
      if (!bookToDelete) {
        throw new Error(`Book with UUID ${uuid} not found`)
      }

      // delete book file
      await deleteBookFile(bookToDelete.file_id, bookToDelete.file_ext)

      // delete book thumbnail
      await deleteThumbnailFile(bookToDelete.thumbnail_id, bookToDelete.thumbnail_page, bookToDelete.thumbnail_ext)

      // delete book from books json data
      const updatedBooksAfterDeletion = booksData.filter((book) => book.id !== uuid)

      await updateBooksData(updatedBooksAfterDeletion)

      console.log(`Deleted book from books.json ${uuid}`)


      // TODO: continue abstracting here

      //fetch deleted data
      const deletedData = await fetchDeletedData()

      deletedData.push({
        ...bookToDelete,
        deleted_at: new Date().toISOString()
      })

      await updateDeletedData(deletedData)
      console.log(`Added data to deleted_books.json ${uuid}`)

      return {
        success: true,
        data: null
      }
    } catch (error) {
      console.log(`Error deleting book ${uuid}: ${error}`)
      return { success: false, error: `Failed to delete book ${error}` }
    }
}

// bookSingleFieldUpdater save book current page
export const handleBookSingleFieldUpdater = async (_event: IpcMainInvokeEvent, uuid: UUID, field: string, value: string): Promise<IpcResponse<{updated_field: string, updated_value: string}>> => {
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
            throw new Error(`Missing field ${field} in single field updater`)
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

      if (!bookSavedBool) {
        throw new Error(`Failed to update field ${field} with ${value}`)
      }

      await fs.writeFile(bookDataFilePath, JSON.stringify(booksDataJson, null, 2), 'utf-8')

      console.log(`Updated ${field} with ${value} for book ${uuid}`)

      return {
        success: true,
        data : {
          updated_field: field,
          updated_value: value
        }
        
      }
    } catch (error) {
      console.log(`Error updating ${field} with ${value} for ${uuid}: ${error}`)
      return { success: false, error: `Failed to update ${field}: ${error}` }
    }
}

export const handleUpdateBookThumbnailPage = async (_event: IpcMainInvokeEvent, uuid: UUID, page: number): Promise<IpcResponse<{thumbnail_access_path: string, thumbnail_page: number}>> => {
    console.log(`attempting to update book thumbnail to page ${page}`)

    try {
      // TODO: improve error handling for reading book file
      
      const booksData = await fetchAllBookData()

      const bookDataItem = booksData.find(book => book.id === uuid);
      if (!bookDataItem) {
        throw new Error(`Book with UUID ${uuid} not found`)
      }


      const bookFileName = `${bookDataItem.file_id}.${bookDataItem.file_ext}`
      const bookFilePath = path.join(booksDirPath, bookFileName)
      

      // generate new thumbnail
      const {uuid: thumbnailUUID, ext: thumbnailExt} = await generateBookThumbnail(bookFilePath, page)

      // delete old thumbnail
      await deleteThumbnailFile(bookDataItem.thumbnail_id, bookDataItem.thumbnail_page, bookDataItem.thumbnail_ext)

      // update thumbnail_page and save books data back to file
      const newThumbnailAccessPath = `app://thumbnails/${thumbnailUUID}.${page}.${thumbnailExt}`
      bookDataItem.thumbnail_id = thumbnailUUID
      bookDataItem.thumbnail_page = page
      bookDataItem.thumbnail_access_path = newThumbnailAccessPath

      await updateBooksData(booksData)

      return {
        success: true,
        data: {
          thumbnail_access_path: newThumbnailAccessPath,
          thumbnail_page: page,
        }
        
      }
    } catch (error) {
      console.error(`Error updating book thumbnail page to ${page} for ${uuid}: ${error}`)
      return { success: false, error: `Failed to update book thumbnail page to ${page}: ${error}` }
    }
}

