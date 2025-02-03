import { app, ipcMain } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import pdf from 'pdf-parse'
import { fromPath } from 'pdf2pic'

const pdfStoragePath = path.join(app.getPath('userData'), 'books')
const thumbnailStoragePath = path.join(app.getPath('userData'), 'thumbnails')
const metadataFilePath = path.join(app.getPath('userData'), 'metadata.json')

export const getPdfBooksData = async (): Promise<void> => {
  const pdfStoragePath = path.join(app.getPath('userData'), 'books')

  // make directory for books, moves on if already exists
  await fs.mkdir(pdfStoragePath, { recursive: true }).catch(console.error)
  await fs.mkdir(thumbnailStoragePath, { recursive: true }).catch(console.error)

  ipcMain.handle('fetch-pdf-books', async () => {
    try {
      let pdfBookMetaData = []
      try {
        const data = await fs.readFile(metadataFilePath, 'utf-8')
        pdfBookMetaData = JSON.parse(data)
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT')
          throw error
      }

      return pdfBookMetaData
    } catch (error) {
      console.log('Error fetching PDF books:', error)
      throw new Error('Failed to fetch PDF books data')
    }
  })
}

export const savePdfBook = async (): Promise<void> => {
  ipcMain.on('save-pdf', async (event, filePath) => {
    try {
      const fileName = path.basename(filePath)
      const destination = path.join(pdfStoragePath, fileName)
      //const thumbnailPath = path.join(thumbnailStoragePath, `${fileName}.jpg`)

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
        savePath: thumbnailStoragePath,
        format: 'png',
        width: 300
      })
      const pageToConvertAsImage = 1

      try {
        await converter(pageToConvertAsImage, { responseType: 'image' })
      } catch (err) {
        console.error('Error generating thumbnail:', err)
      }

      interface bookMetadata {
        title: string
        file_path: string
        num_pages: number
        cur_page: number
        thumbnail_path: string
      }

      let metadata: bookMetadata[] = []
      try {
        const metadataJson = await fs.readFile(metadataFilePath, 'utf-8')
        metadata = JSON.parse(metadataJson)
      } catch (err) {
        console.log('Metadata file not found, creating a new one')
      }

      // thumbnail url
      const thumbnailURL = `app://thumbnails/${fileNameTrim}.1.png`

      // add new book info to metadata
      metadata.push({
        title: fileName.replace('.pdf', ''),
        file_path: destination,
        num_pages: numPages,
        cur_page: 0,
        thumbnail_path: thumbnailURL
      })

      // TODO: test efficiency of loading entire metadata every time a book is added
      // -> find better way to appending to existing metadata
      // save updated metadata
      await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2))

      event.sender.send('pdf-added', {
        title: fileName.replace('.pdf', ''),
        file_path: destination,
        num_pages: numPages,
        cur_page: 0,
        thumbnail_path: thumbnailURL
      })
    } catch (error) {
      console.log('Error saving PDF:', error)
      event.sender.send('pdf-error', 'Failed to save PDF.')
    }
  })
}
