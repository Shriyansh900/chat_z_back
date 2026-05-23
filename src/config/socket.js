// Singleton io instance — set by initSocket, used by controllers
let _io = null;

export const setIo = (io) => {
  _io = io;
};

export const getIo = () => {
  if (!_io) throw new Error('Socket.IO not initialized');
  return _io;
};
