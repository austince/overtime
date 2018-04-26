export default class Photo {
  constructor({localStorageKey, timestamp, data, position, width, height }) {
    this.localStorageKey = localStorageKey;
    this.timestamp = timestamp;
    this.data = data || null;
  }

  static fromDB({ id, localStorageKey, timestamp }) {
    this.id = id;
    this.localStorageKey = localStorageKey;
    this.timestamp = timestamp;
  }
}
