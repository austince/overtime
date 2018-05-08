import cloneDeep from 'lodash/cloneDeep'
import cloneDeepWith from 'lodash/cloneDeepWith'

export default class Photo {
  constructor ({id, timestamp, data, position, faceWidth, faceHeight}) {
    if (id) {
      this.id = id
    }
    this.timestamp = timestamp
    this.position = position
    this.data = data || null
    this.faceWidth = faceWidth
    this.faceHeight = faceHeight
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

  setFromOther(photo) {
    const copy = cloneDeepWith(photo, (value, key) => {
      if (key === 'data' && this.data) {
        return this.data; // preserve image data if exists
      } else if (key === 'id' && this.id) {
        return this.id; // also preserve id
      }
    })

    Object.assign(this, copy)
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
