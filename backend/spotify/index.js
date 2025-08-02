import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fetch from 'node-fetch'

dotenv.config()
const app = express()
const port = process.env.PORT || 3001

app.use(cors())

let accessToken = null

const getAccessToken = async () => {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await response.json()
  accessToken = data.access_token
}

app.get('/search', async (req, res) => {
  const query = req.query.q
  if (!accessToken) await getAccessToken()

  try {
    const result = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await result.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Spotify search failed' })
  }
})

app.listen(port, () => {
  console.log(`Spotify backend running at http://localhost:${port}`)
})
