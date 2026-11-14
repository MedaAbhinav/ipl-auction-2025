const { v4: uuidv4 } = require('uuid');

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'IPL';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateRoomId() {
  return uuidv4();
}

module.exports = { generateRoomCode, generateRoomId };
