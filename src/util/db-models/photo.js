import cloneDeep from 'lodash/cloneDeep'

export default class Photo {
  constructor({id, localStorageKey, timestamp, data, position, width, height, faceWidth, faceHeight }) {
    this.id = id;
    this.localStorageKey = localStorageKey;
    this.timestamp = timestamp;
    this.position = position;
    this.data = data || null;
    this.width = width;
    this.height = height;
    this.faceWidth = faceWidth || width;
    this.faceHeight = faceHeight || height;
  }

  setEmotion({ emotion, value }) {
    this.emotion = emotion
    this.emotionValue = value
  }

  static copyForDB(photo) {
    const toSave = cloneDeep(photo);
    delete toSave.data;
    delete toSave.id;
    return toSave;
  }
}
