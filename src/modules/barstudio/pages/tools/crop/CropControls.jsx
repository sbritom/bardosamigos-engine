import { ImageDecorationControls, ImageRangeField } from '../../../image-tools'

export default function CropControls({ zoom, onZoomChange, settings, onSettingsChange, onCenter }) {
  return (
    <div className="bds-round-crop-controls">
      <div className="bds-round-crop-control-group">
        <div className="bds-round-crop-control-title"><strong>Enquadramento</strong><button onClick={onCenter} type="button">Centralizar</button></div>
        <ImageRangeField label="Zoom" min={1} max={3} step={0.05} value={zoom} onChange={onZoomChange} suffix={`${Math.round(zoom * 100)}%`} />
      </div>
      <ImageDecorationControls settings={settings} onSettingsChange={onSettingsChange} />
    </div>
  )
}
