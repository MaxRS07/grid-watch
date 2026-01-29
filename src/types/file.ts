export interface DownloadList {
    files: File[]
}

export interface File {
    id: string
    description: string
    status: string
    fileName: string
    fullURL: string
}