
import React from 'react';

const MessageInput = ({ message, setMessage, sendMessage, onTyping, username }) => {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <input
        type="text"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          if (onTyping) onTyping();
        }}
        placeholder="Type your message..."
        style={{ flex: 1 }}
      />
    </div>
  );
};

export default MessageInput;
