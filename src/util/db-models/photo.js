import cloneDeep from 'lodash/cloneDeep'

export default class Photo {
  constructor ({id, localStorageKey, timestamp, data, position, faceWidth, faceHeight}) {
    this.id = id
    this.localStorageKey = localStorageKey
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

  static copyForDB (photo) {
    const toSave = cloneDeep(photo)
    const toDel = ['data', 'id', 'width', 'height']
    for (let key of toDel) {
      delete toSave[key]
    }
    return toSave
  }
}
