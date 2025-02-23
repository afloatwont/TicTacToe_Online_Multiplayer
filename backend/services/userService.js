import logger from '../utils/logger.js';

class UserService {
  constructor() {
    this.users = new Map();
  }

  exists(username) {
    return this.users.has(username);
  }

  addUser(username, socketId) {
    if (this.exists(username)) {
      return false;
    }
    this.users.set(username, {
      socketId,
      online: true,
      playing: false
    });
    return true;
  }

  removeUser(username) {
    this.users.delete(username);
  }

  updateUserStatus(username, status) {
    const user = this.users.get(username);
    if (user) {
      this.users.set(username, { ...user, ...status });
    }
  }
}

export default new UserService();