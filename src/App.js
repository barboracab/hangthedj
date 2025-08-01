import React from 'react';
import taylor from './taylor.jpg';

function App() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000000',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
    }}>
      <img src={taylor} alt="In progress" style={{ maxWidth: '80%', height: 'auto', marginBottom: 20 }} />
    </div>
  );
}

export default App;
