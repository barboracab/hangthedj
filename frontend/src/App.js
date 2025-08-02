import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [roomName, setRoomName] = useState('')
  const [userName, setUserName] = useState('')
  const [isInRoom, setIsInRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [songs, setSongs] = useState([])
  const [newSong, setNewSong] = useState('')
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    if (!isInRoom) return

    loadSongs()

    const channel = supabase
      .channel('public:songs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'songs', filter: `room_id=eq.${roomName}` },
        (payload) => {
          loadSongs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isInRoom, roomName])

  const loadSongs = async () => {
    if (!roomName) return

    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('room_id', roomName)
      .order('votes', { ascending: false })

    if (!error) {
      setSongs(data)
    }
  }

  const fetchSuggestions = async (query) => {
    if (!query) return setSuggestions([])

    try {
      const response = await fetch(`http://localhost:3001/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.tracks?.items) {
        setSuggestions(data.tracks.items)
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
    }
  }

  const handleSuggestionClick = async (track) => {
    const title = `${track.name} — ${track.artists?.map((a) => a.name).join(', ')}`
    const { error } = await supabase.from('songs').insert({
      title,
      room_id: roomName,
      votes: 0,
    })
    if (!error) {
      setNewSong('')
      setSuggestions([])
      loadSongs()
    }
  }

  const handleJoinRoom = () => {
    if (!newRoomName || !newUserName) return
    setRoomName(newRoomName)
    setUserName(newUserName)
    setIsInRoom(true)
  }

  const handleVote = async (songId, delta) => {
    const { data, error: fetchError } = await supabase
      .from('songs')
      .select('votes')
      .eq('id', songId)
      .single()

    if (fetchError) return

    const currentVotes = data.votes || 0

    const { error: updateError } = await supabase
      .from('songs')
      .update({ votes: currentVotes + delta })
      .eq('id', songId)

    if (!updateError) {
      loadSongs()
    }
  }

  if (!isInRoom) {
    return (
      <div style={{ padding: 40 }}>
        <h1>🎶 Hang The DJ</h1>
        <input
          type="text"
          placeholder="Room name"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          style={{ marginBottom: 10, display: 'block' }}
        />
        <input
          type="text"
          placeholder="Your name"
          value={newUserName}
          onChange={(e) => setNewUserName(e.target.value)}
          style={{ marginBottom: 10, display: 'block' }}
        />
        <button onClick={handleJoinRoom}>Join</button>
      </div>
    )
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>🎉 You are in room "{roomName}"</h2>
      <p>Your nickname: {userName}</p>

      <h3>Search for a song:</h3>
      <input
        type="text"
        value={newSong}
        onChange={(e) => {
          setNewSong(e.target.value)
          fetchSuggestions(e.target.value)
        }}
        placeholder="Type a song title"
        style={{ width: '100%', marginBottom: 10 }}
      />

      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {suggestions.map((track) => (
          <li
            key={track.id}
            onClick={() => handleSuggestionClick(track)}
            style={{
              cursor: 'pointer',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: 4,
              marginBottom: 5,
              background: '#f9f9f9',
            }}
          >
            {track.name} — {track.artists.map((a) => a.name).join(', ')}
          </li>
        ))}
      </ul>

      <h3>🎵 Song queue:</h3>
      <p>Total songs: {songs.length}</p>
      <ul>
        {songs.map((song) => (
          <li key={song.id}>
            {song.title} — {song.votes} votes
            <button onClick={() => handleVote(song.id, 1)}>👍</button>
            <button onClick={() => handleVote(song.id, -1)}>👎</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
