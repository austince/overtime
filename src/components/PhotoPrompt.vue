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
  import clm from 'clmtrackr'
  import dat from 'dat.gui'

  import {captureVideoFrame} from '../util/captureVideoFrame'
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
      this.tracker = new tracking.ObjectTracker(['face'])
      this.tracker.setInitialScale(4)
      this.tracker.setStepSize(2)
      this.tracker.setEdgesDensity(0.1)
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

          console.log('Found faces!')
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
            this.$emit('photoTaken', photo)
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
