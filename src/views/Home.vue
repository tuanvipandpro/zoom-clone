<template>
  <div class="home">
    <h1>Clone Zoom - Meeting Online</h1>
    <!-- <p>{{roomId}} </p>
    <p>{{roomToken}}</p> -->

    <el-button v-if="!roomId" @click="createRoom">Create Room</el-button>
    <el-button v-if="!roomId" @click="joinRoom">Join Room</el-button>
    <el-button v-else @click="publishVideo(true)">Share Screen</el-button>

    <div id="share" v-if="roomId">
      <p>Share Link : <el-link :href="roomUrl" type="success">{{ roomUrl }}</el-link></p>
      <p>Room Id: {{ roomId }}</p>
    </div>
   <div id="video-container"></div>
  </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue'
// eslint-disable-next-line no-unused-vars
import vuex from 'vuex'

export default {
  name: 'Home',
  data () {
    return {
      userToken: '',
      roomToken: '',
      roomId: '',
      room: undefined,
      client: undefined
    }
  },
  computed: {
    roomUrl () {
      return `https://${location.hostname}/zoom-clone?room=${this.roomId}`
    }
  },
  mounted () {
    this.$store.dispatch('setRestToken')

    const urlParams = new URLSearchParams(location.search)
    const roomId = urlParams.get('room')

    if (roomId) {
      this.roomId = roomId
      this.joinRoom()
    }
  },
  methods: {
    fakeLogin () {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve, reject) => {
        const userId = `${(Math.random() * 100000).toFixed(6)}`
        const userToken = await this.$store.dispatch('getUserToken', userId)

        this.userToken = userToken

        // eslint-disable-next-line no-undef
        const client = new StringeeClient()
        client.on('authen', (result) => {
          resolve(result)
        })
        client.connect(userToken)

        this.client = client
      })
    },
    async createRoom () {
      const room = await this.$store.dispatch('createRoom')
      const roomToken = await this.$store.dispatch('getRoomToken', room.roomId)

      this.roomId = room.roomId
      this.roomToken = roomToken

      await this.fakeLogin()
      await this.publishVideo()
    },
    async joinRoom (showPrompt = false) {
      if (showPrompt) {
        const roomId = prompt('Enter Room ID : ')

        if (!roomId) return

        this.roomId = roomId
      }

      const roomToken = await this.$store.dispatch('getRoomToken', this.roomId)

      this.roomToken = roomToken

      await this.fakeLogin()
      await this.publishVideo()
    },
    async publishVideo (shareScreen = false) {
      // eslint-disable-next-line no-undef
      const localTrack = await StringeeVideo.createLocalVideoTrack(this.client, {
        audio: true,
        video: true,
        screen: shareScreen,
        videoDimension: { width: 640, height: 360 }
      })

      const video = localTrack.attach()
      this.addVideo(video)

      // eslint-disable-next-line no-undef
      const roomData = await StringeeVideo.joinRoom(this.client, this.roomToken)
      const room = roomData.room

      this.room = room
      room.clearAllOnMethos()

      room.on('addtrack', async e => {
        const trackInfo = e.info.track

        if (trackInfo.serverId === localTrack.serverId) return

        await this.subscribeTrack(trackInfo)
      })

      room.on('removetrack', e => {
        if (!e.track) return
        e.track.detach().forEach(item => item.remove())
      })

      roomData.listTracksInfo.forEach(i => this.subscribeTrack(i))
      room.publish(localTrack)
    },
    async subscribeTrack (trackInfo) {
      const track = await this.room.subscribe(trackInfo.serverId)

      track.on('ready', () => this.addVideo(track.attach()))
    },
    addVideo (video) {
      video.setAttribute('controls', 'true')
      video.setAttribute('playsinline', 'true')
      document.querySelector('#video-container').appendChild(video)
    }
  }
}
</script>
