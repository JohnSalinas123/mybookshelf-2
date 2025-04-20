import { BookData } from "./BookData";


export interface SaveBookDataResponse {
    success: boolean,
    book_data: BookData,
    error?: string
} 