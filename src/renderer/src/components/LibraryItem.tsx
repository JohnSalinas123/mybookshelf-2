import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Document, Page } from 'react-pdf'
import './Library.css'

interface LibraryItemProps {
  pdfPath: string
  pdfTitle: string | null
}

export const LibraryItem: React.FC<LibraryItemProps> = ({ pdfPath, pdfTitle }) => {
  const [, setLoading] = useState(true)
  const navigate = useNavigate()

  console.log(pdfPath)

  const handleClick = (): void => {
    const encodedPath = encodeURIComponent(pdfPath)
    console.log(`Navigating to /reader/${encodedPath}`)
    navigate(`/reader/${encodedPath}`)
  }

  const handleDocumentLoad = (): void => {
    setLoading(false)
  }

  return (
    <>
      <div className="library-item-outer" onClick={handleClick}>
        <div className="library-item-inner">
          <div className="library-item-image">
            <Document
              file={pdfPath}
              onLoad={handleDocumentLoad}
              onLoadError={(error) => console.error('PDF load error:', error)}
            >
              <Page pageNumber={1} width={200} />
            </Document>
          </div>
          <div className="library-item-details">
            <span className="library-item-title">
              {typeof pdfTitle !== 'undefined' ? pdfTitle : 'No title found'}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
