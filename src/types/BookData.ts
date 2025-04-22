import { UUID } from "crypto"

export interface BookData {
  id: UUID
  title: string | null
  file_path: string
  num_pages: number
  cur_page: number
  front_cover_page: number
  zoom_level: number
  zoom_index: number
  thumbnail_path: string
  created_at: string
  updated_at: string
}

export interface DeletedBookData extends BookData {
  deleted_at: string
}