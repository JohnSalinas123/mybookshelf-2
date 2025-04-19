import { UUID } from 'crypto'
import { app, ipcMain } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import pdf from 'pdf-parse'
import { fromPath } from 'pdf2pic'

const bookCopyDirPath = path.join(app.getPath('userData'), 'books')
const thumbnailDirPath = path.join(app.getPath('userData'), 'thumbnails')
const dataDirPath = path.join(app.getPath('userData'), 'data')
const bookDataFilePath = path.join(dataDirPath, 'books.json')

interface BookData {
  id: UUID
  title: string | null
  file_path: string
  num_pages: number
  cur_page: number
  front_cover_page: number
  zoom_level: number
  zoom_index: number
  thumbnail_path: string
}

export const getPdfBooksData = async (): Promise<void> => {
  // make directories and files for book data if they don't exist
  await fs.mkdir(bookCopyDirPath, { recursive: true }).catch(console.error)
  await fs.mkdir(thumbnailDirPath, { recursive: true }).catch(console.error)
  await fs.mkdir(dataDirPath, { recursive: true }).catch(console.error)

  try {
    await fs.access(bookDataFilePath)
  } catch {
    await fs.writeFile(bookDataFilePath, '[]', 'utf-8')
  }

  ipcMain.handle('fetch-pdf-books', async () => {
    try {
      let booksDataJson = []
      try {
        const booksData = await fs.readFile(bookDataFilePath, 'utf-8')
        booksDataJson = JSON.parse(booksData)
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT')
          throw error
      }

      return booksDataJson
    } catch (error) {
      console.log('Error fetching PDF books:', error)
      throw new Error('Failed to fetch PDF books data')
    }
  })
}

export const saveBook = async (): Promise<void> => {
  ipcMain.handle('save-pdf', async (event, filePath) => {
    try {
      const fileName = path.basename(filePath)
      const destination = path.join(bookCopyDirPath, fileName)

      // copy pdf to storage
      await fs.copyFile(filePath, destination)

      // read pdf as a buffer
      const pdfBuffer = await fs.readFile(destination)

      // extract number of pages
      const pdfInfo = await pdf(pdfBuffer)
      const numPages = pdfInfo.numpages

      // format filename for saving thumbnail
      const fileNameTrim = fileName.replace('.pdf', '')
      //console.log('Filename trimmed:', fileNameTrim)

      // generate first-page thumbnail
      const converter = fromPath(destination, {
        density: 150,
        saveFilename: `${fileNameTrim}`,
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
      const thumbnailURL = `app://thumbnails/${fileNameTrim}.1.png`

      // uuid for pdf in metadata file
      const pdfUUID = crypto.randomUUID()

      // add new book info to metadata
      booksDataJson.push({
        id: pdfUUID,
        title: fileName.replace('.pdf', ''),
        file_path: destination,
        num_pages: numPages,
        cur_page: 0,
        front_cover_page: thumbnailDefaultPage,
        zoom_level: 100,
        zoom_index: 7,
        thumbnail_path: thumbnailURL
      })

      // TODO: test efficiency of loading entire metadata every time a book is added
      // -> find better way to appending to existing metadata
      // save updated metadata
      await fs.writeFile(bookDataFilePath, JSON.stringify(booksDataJson, null, 2))

      return {
        success: true,
        book_data: {
          title: fileName.replace('.pdf', ''),
          file_path: destination,
          num_pages: numPages,
          cur_page: 0,
          front_cover_page: thumbnailDefaultPage,
          zoom_level: 100,
          zoom_index: 7,
          thumbnail_path: thumbnailURL
        }
      }

    } catch (error) {
      console.error('Error saving PDF:', error)
      return { success: false, error: 'Failed to save PDF.'}
    }
  })
}

export const savePdfPage = async (): Promise<void> => {
  ipcMain.handle('save-pdf-page', async (_event, uuid, currentPage) => {
    let booksDataJson: BookData[] = []

    try {
      try {
        const data = await fs.readFile(bookDataFilePath, 'utf-8')
        booksDataJson = JSON.parse(data)
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT')
          throw error
      }

      let bookSavedBool = false

      // update metadata.json with new currentPage for book with specific UUID arg
      for (const bookMetaData of booksDataJson) {
        if (bookMetaData.id === uuid) {
          bookMetaData.cur_page = currentPage
          bookSavedBool = true
          break
        }
      }

      if (!bookSavedBool) return false

      await fs.writeFile(bookDataFilePath, JSON.stringify(booksDataJson, null, 2), 'utf-8')

      console.log(`Saved page ${currentPage} for book ${uuid}`)

      return true
    } catch (error) {
      console.log('Error saving pdf page', error)
      return false
    }
  })
}

export const savePdfZoomAndIndex = async (): Promise<void> => {
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
      console.log("Error updating pdf's zoom level and zoom index")
    }
  })
}

export const updatePdfBookAsMostRecent = async (): Promise<void> => {
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

        const pdfBookItemRemoved = booksDataJson.splice(i, 1)[0]
        if (pdfBookItemRemoved) {
          booksDataJson = [pdfBookItemRemoved, ...booksDataJson]
        }
        break
      }

      // save the update book metadata back to the file
      await fs.writeFile(bookDataFilePath, JSON.stringify(booksDataJson, null, 2), 'utf-8')
    } catch (error) {
      console.log('Error updating pdf to be most recently opened', error)
    }
  })
}
