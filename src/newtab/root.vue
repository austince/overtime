<style lang="scss">
    @import '~sass-material-colors';
    @import '../base';
    @import '../reset';

    $photo-width: 320px;
    $photo-height: 240px;
    $bg-color: material-color('blue-grey', '900');

    @mixin picture-overflow-height {
        overflow-y: hidden;
        height: calc(100% + #{$photo-height});
    }

    body {
        overflow-y: hidden;
    }

    #bg {
        position: fixed;
        width: 100%;
        height: 100%;
        background: $bg-color;
    }

    #app {
        width: 100%;
        height: 100%;
        background: $bg-color;

        display: flex;
        align-items: center;
        justify-content: center;
    }

    #capture {
        z-index: 1;
        width: 640px;
        height: 480px;
    }

    #photo-wall {
        display: flex;
        flex-wrap: wrap;
        flex-direction: column;
        justify-content: flex-start;
        height: calc(100% + #{$photo-height});
        position: absolute;
        top: 0;
        left: 0;
        z-index: 0;
        background: $bg-color;
    }

    .photo {
        width: $photo-width / 2;
        height: $photo-height / 2;
    }

    img {
        width: 100%;
        height: 100%;
    }

</style>

<template>

    <main id="app">
        <section id="bg">

        </section>

        <section id="capture">
            <photo-prompt
                    width="640"
                    height="480"
                    v-if="needsPhotoPrompt"
                    @photoTaken="handlePhoto">
            </photo-prompt>
        </section>


        <section id="photo-wall">
            <div class="photo"
                 v-for="photo of photos">
                <img :src="photo.data">
            </div>
        </section>
    </main>

</template>

