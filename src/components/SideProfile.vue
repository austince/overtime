<style scoped lang="scss">
    @import '../base';

    .profile {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        // vertically centered
        align-items: center;
        justify-content: center;
    }

    $photo-width: 75%;
    .photo {
        position: relative;
        width: $photo-width;

        img {
            // Todo: Portrait, need to resize image, center on face
            /*height: 30%;*/
            /*width: 24%;*/
            width: 100%;
        }
    }

    img.placeholder {
        width: 50%;
    }

    .photo-details {
        position: absolute;
        width: 100%;
        text-align: center;
        text-transform: uppercase;
        bottom: 0;
        margin: 0;

        p {
            background: $black;
            padding: 8px;
        }
    }

    .profile-details {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        max-width: 75%;
        text-align: center;

        input[type=text],
        input[type=text]:focus {
            width: 100%;
            padding: 12px 16px;
            margin: 8px 0;
            display: inline-block;
            border: none;
            text-transform: uppercase;
            text-align: center;
            background-color: $transparent;
            outline-color: $transparent;
        }
    }
</style>

<template>
    <main class="profile">
        <template v-if="photo.data">
            <section class="photo">
                <img :src="photo.data"/>
                <article class="photo-details text-white h5">
                    <p>{{photo.emotion}}</p>
                    <p>{{photoDate}}</p>
                </article>
            </section>

        </template>
        <template v-else>
            <img class="placeholder" src="/svg/iconmonstr-user-o.svg"/>
        </template>


        <section class="profile-details">
            <input class="name h1 text-white font-weight-bold"
                   type="text"
                   v-model="name"
                   @change="saveName"/>
            <template v-for="emotion in averageEmotions">
                <p class="h2 text-white"><b class="text-uppercase">{{emotion.days}} days</b> since {{emotion.emotion}}
                </p>
            </template>
        </section>
    </main>
</template>

<script>
  import chromep from 'chrome-promise'
  import moment from 'moment'

  const NAME_KEY = 'name'

  export default {
    is: 'SideProfile',
    props: [
      'photo'
    ],
    data () {
      return {
        name: ''
      }
    },
    computed: {
      averageEmotions () {
        return [
          {days: 10, emotion: 'sad'},
          {days: 0, emotion: 'happy'},
          {days: 15, emotion: 'angry'},
          {days: 8, emotion: 'surprised'},
        ]
      },
      photoDate () {
        if (!this.photo.timestamp) return ''

        return (moment(parseInt(this.photo.timestamp))).format('h:mm A MM/DD/YY')
      }
    },
    asyncComputed: {
      // async name () {
      //   const res = await chromep.storage.local.get([NAME_KEY])
      //   if (res[NAME_KEY]) {
      //     return res[NAME_KEY]
      //   }
      //
      //   return 'you'
      // }
    },
    created () {
      this.loadName()
    },
    mounted () {
    },
    methods: {
      async loadName () {
        const res = await chromep.storage.local.get([NAME_KEY])
        if (res[NAME_KEY]) {
          this.name = res[NAME_KEY]
        } else {
          this.name = 'you'
        }
      },
      async saveName () {
        const res = await chromep.storage.local.set({[NAME_KEY]: this.name})
        console.log('Saved name!', this.name, res)
      }
    },
  }
</script>
