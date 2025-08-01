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

  useEffect(() => {
    if (!isInRoom) return

    loadSongs()

    const channel = supabase
      .channel('public:songs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'songs', filter: `room_id=eq.${roomName}` },
        (payload) => {
          console.log('Realtime update:', payload)
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

    if (error) {
      console.error('Error loading songs:', error)
    } else {
      setSongs(data)
    }
  }

  const handleAddSong = async () => {
    if (!newSong) return

    const { error } = await supabase.from('songs').insert({
      title: newSong,
      room_id: roomName,
      votes: 0,
    })

    if (error) {
      console.error('Error adding song:', error)
    } else {
      setNewSong('')
      await loadSongs()
      console.log('Song added and queue updated')
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

    if (fetchError) {
      console.error('Error fetching votes:', fetchError)
      return
    }

    const currentVotes = data.votes || 0

    const { error: updateError } = await supabase
      .from('songs')
      .update({ votes: currentVotes + delta })
      .eq('id', songId)

    if (updateError) {
      console.error('Error voting:', updateError)
    } else {
      console.log('Vote updated by', delta)
      await loadSongs()
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

      <h3>Add song to queue:</h3>
      <input
        type="text"
        value={newSong}
        onChange={(e) => setNewSong(e.target.value)}
        placeholder="Song title"
      />
      <button onClick={handleAddSong}>Add</button>

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
