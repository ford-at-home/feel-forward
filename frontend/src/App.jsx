import { useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')

  const sendMessage = async (e) => {
    e.preventDefault()
    const res = await fetch('http://localhost:8000/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })
    const data = await res.json()
    setResponse(data.response)
  }

  return (
    <div className="App">
      <h1>Feel Forward</h1>
      <form onSubmit={sendMessage}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button type="submit">Send</button>
      </form>
      {response && (
        <div className="response">
          <strong>Response:</strong> {response}
        </div>
      )}
    </div>
  )
}

export default App
