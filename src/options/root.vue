<template>
    <main>
        <section class="commands">
            <button ref="deleteBtn" @click="deleteAllPhotos">Delete All Photos?</button>
        </section>
    </main>
</template>

<style lang="scss">
    @import '../reset';

    .commands {
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>


<script>
  import chromep from 'chrome-promise'
  import {PhotosDB, ImagesDB} from '../util/db'

  export default {
    data () {
      return {}
    },
    computed: {},
    created () {
    },
    mounted () {
    },
    methods: {
      async deleteAllPhotos (event) {
        event.preventDefault()

        this.$refs.deleteBtn.disabled = true
        this.$refs.deleteBtn.innerText = 'Deleting...'

        await Promise.all([
          PhotosDB.clear(),
          ImagesDB.clear(),
          chromep.storage.local.clear(),
        ])

        this.$refs.deleteBtn.innerText = 'Deleted!'
      }
    }
  }
</script>

