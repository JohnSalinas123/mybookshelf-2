import { execFile } from "child_process";
import { app } from "electron";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// gmConvert calls graphicsmagick functionality to resize and trim
// only operates in apps thumbnail/ directory
// inputThumbnailName: the name of the input thumbnail file
// outputThumbnailName: the name of the output thumbnail file
export async function gmConvert(inputThumbnailName: string, outputThumbnailName: string): Promise<void> {
  const thumbnailDirPath = path.join(app.getPath('userData'), 'thumbnails')
  const safeInputPath = path.resolve(thumbnailDirPath, inputThumbnailName)
  const safeOutputPath = path.resolve(thumbnailDirPath, outputThumbnailName)

  await execFileAsync('gm', ['convert', safeInputPath, '-trim', safeOutputPath]);

}