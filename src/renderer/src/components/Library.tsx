import { useState, useEffect } from 'react'
import { pdfjs } from 'react-pdf'
import { IoIosAddCircleOutline } from 'react-icons/io'
import { LibraryItem } from './LibraryItem'
//import pdfWorker from 'pdfjs-dist/build/pdf.worker.js?worker'

import './Library.css'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface PDFFileData {
  title: string | null
  path: string
  pageCount: number
}

type IpcRendererEvent = {
  sender: Electron.IpcRenderer
  returnValue?: unknown
}

export const Library: React.FC = () => {
  const [pdfFilesData, setPdfFilesData] = useState<PDFFileData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.electron.ipcRenderer.send('fetch-pdf-file')

    window.electron.ipcRenderer.on(
      'pdf-data',
      (_event: IpcRendererEvent, pdfFileDataObjs: PDFFileData[]) => {
        setPdfFilesData(pdfFileDataObjs)
        setLoading(false)
      }
    )

    /*
        const watcher = watch(directory, (eventType, filename) => {
            if (filename && filename.endsWith('.pdf')) {
                // File change detected, re-fetch the list of PDF files
                const updatedFiles = readdirSync(directory)
                    .filter(fileName => fileName.endsWith('.pdf'))
                setPdfFiles(updatedFiles);
            }
        });
        */
  }, [])

  return (
    <>
      {loading ? (
        <div className="loading-container">
          <div>Loading...</div>
        </div>
      ) : (
        <div className="library-container">
          <LibrayAddItem />
          {pdfFilesData &&
            pdfFilesData.map((file, index) => (
              <LibraryItem key={index} pdfPath={file.path} pdfTitle={file.title} />
            ))}
        </div>
      )}
    </>
  )
}

const LibrayAddItem: React.FC = () => {
  return (
    <>
      <div className="library-item-outer">
        <div className="library-item-image-add">
          <IoIosAddCircleOutline />
        </div>
      </div>
    </>
  )
}
