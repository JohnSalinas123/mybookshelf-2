import path from "path"
import { BookData } from "../../types/BookData"
import fs from 'fs/promises'
import { app } from "electron"
import { randomUUID } from "crypto"

const dataDirPath = path.join(app.getPath('userData'), 'data')
const booksDirPath = path.join(app.getPath('userData'), 'books')
const booksDataFilePath = path.join(dataDirPath, 'books.json')

export async function saveBookFile(filePath): Promise<{ path: string, uuid: string, ext: string }> {
    try {
        const uuid = randomUUID()
        const ext = path.extname(filePath).toLowerCase().slice(1)
        const fileName = `${uuid}.${ext}`
        const targetPath = path.join(booksDirPath, fileName)

        // get original title of book


        await fs.copyFile(filePath, targetPath)
        return { path: targetPath, uuid, ext }
    } catch (err) {
        throw new Error(`Failed to copy book file to books dir: ${err}`)
    }
}

// updateBooksData safely updates books data file
// validates incoming data before updating
export async function updateBooksData(newBooksData: BookData[]): Promise<void> {
    try {
        await fs.writeFile(booksDataFilePath, JSON.stringify(newBooksData, null, 2))
    } catch (err) {
        throw new Error(`Failed to update books data: ${err}`)
    }
}



// getBookData gets a single books data
export async function fetchBookData(uuid: string): Promise<BookData> {
    let tempBooksData: BookData[] = []
    let bookDataItem: BookData | undefined

    try {
        const booksData = await fs.readFile(booksDataFilePath, 'utf-8')
        tempBooksData = JSON.parse(booksData)
    } catch (err) {
        if (err && typeof err === 'object' && 'code' in err) {
            if (err.code === 'ENOENT') {
                throw new Error(`Books data not found: ${err}`)
            } else {
                throw new Error(`Failed to get book data ${err}`)
            }
        }
        
    }

    const foundBookData: BookData | undefined = tempBooksData.find((item) => item.id === uuid)
    if (!foundBookData) {
        throw new Error(`No book found with uuid: ${uuid}`)
    }
    bookDataItem = foundBookData

    return bookDataItem
}

// getAllBookData gets all book data
// returns BookData[]
export async function fetchAllBookData(): Promise<BookData[]> {
    let booksDataJson: BookData[] = []
    
    try {
        const booksData = await fs.readFile(booksDataFilePath, 'utf-8')
        booksDataJson = JSON.parse(booksData)
    } catch (err) {
        if (err && typeof err === 'object' && 'code' in err) {
            if (err.code === 'ENOENT') {
                throw new Error(`Books data not found: ${err}`)
            } else {
                throw new Error(`Failed to get all book data ${err}`)
            }
        }
    }

    return booksDataJson
}

export async function deleteBookFile(uuid: string, ext: string): Promise<void> {

    const bookFileName = `${uuid}.${ext}`
    const bookFilePath = path.join(booksDirPath, bookFileName)

    try {
        await fs.unlink(bookFilePath)
    } catch(err) {
        throw new Error(`Failed to delete book file: ${err}`)
    }

}