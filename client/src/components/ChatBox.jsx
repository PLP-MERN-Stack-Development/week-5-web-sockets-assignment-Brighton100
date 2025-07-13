import React from 'react';

const ChatBox = ({ messages }) => {
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', height: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
      {messages.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        messages.map((msg, i) => <p key={i}>{msg}</p>)
      )}
    </div>
  );
};

export default ChatBox;
