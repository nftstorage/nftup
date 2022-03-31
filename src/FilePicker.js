import { useState } from 'react'

export function FilePicker ({ onPickFiles }) {
  const [borderClass, setBorderClass] = useState('b--light-red')
  const onDragEnter = e => {
    setBorderClass('b--white')
    return killEvent(e)
  }
  const handleDrop = e => {
    killEvent(e)
    setBorderClass('b--light-red')
    onPickFiles(Array.from(e.dataTransfer.files))
  }
  const handleFilesChange = e => onPickFiles(Array.from(e.target.files))
  const labelClass = `relative ba bw4 ${borderClass} grow b--dashed br4 ma4 flex-auto`
  const labelStyle = { backgroundColor: 'rgba(255,255,255,0.1)' }
  return (
    <label htmlFor='files' className={labelClass} style={labelStyle} onDragEnter={onDragEnter} onDragOver={killEvent} onDrop={handleDrop} draggable>
      <input className='absolute pointer w-100 h-100 top-0 o-0' type='file' id='files' multiple webkitdirectory='true' onChange={handleFilesChange} />
      <div className='flex items-center h-100'>
        <div className='tc w-100 f3'>
          Drag and Drop files<br /><span className='f6'>(or click to choose)</span>
        </div>
      </div>
    </label>
  )
}

function killEvent (e) {
  e.stopPropagation()
  e.preventDefault()
  return false
}
