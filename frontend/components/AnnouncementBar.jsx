import React, { useState, useEffect } from "react";

const messages = [
  "✨ Welcome to A Figure A Day — your anime collectible shop!",
  "🎎 New figures added daily — happy collecting!",
  "🏷️ Check back later for special deals & drops!",
  "📦 Fast processing & secure shipping on all orders.",
  "💖 Thanks for supporting a small collector-run anime store!",
];

const AnnouncementBar = () => {
  const [visible, setVisible] = useState(true);
  const [message, setMessage] = useState(messages[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-amber-600 text-white text-center py-1 text-sm flex justify-center items-center px-2">
      <span className="truncate">{message}</span>
      <button
        aria-label="Close announcement"
        className="ml-4 text-white hover:text-gray-200 font-bold text-lg w-6 h-6 rounded flex items-center justify-center"
        onClick={() => setVisible(false)}
      >
        &times;
      </button>
    </div>
  );
};

export default AnnouncementBar;
