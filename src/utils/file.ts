import JSZIP from 'jszip'
import axios from 'axios'
import mime from 'mime'

export const downloadUrl = (url: string, name: string = 'image.png') => {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    a.remove()
}

const downloadBlob = (blob: Blob, name: string = 'image.png') => {
    const blobUrl = URL.createObjectURL(blob)
    downloadUrl(blobUrl, name)
}

export const blobToBase64 = (blob: Blob) =>
    new Promise<string>(res => {
        const reader = new FileReader()
        reader.onload = val => {
            res(val.target?.result as string)
        }
        reader.readAsDataURL(blob)
    })

export const packDownload = async (urls: string[]) => {
    axios
        .get(urls[0], {
            responseType: 'blob'
        })
        .then(res => console.log(res))

    const zip = new JSZIP()

    let i = 1
    for (const item of urls) {
        const fileBlob = (
            await axios.get(item, {
                responseType: 'blob'
            })
        ).data as Blob

        zip.file(`image${i++}.${mime.getExtension(fileBlob.type)}`, fileBlob)
    }

    const content = await zip.generateAsync({ type: 'blob' })
    
    downloadBlob(content, 'images.zip')
}
