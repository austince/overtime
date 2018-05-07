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

  import {captureVideoFrame} from '../util/captureVideoFrame'
  import Photo from '../util/db-models/photo'


  export default {
    is: 'photo-prompt',
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
      console.log('mounted')
      this.tracker.on('track', async (event) => {
        if (event.data.length > 0) {
          let largestFace = event.data.reduce((faceData, largestSoFar) => {
            return faceData.height * faceData.width > largestSoFar.width * largestSoFar.height ? faceData : largestSoFar
          }, { width: 0, height: 0})

          console.log('Found faces!')

          if (!this.hasTakenPhoto) {
            console.log('Taking photo!')

            this.hasTakenPhoto = true
            this.stopTracking()
            const photo = this.takePhoto(largestFace)
            this.$emit('photoTaken', photo)
          } else {
            this.stopTracking()
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

      takePhoto (faceData) {
        const {dataUri: data} = captureVideoFrame(this.$refs.videoCapture, 'png')

        const timestamp = Date.now().toString()
        return new Photo({
          position: {
            x: faceData.x,
            y: faceData.y,
          },
          faceWidth: faceData.width,
          faceHeight: faceData.height,
          timestamp,
          data
        })
      },
    }
  }
</script>
