import { execFile } from "child_process";


export function gmConvert(inputPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    execFile('gm', ['convert', inputPath, '-trim', outputPath], (error, stderr) => {
      if (error) {
        console.error('stderr:', stderr);
        return reject(error);
      }
      console.log('Saved new thumbnail');
      resolve();
    });
  });
}