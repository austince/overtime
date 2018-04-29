<template>

    <section class="capture rounded shadow-lg">
        <video ref="videoCapture"
               preload
               autoplay
               loop
               muted
               :width="width"
               :height="height">
        </video>
        <canvas ref="canvas"
                :width="width"
                :height="height">
            Your browser is not supported.
        </canvas>
    </section>

</template>


<style lang="scss" scoped>
    @import "../base";

    .capture {
        position: relative;
        width: 100%;
        height: 100%;

        canvas {
            position: absolute;;
            top: 0;
            left: 0;
        }
    }

</style>

<script>
  import 'tracking' // only available through global imports
  import 'tracking/build/data/face'
  import 'tracking/build/data/eye'
  import 'tracking/build/data/mouth'
  import clm from 'clmtrackr'
  import dat from 'dat.gui'

  import EmotionClassifier from '../util/emotion-classifier'
  import {captureVideoFrame} from '../util/captureVideoFrame'
  import {EmotionsModel, PCAEmotionalModel} from '../util/face-models'
  import Photo from '../util/db-models/photo'


  export default {
    data () {
      return {
        currentTrackingTask: null,
        isTracking: false,
        hasTakenPhoto: false,
      }
    },
    props: [
      'width',
      'height'
    ],
    computed: {},
    created () {
      console.log('Created')
      this.tracker = new tracking.ObjectTracker(['face', 'eye', 'mouth'])
      this.tracker.setInitialScale(4)
      this.tracker.setStepSize(2)
      this.tracker.setEdgesDensity(0.1)
      this.emotionClassifier = new EmotionClassifier(EmotionsModel)
      this.clmTracker = new clm.tracker({stopOnConvergende: true})
      this.clmTracker.init(PCAEmotionalModel, {useWebGL: true})
    },
    mounted () {
      // this.gui = new dat.GUI()
      // this.gui.add(this.tracker, 'edgesDensity', 0.1, 0.5).step(0.01)
      // this.gui.add(this.tracker, 'initialScale', 1.0, 10.0).step(0.1)
      // this.gui.add(this.tracker, 'stepSize', 1, 5).step(0.1)

      this.tracker.on('track', async (event) => {
        if (event.data.length > 0) {


          let largestFace = event.data.reduce((faceData, largestSoFar) => {
            return faceData.height * faceData.width > largestSoFar.width * largestSoFar.height ? faceData : largestSoFar
          }, { width: 0, height: 0})

          // const faceBox = [
          //   largestFace.x,
          //   largestFace.y,
          //   largestFace.width,
          //   largestFace.height,
          // ]
          // let ctx = this.$refs.canvas.getContext('2d')
          // ctx.clearRect(
          //   0,
          //   0,
          //   this.$refs.canvas.width,
          //   this.$refs.canvas.height
          // )
          // ctx.beginPath()
          // ctx.rect(...faceBox)
          // ctx.stroke()
          // ctx.closePath()

          if (!this.hasTakenPhoto) {
            console.log('Taking photo!')

            this.hasTakenPhoto = true
            this.stopTracking()
            const photo = await this.takePhoto(largestFace)
            let emotionData
            try {
              console.log('Detecting emotions!')
              emotionData = await this.detectEmotions(photo)
              console.log("CONVERGED", emotionData)
            } catch ([message, errorEvent, emotions]) {
              console.error(message, errorEvent, emotions)
              emotionData = emotions
            } finally {
              console.log("Final emotions:", emotionData)
              const maxEmotion = emotionData.reduce((em, otherEm) => {
                return em.value >= otherEm.value ? em : otherEm
              }, { value: -1 })
              console.log("Final max emotion:", maxEmotion)
              photo.setEmotion(maxEmotion)
              this.$emit('photoTaken', photo)
            }
          }

        }
      })

      this.startTracking()
    },
    methods: {
      startTracking () {
        this.currentTrackingTask = tracking.track(this.$refs.videoCapture, this.tracker, {camera: true})
        this.isTracking = true
        this.hasTakenPhoto = false
      },
      stopTracking () {
        this.currentTrackingTask.stop()
        this.isTracking = false
      },
      toggleTracking () {
        if (this.isTracking) {
          this.stopTracking()
        } else {
          this.startTracking()
        }
      },
      /**
       *
       * @param {Photo}photo
       * @param maxIterations
       * @return {Promise<any>}
       */
      detectEmotions (photo, maxIterations = 15) {
        return new Promise(((resolve, reject) => {
          let emotionData = this.emotionClassifier.blankPrediction()

          document.addEventListener('clmtrackrConverged', (event) => {
            this.clmTracker.stop()
            resolve(emotionData)
          })

          const errorHandler = (event) => {
            this.clmTracker.stop()
            reject(['Emotion detection problem!', event, emotionData])
          }

          document.addEventListener('clmtrackrLost', errorHandler)
          document.addEventListener('clmtrackrNotFound', errorHandler)

          let iteration = 0
          document.addEventListener('clmtrackrIteration', (event) => {
            iteration++
            // if (this.clmTracker.getCurrentPosition()) {
                // this.clmTracker.draw(this.$refs.canvas)
            // }

            const cp = this.clmTracker.getCurrentParameters()
            emotionData = this.emotionClassifier.meanPredict(cp)
            console.log('Iteration', iteration, emotionData)

            if (iteration > maxIterations) {
              this.clmTracker.stop()
              reject(["Max iterations reached", event, emotionData])
            }
          })

          const img = new Image()
          img.onload = (function () {
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

      async takePhoto (faceData) {
        const {dataUri: data} = captureVideoFrame(this.$refs.videoCapture, 'png')

        const timestamp = Date.now().toString()
        const photo = new Photo({
          localStorageKey: timestamp,
          position: {
            x: faceData.x,
            y: faceData.y,
          },
          faceWidth: faceData.width,
          faceHeight: faceData.height,
          timestamp,
          data
        })

        return photo
      },
    }
  }
</script>