<script>
  import chromep from 'chrome-promise'
  import clm from 'clmtrackr'
  import {Lock} from 'semaphore-async-await'

  import {captureVideoFrame} from '../util/captureVideoFrame'
  import Photo from '../util/db-models/photo'
  import OvertimeImage from '../util/db-models/overtime-image'

  import {ImagesDB, PhotosDB, joinImages} from '../util/db'
  import PhotoPrompt from '../components/PhotoPrompt'
  import {EmotionsModel, PCAEmotionalModel} from '../util/face-models'
  import EmotionClassifier from '../util/emotion-classifier'

  const LAST_PHOTO_KEY = 'LAST_PHOTO'
  const MS_PER_MIN = 1000 * 60

  function dateDiffInMins (date, other = (new Date())) {
    const utc1 = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    const utc2 = Date.UTC(other.getFullYear(), other.getMonth(), other.getDate())
    return Math.floor((utc2 - utc1) / MS_PER_MIN)
  }

  export default {
    data () {
      return {
        needsPhotoPrompt: false,
        photos: [],
        currentTrackingTask: null,
      }
    },
    computed: {},
    created () {
      console.log('Created root app')
      this.loadPhotos()
      this.emotionClassifier = new EmotionClassifier(EmotionsModel)
      this.clmTracker = new clm.tracker({stopOnConvergence: true})
      this.clmTracker.init(PCAEmotionalModel, {useWebGL: true})
    },
    mounted () {
      this.checkIfNeedsPhoto()
    },
    methods: {
      async checkIfNeedsPhoto () {
        const res = await chromep.storage.local.get([LAST_PHOTO_KEY])
        if (!res[LAST_PHOTO_KEY] || dateDiffInMins(new Date(res[LAST_PHOTO_KEY])) >= 0.5) {
          this.needsPhotoPrompt = true
        }
        console.log(`Done photo check. Needs prompt? ${this.needsPhotoPrompt}`)
      },

      async handlePhoto (photo) {
        this.needsPhotoPrompt = false
        const updateLock = new Lock()

        this.photos.push(photo)

        photo.id = await PhotosDB.add(Photo.copyForDB(photo))

        // Add the image to the DB as well
        const imgToAdd = new OvertimeImage({photoId: photo.id, data: photo.data})
        imgToAdd.id = await ImagesDB.add(imgToAdd)

        await chromep.storage.local.set({LAST_PHOTO_KEY: photo.timestamp})

        const getMaxEmotion = (emotionData) => {
          return emotionData.reduce((em, otherEm) => {
            return em.value >= otherEm.value ? em : otherEm
          }, {value: -1}) // there will always be a value > -1
        }

        /**
         * @critical
         * @param emotionData
         * @return {Promise<void>}
         */
        const updatePhotoEmotion = async (emotionData) => {
          const maxEmotion = getMaxEmotion(emotionData)
          photo.setEmotion(maxEmotion)
          // Enter
          await updateLock.acquire()

          try {
            console.log(`Updating emotion of ${photo.id} to ${maxEmotion.emotion}:${maxEmotion.value}`)
            await PhotosDB.update(photo.id, {emotion: maxEmotion})
            console.log(`Updated emotion of ${photo.id}`)
          } finally {
            updateLock.release()
          }
        }

        // Todo: move to background script, or web worker?
        let emotionData
        try {
          console.log('Detecting emotions!')
          emotionData = await this.detectEmotions(photo, {onIteration: updatePhotoEmotion})
          console.log('CONVERGED')

        } catch ([message, errorEvent, emotions]) {

          console.error(message, errorEvent, emotions)
          emotionData = emotions

        } finally {
          console.log('Final emotions:', emotionData)
          await updatePhotoEmotion(emotionData)
        }

        // Reset so that the next photo will be a new detection,
        // if we decided to take multiple photos per new tab  session
        // ya know, if
        // this.clmTracker.reset()
      },

      /**
       *
       * @param {Photo}photo
       * @param onIteration
       * @param maxIterations
       * @return {Promise<any>}
       */
      detectEmotions (photo, {
        onIteration = (emotions) => {
        },
        maxIterations = 50
      }) {
        return new Promise(((resolve, reject) => {
          let emotionData = this.emotionClassifier.blankPrediction()

          const successHandler = (event) => {
            cleanup()
            resolve(emotionData)
          }

          const errorHandler = (event) => {
            cleanup()
            reject(['Emotion detection problem!', event.type, emotionData])
          }

          let iteration = 0
          const progressHandler = (event) => {
            iteration++

            const cp = this.clmTracker.getCurrentParameters()
            emotionData = this.emotionClassifier.meanPredict(cp)
            onIteration(emotionData)

            if (iteration > maxIterations) {
              cleanup()
              reject(['Max iterations reached', event.type, emotionData])
            }
          }

          const eventHandlers = {
            'clmtrackrConverged': successHandler,
            'clmtrackrIteration': progressHandler,
            'clmtrackrLost': errorHandler,
            'clmtrackrNotFound': errorHandler
          }

          const setupHandlers = () => {
            for (const [eventType, handler] of Object.entries(eventHandlers)) {
              document.addEventListener(eventType, handler)
            }
            console.log('Done handler setup')
          }

          const cleanup = () => {
            this.clmTracker.stop()

            for (const [eventType, handler] of Object.entries(eventHandlers)) {
              document.removeEventListener(eventType, handler)
            }
            console.log('Done handler teardown')
          }

          setupHandlers()

          const img = new Image()
          img.onload = (function () {
            // give the clm tracker a hint to where the face is
            const faceBox = [
              photo.position.x,
              photo.position.y,
              photo.faceWidth,
              photo.faceHeight,
            ]

            this.clmTracker.start(img, faceBox)
          }).bind(this)

          img.src = photo.data
        }))
      },

      async loadPhotos () {
        const col = PhotosDB
          .orderBy('timestamp')
          .limit(100)
        const photos = await joinImages(col)

        photos.forEach(photo => {
          this.photos.push(photo)
        })
      }
    },
    components: {
      'photo-prompt': PhotoPrompt,
    }
  }
</script>
