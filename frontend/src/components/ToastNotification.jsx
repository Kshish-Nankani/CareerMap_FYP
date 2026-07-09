import { useState, useEffect } from 'react';

export default function ToastNotification({ message, type = 'success', onClose, duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 400); // Wait for hide animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast-notification ${type} ${!isVisible ? 'hide' : ''}`}>
      {type === 'success' ? (
        <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
      ) : (
        <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
      )}
      <span>{message}</span>
    </div>
  );
}