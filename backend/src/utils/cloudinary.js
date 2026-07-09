import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'


dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})
console.log('[Cloudinary] Configured — cloud_name:', process.env.CLOUDINARY_CLOUD_NAME || '⚠️  MISSING')

const isBase64DataUrl = (str) =>
  typeof str === 'string' && /^data:[a-z]+\/[a-z0-9.+-]+;base64,/i.test(str)

export const uploadToCloudinary = (fileData, folder = 'careermap/general') => {

  if (!fileData) return Promise.resolve(fileData)
  if (!isBase64DataUrl(fileData)) return Promise.resolve(fileData)

  return new Promise((resolve, reject) => {
    const raw = fileData.replace(/^data:[a-z]+\/[a-z0-9.+-]+;base64,/i, '')
    let buffer
    try {
      buffer = Buffer.from(raw, 'base64')
    } catch (e) {
      return reject(new Error(`Cloudinary upload failed: could not parse base64 — ${e.message}`))
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (err, result) => {
        if (err) {
          const msg = (err && (err.message || err.error?.message || JSON.stringify(err))) || 'Unknown error'
          console.error(`[Cloudinary] Upload error in "${folder}":`, msg)
          return reject(new Error(`Cloudinary upload failed: ${msg}`))
        }
        if (!result || !result.secure_url) {
          return reject(new Error('Cloudinary upload failed: no secure_url in response'))
        }
        console.log(`[Cloudinary] Uploaded → ${result.secure_url}`)
        resolve(result.secure_url)
      }
    )

    stream.on('error', (streamErr) => {
      const msg = streamErr?.message || String(streamErr) || 'Stream error'
      console.error(`[Cloudinary] Stream error in "${folder}":`, msg)
      reject(new Error(`Cloudinary upload failed: ${msg}`))
    })

    stream.end(buffer)
  })
}

export const uploadArrayToCloudinary = (filesArray, folder = 'careermap/general') => {
  if (!Array.isArray(filesArray) || filesArray.length === 0) return Promise.resolve(filesArray || [])
  return Promise.all(filesArray.map((f) => uploadToCloudinary(f, folder)))
}

export default cloudinary
