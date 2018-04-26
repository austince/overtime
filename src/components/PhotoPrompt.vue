<template>

    <section class="capture rounded shadow-lg">
        <video id="photo-prompt-video"
               ref="videoCapture"
               preload
               autoplay
               loop
               muted
               @click="/*toggleTracking*/">
        </video>
        <!-- If we wanted to draw on the the video -->
        <!--<canvas id="canvas"></canvas>-->
    </section>

</template>


<style lang="scss">
    @import "../base";

    .capture {
        width: 100%;
        height: 100%;
    }

</style>

<script>
  import 'tracking' // only available through global imports
  import 'tracking/build/data/face'
  import 'tracking/build/data/eye'
  import 'tracking/build/data/mouth'
  import dat from 'dat.gui'

  import {captureVideoFrame} from '../util/captureVideoFrame'
  import Photo from '../util/Photo'

  export default {
    data () {
      return {
        currentTrackingTask: null,
        isTracking: false,
        hasTakenPhoto: false,
      }
    },
    computed: {},
    created () {
      console.log('Created')
      this.tracker = new tracking.ObjectTracker(['face', 'eye', 'mouth'])
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
          event.data.forEach((faceData) => {
            faceData.position = {
              x: faceData.x,
              y: faceData.y
            }
          })

          if (!this.hasTakenPhoto) {
            console.log('Taking photo!')
            this.hasTakenPhoto = true;
            // this.stopTracking()
            //const photo = await this.takePhoto(event.data[0])
            // this.$emit('photoTaken', photo)
          }

        }
      })

      this.startTracking()
    },
    methods: {
      startTracking () {
        this.currentTrackingTask = tracking.track(this.$refs.videoCapture, this.tracker, {camera: true})
        this.isTracking = true;
        this.hasTakenPhoto = false;
      },
      stopTracking () {
        this.currentTrackingTask.stop()
        this.isTracking = false;
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
          position: faceData.position,
          width: faceData.width,
          height: faceData.height,
          timestamp,
          data
        })

        return photo
      },
    }
  }
</script>
