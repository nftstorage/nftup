import { useState } from 'react'

export function TokenForm ({ onToken }) {
  const [token, setToken] = useState('')
  const handleInput = e => setToken(e.target.value)
  const handleSubmit = e => { e.preventDefault(); onToken(token.trim()) }

  return (
    <div className='ma4 flex-auto flex items-center'>
      <form className='w-100 pa4' onSubmit={handleSubmit}>
        <textarea id='key' className='w-100 pa3 sans-serif db mb2 ba b--black br1' rows='5' placeholder='Enter your NFT.Storage API key.' required spellcheck='false' onInput={handleInput} />
        <p className='f6 mt2 mb3'>
          <img src='icon-question.svg' alt='question icon' className='v-mid mr1' style={{ width: 18 }} />
          <span className='v-mid'>API keys can be found <a href='https://nft.storage/manage/' target='_blank' rel='noreferrer' className='black'>on your account page</a>.</span>
        </p>
        <div className='tc'>
          <button type='submit' className='ph4 pv2 bg-green ba b--dark-green br1 light-green hover-white'>Continue</button>
        </div>
      </form>
    </div>
  )
}
