import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'

const booksDirPath = path.join(app.getPath('userData'), 'books')
const thumbnailDirPath = path.join(app.getPath('userData'), 'thumbnails')
const dataDirPath = path.join(app.getPath('userData'), 'data')
const bookDataFilePath = path.join(dataDirPath, 'books.json')
const deletedBookDataFilePath = path.join(dataDirPath, 'deleted-books.json')

export async function setupAppStorage(): Promise<void> {
    // make directories and files for app data if they don't exist

    try {
        await fs.mkdir(booksDirPath, { recursive: true })
        await fs.mkdir(thumbnailDirPath, { recursive: true })
        await fs.mkdir(dataDirPath, { recursive: true })

        try {
            await fs.access(bookDataFilePath)
        } catch {
            await fs.writeFile(bookDataFilePath, '[]', 'utf-8')
        }

        try {
            await fs.access(deletedBookDataFilePath)
        } catch {
            await fs.writeFile(deletedBookDataFilePath, '[]', 'utf-8')
        }

    } catch (err) {
        throw new Error(`Failed to initialize app storage files/dirs: ${err}`)
    }
}