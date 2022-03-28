import { CloseButton } from './CloseButton.js'

export function ErrorMessage ({ message, onClose }) {
  return (
    <div className='relative ma4 flex-auto flex items-center'>
      <div className='absolute top-0 right-0'><CloseButton onClick={onClose} /></div>
      <div className='w-100 pa4'>
        <h1 className='tc mv0' style={{ fontSize: 128 }}>⚠️</h1>
        <p className='tc'>Error: {message}</p>
      </div>
    </div>
  )
}
