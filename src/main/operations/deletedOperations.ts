import { app } from "electron"
import { DeletedBookData } from "../../types/BookData"
import path from "path"
import fs from 'fs/promises'

const dataDirPath = path.join(app.getPath('userData'), 'data')
const deletedBookDataFilePath = path.join(dataDirPath, 'deleted-books.json')

export async function fetchDeletedData(): Promise<DeletedBookData[]> {

    let deletedBooksDataJson: DeletedBookData[] = []

    try {
        const deletedBooksData = await fs.readFile(deletedBookDataFilePath, 'utf-8')
        deletedBooksDataJson = JSON.parse(deletedBooksData)
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT')
            throw error
    }

    return deletedBooksDataJson

}

export async function updateDeletedData(newDeletedData: DeletedBookData[]): Promise<void> {

    try {
        await fs.writeFile(
            deletedBookDataFilePath,
            JSON.stringify(newDeletedData, null, 2),
            'utf-8'
        )
    } catch (err) {
        throw new Error(`Failed to update deleted data: ${err}`)
    }

}