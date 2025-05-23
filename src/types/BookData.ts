import { UUID } from "crypto"

export interface BookData {
  id: UUID
  title: string | null
  completed: boolean
  file_id: string
  file_ext: string
  file_access_path: string
  total_pages: number
  view_state: {
    cur_page: number
    zoom_level: number
    zoom_index: number
  }
  thumbnail_id: string
  thumbnail_ext: string
  thumbnail_page: number
  thumbnail_access_path: string
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