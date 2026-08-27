import { Copy, Lock, RefreshCw, Search, Shuffle, Unlock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { hexToRgb, hslToHex, normalizeHex, rgbToHsl } from '../../../image-tools/imageToolUtils'
import './palettesTool.css'

const HARMONIES = [
  { id: 'analogous', label: 'Análoga' }, { id: 'complementary', label: 'Complementar' },
  { id: 'monochromatic', label: 'Monocromática' }, { id: 'triadic', label: 'Tríade' }, { id: 'tetradic', label: 'Tetrádica' },
]

const COLOR_LIBRARY = {
  Azuis: [['Azul Marinho','#001F3F'],['Azul Petróleo','#003B46'],['Azul Royal','#4169E1'],['Azul Dodger','#1E90FF'],['Azul Céu','#87CEEB'],['Azul Aço','#4682B4'],['Azul Ardósia','#6A5ACD'],['Azul Meia-noite','#191970']],
  Verdes: [['Verde Floresta','#228B22'],['Verde Esmeralda','#50C878'],['Verde Lima','#32CD32'],['Verde Oliva','#808000'],['Verde Mar','#2E8B57'],['Verde Menta','#98FF98'],['Verde Teal','#008080'],['Verde Primavera','#00FF7F']],
  Vermelhos: [['Vermelho Escuro','#8B0000'],['Carmesim','#DC143C'],['Vermelho','#FF0000'],['Tomate','#FF6347'],['Coral','#FF7F50'],['Salmão','#FA8072'],['Bordô','#800020'],['Vinho','#722F37']],
  Roxos: [['Índigo','#4B0082'],['Roxo','#800080'],['Violeta','#8A2BE2'],['Orquídea','#DA70D6'],['Ametista','#9966CC'],['Lavanda','#B57EDC'],['Magenta','#FF00FF'],['Ameixa','#8E4585']],
  Rosas: [['Rosa Choque','#FF1493'],['Rosa Forte','#FF69B4'],['Rosa Claro','#FFB6C1'],['Rosa Pastel','#FFD1DC'],['Framboesa','#E30B5C'],['Fúcsia','#FF00FF'],['Rosa Antigo','#C08081'],['Blush','#DE5D83']],
  Laranjas: [['Laranja','#FFA500'],['Laranja Escuro','#FF8C00'],['Tangerina','#F28500'],['Âmbar','#FFBF00'],['Pêssego','#FFCBA4'],['Abóbora','#FF7518'],['Ferrugem','#B7410E'],['Damasco','#FBCEB1']],
  Amarelos: [['Amarelo','#FFD700'],['Amarelo Limão','#FFF44F'],['Mostarda','#FFDB58'],['Canário','#FFFF99'],['Dourado','#D4AF37'],['Creme','#FFFDD0'],['Palha','#E4D96F'],['Açafrão','#F4C430']],
  Marrons: [['Marrom','#8B4513'],['Chocolate','#7B3F00'],['Café','#6F4E37'],['Caramelo','#C68E17'],['Canela','#D2691E'],['Castanho','#954535'],['Bege','#D2B48C'],['Sépia','#704214']],
  Neutros: [['Preto','#000000'],['Carvão','#36454F'],['Grafite','#41424C'],['Cinza','#808080'],['Prata','#C0C0C0'],['Gelo','#F1F5F9'],['Marfim','#FFFFF0'],['Branco','#FFFFFF']],
}

const wrapHue = (value) => ((value % 360) + 360) % 360
function buildOffsets(type, count) {
  const presets = { analogous: [-60,-30,0,30,60,90,120,150], complementary: [0,180,20,200,-20,160,40,220], triadic: [0,120,240,30,150,270,60,180], tetradic: [0,90,180,270,30,120,210,300] }
  return (presets[type] || presets.analogous).slice(0, count)
}
function generatePalette(base, type, count) {
  const hsl = rgbToHsl(hexToRgb(base))
  if (type === 'monochromatic') return Array.from({ length: count }, (_, index) => hslToHex(hsl.h, Math.max(18, Math.min(100, hsl.s + (index % 2 ? -8 : 5))), Math.round(18 + (count === 1 ? .5 : index/(count-1))*68)))
  return buildOffsets(type,count).map((offset,index) => hslToHex(wrapHue(hsl.h+offset),Math.max(28,hsl.s),Math.max(18,Math.min(82,hsl.l+((index%3)-1)*7))))
}
const randomHex = () => `#${Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0').toUpperCase()}`
function colorDetails(hex) { const rgb=hexToRgb(hex); const hsl=rgbToHsl(rgb); return { rgb:`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, hsl:`hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)` } }
async function copyText(value,setFeedback){try{await navigator.clipboard.writeText(value);setFeedback('Copiado!')}catch{setFeedback('Não foi possível copiar automaticamente.')}window.setTimeout(()=>setFeedback(''),1400)}

export default function PalettesTool(){
  const [mode,setMode]=useState('create'); const [baseColor,setBaseColor]=useState('#056CF2'); const [harmony,setHarmony]=useState('analogous'); const [count,setCount]=useState(5); const [locked,setLocked]=useState({}); const [overrides,setOverrides]=useState({}); const [feedback,setFeedback]=useState(''); const [family,setFamily]=useState('Azuis'); const [search,setSearch]=useState('')
  const generated=useMemo(()=>generatePalette(baseColor,harmony,count),[baseColor,harmony,count]); const colors=generated.map((color,index)=>overrides[index]||color)
  const regenerate=()=>{const nextBase=randomHex();setBaseColor(nextBase);const fresh=generatePalette(nextBase,harmony,count);const next={};colors.forEach((color,index)=>{next[index]=locked[index]?color:fresh[index]});setOverrides(next)}
  const changeBase=(value)=>{const normalized=normalizeHex(value);if(!normalized)return;setBaseColor(normalized);setOverrides((current)=>Object.fromEntries(Object.entries(current).filter(([index])=>locked[index])))}
  const cssVariables=colors.map((color,index)=>`--palette-${index+1}: ${color};`).join('\n')
  const libraryColors=useMemo(()=>{const q=search.trim().toLowerCase();const entries=family==='Todas'?Object.values(COLOR_LIBRARY).flat():COLOR_LIBRARY[family];return q?entries.filter(([name,hex])=>name.toLowerCase().includes(q)||hex.toLowerCase().includes(q)):entries},[family,search])
  const useColor=(hex)=>{setBaseColor(hex);setOverrides({});setMode('create')}

  return <div className="bds-palettes-tool">
    {feedback&&<div className="bds-palettes-tool__feedback" role="status">{feedback}</div>}
    <div className="bds-palettes-tool__tabs"><button className={mode==='create'?'is-active':''} onClick={()=>setMode('create')}>Criar Paleta</button><button className={mode==='explore'?'is-active':''} onClick={()=>setMode('explore')}>Explorar Cores</button></div>
    {mode==='create'?<div className="bds-palettes-tool__workspace">
      <aside className="bds-palettes-tool__controls">
        <div className="bds-palettes-tool__control"><label htmlFor="palette-base">Cor-base</label><div className="bds-palettes-tool__base"><input type="color" value={baseColor} onChange={(e)=>changeBase(e.target.value)}/><input id="palette-base" value={baseColor} onChange={(e)=>changeBase(e.target.value)} maxLength={7}/></div></div>
        <div className="bds-palettes-tool__control"><label>Harmonia</label><select value={harmony} onChange={(e)=>{setHarmony(e.target.value);setOverrides({})}}>{HARMONIES.map((item)=><option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
        <div className="bds-palettes-tool__control"><label>Quantidade</label><select value={count} onChange={(e)=>{setCount(Number(e.target.value));setLocked({});setOverrides({})}}>{[3,4,5,6,7,8].map((value)=><option key={value}>{value}</option>)}</select></div>
        <button className="bds-button bds-button--primary" onClick={regenerate}><Shuffle size={16}/> Aleatorizar</button><button className="bds-button" onClick={()=>setOverrides({})}><RefreshCw size={16}/> Gerar da cor-base</button><p className="bds-palettes-tool__hint">Trave as cores que deseja manter antes de aleatorizar.</p>
      </aside>
      <section className="bds-palettes-tool__result"><div className="bds-palettes-tool__strip">{colors.map((color,index)=><article className="bds-palettes-tool__color" key={`${index}-${color}`} style={{background:color}}><button className="bds-palettes-tool__lock" onClick={()=>setLocked((current)=>({...current,[index]:!current[index]}))}>{locked[index]?<Lock size={16}/>:<Unlock size={16}/>}</button><div className="bds-palettes-tool__color-info"><strong>{color}</strong><button onClick={()=>copyText(color,setFeedback)}><Copy size={15}/></button></div></article>)}</div><div className="bds-palettes-tool__actions"><button className="bds-button bds-button--primary" onClick={()=>copyText(colors.join('  '),setFeedback)}><Copy size={16}/> Copiar HEX</button><button className="bds-button" onClick={()=>copyText(cssVariables,setFeedback)}><Copy size={16}/> Copiar CSS</button></div><div className="bds-palettes-tool__code"><span>Variáveis CSS</span><pre>{cssVariables}</pre></div></section>
    </div>:<div className="bds-palettes-tool__explorer">
      <div className="bds-palettes-tool__explorer-bar"><div className="bds-palettes-tool__families"><button className={family==='Todas'?'is-active':''} onClick={()=>setFamily('Todas')}>Todas</button>{Object.keys(COLOR_LIBRARY).map((name)=><button key={name} className={family===name?'is-active':''} onClick={()=>setFamily(name)}>{name}</button>)}</div><label className="bds-palettes-tool__search"><Search size={16}/><input placeholder="Nome ou HEX" value={search} onChange={(e)=>setSearch(e.target.value)}/></label></div>
      <div className="bds-palettes-tool__library">{libraryColors.map(([name,hex])=>{const details=colorDetails(hex);return <article className="bds-palettes-tool__library-card" key={`${name}-${hex}`}><div className="bds-palettes-tool__swatch" style={{background:hex}}/><div className="bds-palettes-tool__library-info"><strong>{name}</strong><button onClick={()=>copyText(hex,setFeedback)}>{hex}<Copy size={14}/></button><span>{details.rgb}</span><span>{details.hsl}</span><button className="bds-palettes-tool__use" onClick={()=>useColor(hex)}>Usar na paleta</button></div></article>})}</div>
    </div>}
  </div>
}
