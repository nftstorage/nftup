import formatNumber from 'format-number'
import bytes from 'bytes'

const fmt = formatNumber()

export function UploadProgress ({ statusText, storedBytes, storedChunks, totalBytes, totalFiles }) {
  return (
    <div className='ma4 flex-auto flex items-center'>
      <div className='w-100 pa4 ba bg-white'>
        <p className='f4 mv1'><strong>{fmt(totalFiles)}</strong> files, {storedBytes ? <span><strong>{bytes(storedBytes)}</strong><span> of </span></span> : ''}<strong>{bytes(totalBytes)}</strong>{storedChunks ? <span className='f6 fr mt1'>{fmt(storedChunks)} chunk{storedChunks > 1 ? 's' : ''}</span> : ''}</p>
        {storedBytes
          ? <Meter max={totalBytes} value={storedBytes} />
          : <MeterIndeterminate />}
        <p className='f4 mv1'>{statusText}</p>
      </div>
    </div>
  )
}

function Meter ({ value, max }) {
  const percent = Math.min((value / max) * 100, 100)
  return (
    <div className='meter solid'>
      <span style={{ width: `${percent}%` }} />
    </div>
  )
}

function MeterIndeterminate () {
  return (
    <div className='meter animate striped'>
      <span className='db'><span /></span>
    </div>
  )
}
