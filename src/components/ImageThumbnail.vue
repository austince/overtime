<style scoped lang="scss">
    @import '../base';

    $happy: material-color('yellow', '500');
    $sad: material-color('indigo', '500');
    $surprised: material-color('green', '500');
    $angry: material-color('red', '500');
    $unknown: material-color('grey', '500');

    $high-scale: 2.5;

    @mixin stacked($level) {
        width: 100%;
        height: 100%;
        position: absolute;
        z-index: $level;
    }

    .thumbnail {
        position: relative;
        width: 100%;
        height: 100%;
        box-shadow: 0 0 0 $black;
        transform: scale(.95);

        &:hover {
            box-shadow: 0 0 100px $black;
            z-index: 1000;
            transition: transform 100ms ease-in-out;
            transform: scale($high-scale);
        }

        img {
            @include stacked(1);
        }

        canvas {
            @include stacked(2);
        }

        .overlay {
            @include stacked(3);
        }

        .photo-details {
            @include stacked(4);
            @include text-border(1px);

            text-align: center;
            text-transform: uppercase;
            bottom: 0;
            margin: 0;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;

            & > * {
                margin: 0 2px;
            }
        }
    }

    .overlay {
        &.happy {
            background-color: $happy;
        }

        &.sad {
            background-color: $sad;
        }

        &.angry {
            background-color: $angry;
        }

        &.surprised {
            background-color: $surprised;
        }

        &.unknown {
            background-color: $unknown;
        }
    }


</style>

<template>
    <section class="thumbnail"
             ref="root"
             @mouseenter="startHover"
             @mouseleave="stopHover">
        <div :class="[photoEmotion, 'overlay']"
             :style="{ opacity: opacity }">
        </div>
        <canvas ref="clmOverlay"></canvas>
        <img :src="photo.data"
             ref="image"/>

        <article :class="[isHovering ? 'visible' : 'invisible', 'photo-details', 'text-white', 'h5']">
            <h4>{{photo.emotion || 'unknown'}}</h4>
            <h4>{{photoDate}}</h4>
        </article>
    </section>
</template>

<script>
  import moment from 'moment'
  import { PhotosDB } from '../util/db'

  const MAX_OPACITY = 0.5
  const MIN_OPACITY = 0.01

  function mapBetween (val, srcStart, srcEnd, outStart, outEnd) {
    return (val - srcStart) / (srcEnd - srcStart) * (outEnd - outStart) + outStart
  }

  export default {
    is: 'img-thumbnail',
    props: [
      'tracker',
      'photo',
      'lock'
    ],
    data () {
      return {
        loaded: false,
        isHovering: false,
      }
    },
    computed: {
      photoEmotion () {
        if (this.photo.emotion) {
          return this.photo.emotion
        }

        return 'unknown'
      },
      opacity () {
        if (this.photo.emotionValue) {
          return mapBetween(this.photo.emotionValue, 0, 1, MIN_OPACITY, MAX_OPACITY)
        }
        return MAX_OPACITY
      },
      overlayCtx () {
        return this.$refs.clmOverlay.getContext('2d')
      },
      photoDate () {
        if (!this.photo.timestamp) return ''

        return (moment(parseInt(this.photo.timestamp))).format('h:mm A MM/DD/YY')
      }
    },

    created () {
    },
    mounted () {
      this.loaded = new Promise(resolve => {
        this.$refs.image.onload = resolve
      }).then(() => this.isLoaded = true)
    },
    methods: {
      async startHover() {
        this.isHovering = true

        if (!this.isLoaded) {
          await this.loaded
        }

        this.startAnimation()
      },
      stopHover () {
        this.isHovering = false
        this.stopAnimation()
      },
      animate (box) {
        this.isDrawing = true
        this.tracker.start(this.$refs.image, box)
        this.drawLoop()
      },
      drawLoop () {
        const {clmOverlay} = this.$refs

        if (this.tracker.getCurrentPosition()) {
          this.overlayCtx.clearRect(0, 0, clmOverlay.width, clmOverlay.height)
          this.tracker.draw(clmOverlay)
        }

        this.drawRequest = requestAnimationFrame(this.drawLoop.bind(this))
      },
      stopAnimation () {
        const {clmOverlay} = this.$refs
        this.tracker.stop()
        this.tracker.reset()
        this.lock.release()
        cancelAnimationFrame(this.drawRequest)
        this.isDrawing = false
        this.overlayCtx.clearRect(0, 0, clmOverlay.width, clmOverlay.height)
      },
      async startAnimation () {
        await this.lock.acquire()
        // detect if tracker fails to find a face
        const evtHandler = (event, ...args) => {
          cleanup()
          this.stopAnimation()
        }

        const eventHandlers = {
          'clmtrackrConverged': evtHandler.bind(this),
          'clmtrackrIteration': evtHandler.bind(this),
          'clmtrackrLost': evtHandler.bind(this),
          'clmtrackrNotFound': evtHandler.bind(this),
        }

        const setupHandlers = () => {
          for (const [eventType, handler] of Object.entries(eventHandlers)) {
            this.$refs.root.addEventListener(eventType, handler, true)
          }
          console.log('Done handler setup')
        }

        const cleanup = () => {
          for (const [eventType, handler] of Object.entries(eventHandlers)) {
            this.$refs.root.removeEventListener(eventType, handler, true)
          }
          console.log('Done handler teardown')
        }

        setupHandlers()

        this.animate(this.photo.getFaceBox())
      },
    }
  }
</script>


