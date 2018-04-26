<template>
    <main>
        <section class="commands">
            <button @click="deleteAllPhotos">Delete All Photos?</button>
        </section>
    </main>
</template>

<style lang="scss">
    .commands {
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>


<script>
  import chromep from 'chrome-promise'
  import {PhotosDB} from '../util/db'

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
        const btn = event.target
        btn.disabled = true

        btn.innerText = 'Deleting...'

        await Promise.all([
          PhotosDB.clear(),
          chromep.storage.local.clear(),
        ])

        btn.innerText = 'Deleted!'
      }
    }
  }
</script>

