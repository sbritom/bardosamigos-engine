import { Download, ImageUp, Link, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import './resizeTool.css'

const PRESETS = [
  ['Avatar', 512, 512], ['Full HD', 1920, 1080], ['Banner interno', 728, 486],
  ['Xatspace', 1110, 275], ['Instagram post', 1080, 1080], ['Story', 1080, 1920],
]

export default function ResizeTool() {
  const [source, setSource] = useState(null)
  const [preview, setPreview] = useState('')
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [original, setOriginal] = useState({ width: 0, height: 0 })
  const [locked, setLocked] = useState(true)
  const [format, setFormat] = useState('image/png')
  const inputRef = useRef(null)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const loadFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      if (preview) URL.revokeObjectURL(preview)
      setSource(file); setPreview(url); setWidth(image.naturalWidth); setHeight(image.naturalHeight)
      setOriginal({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.src = url
  }

  const changeWidth = (value) => {
    const next = Math.max(1, Number(value) || 1); setWidth(next)
    if (locked && original.width) setHeight(Math.max(1, Math.round(next * original.height / original.width)))
  }
  const changeHeight = (value) => {
    const next = Math.max(1, Number(value) || 1); setHeight(next)
    if (locked && original.height) setWidth(Math.max(1, Math.round(next * original.width / original.height)))
  }
  const applyPreset = (_, w, h) => { setWidth(w); setHeight(h); setLocked(false) }
  const reset = () => { setWidth(original.width); setHeight(original.height); setLocked(true) }

  const download = () => {
    if (!source) return
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
      const context = canvas.getContext('2d'); context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high'
      context.drawImage(image, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob); const anchor = document.createElement('a')
        const extension = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png'
        anchor.href = url; anchor.download = `barstudio-${width}x${height}.${extension}`; anchor.click(); URL.revokeObjectURL(url)
      }, format, .94)
    }
    image.src = preview
  }

  if (!source) return <div className="bds-resize-tool bds-resize-tool--empty"><button className="bds-resize-tool__drop" type="button" onClick={() => inputRef.current?.click()} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault();loadFile(e.dataTransfer.files?.[0])}}><ImageUp size={34}/><strong>Envie uma imagem</strong><span>Clique ou arraste PNG, JPG ou WEBP para redimensionar.</span></button><input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e)=>loadFile(e.target.files?.[0])}/></div>

  return <div className="bds-resize-tool"><div className="bds-resize-tool__workspace">
    <aside className="bds-resize-tool__controls">
      <div className="bds-resize-tool__group"><label>Dimensões</label><div className="bds-resize-tool__dimensions"><div><span>Largura</span><input type="number" min="1" value={width} onChange={(e)=>changeWidth(e.target.value)}/></div><button className={locked?'is-active':''} type="button" onClick={()=>setLocked(!locked)} title="Manter proporção"><Link size={16}/></button><div><span>Altura</span><input type="number" min="1" value={height} onChange={(e)=>changeHeight(e.target.value)}/></div></div></div>
      <div className="bds-resize-tool__group"><label>Tamanhos rápidos</label><div className="bds-resize-tool__presets">{PRESETS.map((preset)=><button key={preset[0]} onClick={()=>applyPreset(...preset)}><strong>{preset[0]}</strong><span>{preset[1]} × {preset[2]}</span></button>)}</div></div>
      <div className="bds-resize-tool__group"><label>Formato de saída</label><select value={format} onChange={(e)=>setFormat(e.target.value)}><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WEBP</option></select></div>
      <button className="bds-button" onClick={reset}><RotateCcw size={16}/> Restaurar original</button><button className="bds-button" onClick={()=>inputRef.current?.click()}>Trocar imagem</button><input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e)=>loadFile(e.target.files?.[0])}/>
    </aside>
    <section className="bds-resize-tool__preview"><div className="bds-resize-tool__stage"><img src={preview} alt="Prévia da imagem"/></div><div className="bds-resize-tool__meta"><span>Original: {original.width} × {original.height}px</span><strong>Saída: {width} × {height}px</strong></div><button className="bds-button bds-button--primary bds-resize-tool__download" onClick={download}><Download size={17}/> Baixar imagem redimensionada</button></section>
  </div></div>
}
