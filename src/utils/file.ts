import JSZIP from 'jszip'
import axios from 'axios'

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

const blobToBase64 = (blob: Blob) => new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = val => {
        res(val.target?.result)
    }
    reader.readAsDataURL(blob)
})

export const packDownload = async (urls: string[]) => {
    axios.get(urls[0], {
        responseType: 'blob'
    }).then(res => console.log(res.headers['Content-Disposition']))

    // const zip = new JSZIP()

    // urls.forEach(item => zip.file(item))

    // zip.generateAsync({ type: 'blob' }).then(content => {
    //     downloadBlob(content, 'images.zip   ')
    // })
}