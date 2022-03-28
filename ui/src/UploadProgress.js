import formatNumber from 'format-number'
import bytes from 'bytes'

const fmt = formatNumber()

export function UploadProgress ({ statusText, storedBytes, totalBytes, totalFiles }) {
  return (
    <div className='ma4 flex-auto flex items-center'>
      <div className='w-100 pa4 ba bg-white'>
        <p className='f4 mv1'><strong>{fmt(totalFiles)}</strong> files, {storedBytes ? <span><strong>{bytes(storedBytes)}</strong><span> of </span></span> : ''}<strong>{bytes(totalBytes)}</strong></p>
        {storedBytes
          ? <progress max={totalBytes} value={storedBytes} className='w-100' />
          : <progress className='w-100' />}
        <p className='f4 mv1'>{statusText}</p>
      </div>
    </div>
  )
}
