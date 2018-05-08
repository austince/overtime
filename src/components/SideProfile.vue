<style scoped lang="scss">
    @import '../base';

    $photo-width: 75%;

    .profile {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        // vertically centered
        align-items: center;
        justify-content: center;
    }

    img.placeholder {
        width: 50%;
        filter: invert(100%); // make it white
    }

    .photo {
        position: relative;
        width: $photo-width;
        box-shadow: 0 0 50px $black;

        img {
            // Todo: Portrait, need to resize image, center on face
            /*height: 30%;*/
            /*width: 24%;*/
            width: 100%;
        }
    }

    .photo-details {
        @include text-border($text-border-width * 2);

        position: absolute;
        width: 100%;
        text-align: center;
        text-transform: uppercase;
        bottom: 0;
        margin: 0;

        p {
            padding: 8px;
        }
    }

    .profile-details {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        max-width: 75%;
        text-align: left;

        @media only screen and (min-width: map-get($grid-breakpoints, "sm")) {
            max-width: 95%;
        }

        .row {
            margin: 0 4px;
            @include text-border($text-border-width * 2);
        }

        input[type=text] {
            // @include text-border($text-border-width * 2);
            padding: 8px;
            margin: 8px auto 16px;
            display: inline-block;
            text-align: center;
            text-transform: uppercase;
            border-width: 4px;

            @media only screen and (min-width: map-get($grid-breakpoints, "sm")) {
                max-width: 75%;
            }

            @media only screen and (min-width: map-get($grid-breakpoints, "md")) {
                max-width: 50%;
            }
        }

        input[type=text],
        input[type=text]:focus {
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
                    <p v-if="photo.emotion">{{photo.emotion}}</p>
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
                   maxlength="14"
                   placeholder="You?"
                   v-model="name"
                   @change="saveName"/>
            <article class="container-fluid">
                <template v-for="emotion in sinceEmotions">
                    <div v-if="emotion"
                         class="row">
                        <h3 class="difference col-md-5 col-sm-6 text-white font-weight-bold text-uppercase">
                            {{emotion.since}}
                        </h3>
                        <div class="col-md-1 hidden-sm-and-down"></div>
                        <h4 class="col-md-6 col-sm-6 text-white">since {{emotion.emotion}}</h4>
                    </div>
                </template>
            </article>

        </section>
    </main>
</template>

<script>
  import chromep from 'chrome-promise'
  import moment from 'moment'
  import {PhotosDB} from '../util/db'

  const NAME_KEY = 'name'

  export default {
    is: 'SideProfile',
    props: [
      'photo'
    ],
    data () {
      return {
        name: '',
      }
    },
    computed: {
      photoDate () {
        if (!this.photo.timestamp) return ''

        return (moment(parseInt(this.photo.timestamp))).format('h:mm A MM/DD/YY')
      }
    },
    asyncComputed: {
      async sinceEmotions () {
        const emotions = ['happy', 'sad', 'surprised', 'angry']

        return Promise.all(emotions.map(async emotion => {
          const mostRecentPhoto = await PhotosDB
            .where('emotion').equals(emotion)
            .limit(1)
            .reverse()
            .sortBy('timestamp')

          if (mostRecentPhoto.length >= 0 && typeof mostRecentPhoto[0] !== 'undefined') {
            const mostRecentDate = moment(parseInt(mostRecentPhoto[0].timestamp))
            const takenAt = moment.duration(moment().diff(mostRecentDate))
            const days = Math.floor(takenAt.asDays())
            return {
              since: `${days} ${days === 1 ? 'day' : 'days'}`,
              sinceDays: days,
              emotion,
            }
          }


        }))

        // return [
        //   {since: 10, emotion: 'sad'},
        //   {since: 0, emotion: 'happy'},
        //   {since: 15, emotion: 'angry'},
        //   {since: 8, emotion: 'surprised'},
        // ]
      },
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
          this.name = ''
        }
      },
      async saveName () {
        const res = await chromep.storage.local.set({[NAME_KEY]: this.name})
      }
    },
  }
</script>
