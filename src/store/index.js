import { createStore } from 'vuex'
import axios from 'axios'

export default createStore({
  state: {
    PROJECT_ID: 'SKp7JJZtiSBUDlSaozTblicBuQVx4XIiHV',
    PROJECT_SECRET: 'eUg5N3l6V1dvNWxHNHo5Mk0zWmc4MW1lYUtQN0Y5VXk=',
    BASE_URL: 'https://api.stringee.com/v1/room2'
  },
  mutations: {
  },
  actions: {
    async createRoom (context) {
      const roomName = Math.random().toFixed(4)
      const response = await axios.post(
        `${context.state.BASE_URL}/create`,
        {
          name: roomName,
          uniqueName: roomName
        },
        { headers: { 'X-STRINGEE-AUTH': sessionStorage.getItem('rest-token') } }
      )

      const room = response.data
      return room
    },
    async listRoom (context) {
      const response = await axios.get(`${context.state.BASE_URL}/list`,
        { headers: { 'X-STRINGEE-AUTH': sessionStorage.getItem('rest-token') } })

      const rooms = response.data.list
      return rooms
    },
    async deleteRoom (context, roomId) {
      const response = await axios.put(`${context.state.BASE_URL}/delete`, { roomId },
        { headers: { 'X-STRINGEE-AUTH': sessionStorage.getItem('rest-token') } })

      return response.data
    },
    async clearAllRooms (context) {
      const rooms = await context.actions.listRoom()
      const response = await Promise.all(rooms.map(room => this.dispatch('deleteRoom', room.roomId)))

      return response
    },

    async setRestToken (context) {
      const tokens = await this.dispatch('_getToken', { rest: true }) // ._getToken({ rest: true })
      const restToken = tokens.rest_access_token

      sessionStorage.setItem('rest-token', restToken)

      return restToken
    },

    async getUserToken (context, userId) {
      const tokens = await this.dispatch('_getToken', { userId })
      return tokens.access_token
    },

    async getRoomToken (context, roomId) {
      const tokens = await this.dispatch('_getToken', { roomId })
      return tokens.room_token
    },
    async _getToken (context, { userId, roomId, rest }) {
      const response = await axios.get(
        'https://v2.stringee.com/web-sdk-conference-samples/php/token_helper.php',
        {
          params: {
            keySid: context.state.PROJECT_ID,
            keySecret: context.state.PROJECT_SECRET,
            userId,
            roomId,
            rest
          }
        }
      )

      const tokens = response.data
      return tokens
    }
  },
  modules: {
  }
})
