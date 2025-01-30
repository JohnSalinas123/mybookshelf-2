import { useParams} from 'react-router-dom'
import { Document, Page } from 'react-pdf'

export const Reader = () => {

    const { pdfPath } = useParams();

    return (
        <>
            
            <Document file={pdfPath}  onLoadError={(error) => console.error('PDF load error:', error)}>
                <Page height={200} pageNumber={1}></Page>
            </Document>
            
        </>
    )

}