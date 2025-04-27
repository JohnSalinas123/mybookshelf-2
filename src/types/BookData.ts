import { UUID } from "crypto"

export interface BookData {
  id: UUID
  title: string | null
  file_name: string,
  file_name_complete: string,
  file_path: string
  num_pages: number
  cur_page: number
  thumbnail_page: number
  zoom_level: number
  zoom_index: number
  thumbnail_path: string
  created_at: string
  updated_at: string
}

export interface DeletedBookData extends BookData {
  deleted_at: string
}

export interface UpdatedThumbnailPageResponse {
  success: boolean
  thumbnail_page: number
}