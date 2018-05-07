import Dexie from 'dexie'
import chromep from 'chrome-promise'
import Photo from './db-models/photo'

const DB_NAME = 'overtime'
const DB_VERSION = 5

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
        if (!photo.emotion) {
          photo.emotion = 'unclassified'
          photo.emotionValue = 0.0
        }
      })
  })

db.version(5)
  .stores({
    photos: '++id, &timestamp, emotion, emotionValue', // store photo meta data
    images: '++id, photoId' /* non-index fields: data */ // stores actual image data of photo
  })
  .upgrade(async trans => {
    const imagesToAdd = []
    await trans.photos.toCollection()
      .modify(photo => {
        if (!photo.emotion) {
          photo.emotion = 'unclassified'
          photo.emotionValue = 0.0
        }

        // Add here, don't do async within transaction
        imagesToAdd.push({
          photoId: photo.id,
          _photoLocalKey: photo.localStorageKey,
        })

        delete photo.localStorageKey
      })

    await Promise.all(imagesToAdd.map(async imgObj => {
      const res = await chromep.storage.local.get([imgObj._photoLocalKey])
      imgObj.data = res[imgObj._photoLocalKey]
      delete imgObj._photoLocalKey
    }))

    trans.images.bulkAdd(imagesToAdd)
  })

// Changes:
//  - Unique photo id
db.version(6)
  .stores({
    photos: '++id, &timestamp, emotion, emotionValue', // store photo meta data
    images: '++id, &photoId' /* non-index fields: data */ // stores actual image data of photo
  })

db.photos.mapToClass(Photo)

/**
 * https://github.com/dfahlander/Dexie.js/issues/232
 *
 * @param photoCollection
 * @return {Dexie.Promise<any>}
 */
export function joinImages (photoCollection) {
  return db.transaction('r', PhotosDB, ImagesDB, async () => {
    return photoCollection.toArray(photos => {
      const imagesProm = photos.map(photo => {
        return ImagesDB.where('photoId').equals(photo.id).toArray()
      })

      return Promise.all(imagesProm).then(images => {
        // Attach
        photos.forEach((photo, i) => {
          if (typeof images[i][0] !== 'undefined') {
            photo.data = images[i][0].data
          } else {
            // todo: remove this photo!
            photo.data = null
          }
        })

        return photos
      })

    })
  })
}

export const PhotosDB = db.photos
export const ImagesDB = db.images

export default db

export {
  DB_NAME,
  DB_VERSION,
  db,
}
