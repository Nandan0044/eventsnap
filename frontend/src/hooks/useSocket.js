import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const createSocket = () =>
  io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
    transports: ['websocket'],
    autoConnect: false,
  });

export const useSocket = (eventId, { onNewPhoto, onPhotoLiked, onPhotoDeleted } = {}) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!eventId) return;

    const socket = createSocket();
    socketRef.current = socket;

    socket.connect();
    socket.emit('join_event', eventId);

    if (onNewPhoto) socket.on('new_photo', onNewPhoto);
    if (onPhotoLiked) socket.on('photo_liked', onPhotoLiked);
    if (onPhotoDeleted) socket.on('photo_deleted', onPhotoDeleted);

    return () => {
      socket.emit('leave_event', eventId);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [eventId]);
};
