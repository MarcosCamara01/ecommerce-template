export async function BlurDataUrl(url) {
  const base64str = await fetch(`https://res.cloudinary.com/dckjqf2cq/image/upload/f_auto,c_limit,w_16,q_auto${url}`)
    .then(async (res) =>
      Buffer.from(await res.arrayBuffer()).toString('base64')
    )

  const blurSvg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 5'>
      <filter id='b' color-interpolation-filters='sRGB'>
        <feGaussianBlur stdDeviation='1'/>
      </filter>

      <image preserveAspectRatio='none' filter='url(#b)' x='0' y='0' height='100%' width='100%' 
      href='data:image/webp;base64,${base64str}'
      /> 
    </svg>
  `
  const toBase64 = (str) =>
    typeof window === 'undefined'
      ? Buffer.from(str).toString('base64')
      : window.btoa(str)

  return `data:image/svg+xml;base64,${toBase64(blurSvg)}`
}