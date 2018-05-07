<style scoped lang="scss">
    @import '../base';

    $happy: material-color('green', '500');
    $sad: material-color('indigo', '500');
    $surprised: material-color('yellow', '500');
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
             @mouseenter="startAnimation"
             @mouseleave="stopTracking">
        <div :class="[photoEmotion, 'overlay']"
             :style="{ opacity: opacity }">
        </div>
        <canvas ref="clmOverlay"></canvas>
        <img :src="photo.data"
             ref="image"/>
    </section>
</template>

<script>
  const MAX_OPACITY = 0.5
  const MIN_OPACITY = 0.01

  function mapBetween (val, srcStart, srcEnd, outStart, outEnd) {
    return (val - srcStart) / (srcEnd - srcStart) * (outEnd - outStart) + outStart
  }

  export default {
    is: 'img-thumbnail',
    props: [
      'tracker',
      'photo'
    ],
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
        return MIN_OPACITY
      },
    },
    data () {
      return {}
    },
    created () {
        this.loaded = false
    },
    mounted () {
      this.loaded = new Promise(resolve => {
        this.$refs.image.onload = resolve
      }).then(() => this.isLoaded = true)

      this.overlayCtx = this.$refs.clmOverlay.getContext('2d')
    },
    methods: {
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
      stopAnimation() {
        this.tracker.stop()
        cancelAnimationFrame(this.drawRequest)
        this.isDrawing = false
      },
      async startAnimation () {
        if (!this.isLoaded) {
          await this.loaded
        }

        // detect if tracker fails to find a face
        document.addEventListener('clmtrackrNotFound', (event) => {
          this.stopAnimation()
        }, false)

        // detect if tracker loses tracking of face
        document.addEventListener('clmtrackrLost', (event) => {
          this.stopAnimation()
        }, false)

        // detect if tracker has converged
        document.addEventListener('clmtrackrConverged', (event) => {
          this.stopAnimation()
        }, false)

        this.animate(this.photo.getFaceBox())
      },
      stopTracking () {
        this.isDrawing = false
      }
    }
  }
</script>


