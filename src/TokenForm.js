import { useState } from 'react'

export function TokenForm ({ onToken }) {
  const [secret, setSecret] = useState('')
  const [key, setKey] = useState('')
  const [bucket, setBucket] = useState('')
  const handleSecretInput = e => setSecret(e.target.value)
  const handleKeyInput = e => setKey(e.target.value)
  const handleBucketInput = e => setBucket(e.target.value)
  const handleSubmit = e => { e.preventDefault(); onToken(key.trim(), secret.trim(), bucket.trim()) }

  const textStyle = { color: '#FFFFFF' };
  const linkTextStyle = { color: '#FFA500' };

  return (
    <div className='ma4 flex-auto flex items-center'>
      <form className='w-100 pa4' onSubmit={handleSubmit} style={textStyle}>
        <textarea id='key' className='w-100 pa3 sans-serif db mb2 ba b--black br1' rows='1' placeholder='Enter your S3 Key.' required spellcheck='false' onInput={handleKeyInput} />
        <textarea id='secret' className='w-100 pa3 sans-serif db mb2 ba b--black br1' rows='1' placeholder='Enter your S3 Secret.' required spellcheck='false' onInput={handleSecretInput} />
        <textarea id='bucket' className='w-100 pa3 sans-serif db mb2 ba b--black br1' rows='1' placeholder='Enter your S3 Bucket.' required spellcheck='false' onInput={handleBucketInput} />
        <p className='f6 mt2 mb3' style={textStyle}>
          <img src='icon-question.svg' alt='question icon' className='v-mid mr1' style={{ width: 18 }} />
          <span className='v-mid'>Credentials can be found <a href='https://console.filebase.com/keys' target='_blank' rel='noreferrer' style={linkTextStyle}>on your Access Keys page</a>.</span>
        </p>
        <div className='tc'>
          <button type='submit' className='ph4 pv2 bg-green ba b--dark-green br1 light-green hover-white'>Continue</button>
        </div>
      </form>
    </div>
  )
}
