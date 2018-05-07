import cloneDeep from 'lodash/cloneDeep'

export default class Photo {
  constructor ({id, localStorageKey, timestamp, data, position, faceWidth, faceHeight}) {
    if (id) {
      this.id = id
    }
    this.timestamp = timestamp
    this.position = position
    this.data = data || null
    this.faceWidth = faceWidth || width
    this.faceHeight = faceHeight || height
  }

  setEmotion ({emotion, value}) {
    this.emotion = emotion
    this.emotionValue = value
  }

  getFaceBox() {
    return [
      this.position.x,
      this.position.y,
      this.faceWidth,
      this.faceHeight,
    ]
  }

  static copyForDB (photo, keepId = false) {
    const toSave = cloneDeep(photo)
    const toDel = ['data', 'width', 'height']

    if (!keepId) {
      toDel.push('id')
    }

    for (let key of toDel) {
      delete toSave[key]
    }
    return toSave
  }
}
