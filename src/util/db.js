import Dexie from 'dexie'
import Photo from './db-models/photo'

const DB_NAME = 'overtime'
const DB_VERSION = 4

const db = new Dexie(DB_NAME)

db.version(1)
  .stores({
    photos: '++id, localStorageKey, timestamp'
  })

db.version(2)
  .stores({
    photos: '++id, localStorageKey, timestamp, position, width, height'
  })
  .upgrade(trans => {
    trans.photos.toCollection()
      .modify(photo => {
        photo.position = {x: 0, y: 0}
        photo.width = 0
        photo.height = 0
      })
  })

db.version(3)
  .stores({
    photos: '++id, localStorageKey, timestamp, position, faceWidth, faceHeight'
  })
  .upgrade(trans => {
    trans.photos.toCollection()
      .modify(photo => {
        photo.position = {x: 0, y: 0}
        photo.faceWidth = photo.width
        photo.faceHeight = photo.height
        delete photo.width
        delete photo.height
      })
  })

db.version(4)
  .stores({
    photos: '++id, localStorageKey, timestamp, position, faceWidth, faceHeight, emotion, emotionValue'
  })
  .upgrade(trans => {
    trans.photos.toCollection()
      .modify(photo => {
        photo.emotion = "unclassified"
        photo.emotionValue = 0.0
      })
  })

db.photos.mapToClass(Photo)

const PhotosDB = db.photos

export default db

export {
  DB_NAME,
  DB_VERSION,
  PhotosDB,
  db,
}
