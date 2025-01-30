import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { PDFDocument } from 'pdf-lib'

export const getPdfFilesData = (): void => {
  console.log('IPC Handler Initialized')

  ipcMain.on('fetch-pdf-file', async (event) => {
    const directory = 'C:/Users/salin/Desktop/books/'

    try {
      const files = fs.readdirSync(directory)
      console.log(files)

      const pdfFilePaths = files
        .filter((fileName) => fileName.endsWith('.pdf'))
        .map((fileName) => path.join(directory, fileName))

      const fileDataObjects: Array<{ title: string | null; path: string; pageCount: number }> = []

      for (const pdfFilePath of pdfFilePaths) {
        try {
          const arrayBuffer = await fs.promises.readFile(pdfFilePath)
          const pdf = await PDFDocument.load(arrayBuffer)
          const pageCount = pdf.getPageCount()
          const title = pdf.getTitle()

          const newFileDataObj = {
            title: title ?? 'Unknown Title',
            path: pdfFilePath,
            pageCount: pageCount
          }

          console.log(newFileDataObj)
          fileDataObjects.push(newFileDataObj)
        } catch (error) {
          console.error('Error accessing PDF data', error)
        }
      }

      event.reply('pdf-data', fileDataObjects)
    } catch (error) {
      console.log('Error fetching PDF files', error)
      event.reply('pdf-paths-error')
    }
  })
}
