import { useState } from 'react'

export function TokenForm ({ onToken }) {
  const [token, setToken] = useState('')
  const handleInput = e => setToken(e.target.value)
  const handleSubmit = e => { e.preventDefault(); onToken(token) }

  return (
    <div className='ma4 flex-auto flex items-center'>
      <form className='w-100 pa4' onSubmit={handleSubmit}>
        <textarea id='key' className='w-100 pa3 sans-serif mb2 ba b--black br1' rows='5' placeholder='Enter your NFT.Storage API key.' required spellcheck='false' onInput={handleInput} />
        <div className='tc'>
          <button type='submit' className='ph4 pv2 bg-green ba b--dark-green br1 light-green hover-white'>Continue</button>
        </div>
      </form>
    </div>
  )
}
