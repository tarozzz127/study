export async function preparePhoto(file) {
  if (file.size > 20 * 1024 * 1024) throw new Error('20MB以下の写真を選んでください。')
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) throw new Error('JPEG・PNG・WebPの写真を選んでください。')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode().catch(() => { throw new Error('この写真を開けませんでした。JPEGやPNGに変換してから選んでください。') })
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)
    const context = canvas.getContext('2d')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    URL.revokeObjectURL(url)
  }
}
