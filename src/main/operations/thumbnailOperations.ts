import { randomUUID } from "crypto"
import { gmConvert } from "../ utility/gmagic"
import path from "path"
import { fromPath } from "pdf2pic"
import fs from 'fs/promises'
import { app } from "electron"

const thumbnailDirPath = path.join(app.getPath('userData'), 'thumbnails')

// generateBookThumbnail generetes book thumbnail
// generates a new thumbnail using filePath of book file
export async function generateBookThumbnail(filePath: string, page: number): Promise<{ path: string, uuid: string, ext: string }> {

    const uuid = randomUUID()
    const ext = 'png' // default of creating a thumbnail as png
    const thumbnailFileName = `${uuid}.${page}.${ext}`
    const targetPath = path.join(thumbnailDirPath, thumbnailFileName)


    // generate pdf2pic thumbnail
    const tempThumbnailUUID = randomUUID()
    const converter = fromPath(filePath, {
        density: 150,
        saveFilename: tempThumbnailUUID,
        savePath: thumbnailDirPath,
        format: ext,
        width: 400
    })

    try {
        await converter(page, { responseType: 'image' })
    } catch (err) {
        throw new Error(`Pdf2pic converter failed to generate temp thumbnail: ${err}`)
    }

    const tempThumbnailName = `${tempThumbnailUUID}.${page}.${ext}`
    try {
        await gmConvert(tempThumbnailName, thumbnailFileName)
    } catch (err) {
        throw new Error(`GM post processing failed: ${err}`)
    }

    // delete temp thumbnail
    const thumbanailTempFilePath = path.join(thumbnailDirPath, tempThumbnailName)
    try {
        await fs.unlink(thumbanailTempFilePath)
    } catch (err) {
        throw new Error(`Failed to delete book temp thumbnail: ${err}`)
    }

    return { path: targetPath, uuid, ext }

}

// deleteThumbnail deletes thumbnail at path
export async function deleteThumbnailFile(uuid: string,page: number, ext : string): Promise<void> {

    const thumbnailFileName = `${uuid}.${page}.${ext}`
    const thumbnailFilePath = path.join(thumbnailDirPath, thumbnailFileName)

    try {
        await fs.unlink(thumbnailFilePath)
    } catch (err) {
        throw new Error(`Failed to delete book thumbnail at ${thumbnailFilePath}: ${err}`)
    }

}