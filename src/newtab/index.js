import Vue from 'vue'
import AsyncComputed from 'vue-async-computed'
import root from './root.vue'

Vue.use(AsyncComputed)

Vue.config.productionTip = false
/* eslint-disable no-new */
new Vue({
  el: '#root',
  render: h => h(root),
  components: {

  }
})
