export default class OvertimeImage {
  constructor ({id, photoId, data }) {
    if (id) {
      this.id = id
    }
    this.data = data
    this.photoId = photoId
  }
}
