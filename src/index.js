// import { getDefaultSettings } from "http2";

// const Vue = require('vue');
// const Vuex = require('vuex');

// Vue.use(Vuex);

const baseurl = 'https://acm.cs.uic.edu/~wtoher/cgi-bin/iago.py';
const allusersurl = 'https://acm.cs.uic.edu/~wtoher/cgi-bin/iago.py?get=users&id=all&select=all&filter=all';

const store = new Vuex.Store({
  state: {
    users: [],
  },
  mutations: {
    getData() {
      const self = this;
      const req = new XMLHttpRequest();
      req.onreadystatechange = () => {
        if (req.readyState === XMLHttpRequest.DONE) {
          if (req.status === 200) {
            const j = JSON.parse(req.responseText);
            self.state.users = j.payload.sort((a, b) => b.rating - a.rating);
            console.log('Users loaded');
          } else if (req.status === 0) {
            console.log('Turn off your script blocker, dummy');
          } else {
            console.log(req.body);
          }
        }
      };
      req.open('GET', allusersurl, true);
      // TODO: Figure out CORS
      // req.setRequestHeader('Access-Control-Allow-Origin', '*');
      req.send();
    },
  },
});

const leaderboard = new Vue({
  el: '#leaderboard',
  data: {
    message: 'Test!',
  },
  computed: {
    users() { return store.state.users; },
  },
  mounted() {
    console.log('Running mounted...');
    store.commit('getData');
  },
  methods: {
  },
});

const gameform = new Vue({
  el: '#gameform',
  data: {
    whiteplayer: '',
    blackplayer: '',
  },
  computed: {
    users() { return store.state.users; },
  },
  methods: {},
});

const userform = new Vue({
  el: '#userform',
  data: {
    name: '',
    rating: 1000,
  },
  methods: {
    submit() {
      if (this.name !== '') {
        /* const form = new FormData();
        form.append('post', 'user');
        form.append('name', this.name);
        form.append('rating', this.rating); */
        this.$http.post(baseurl, {
          post: 'user',
          name: this.name,
          rating: this.rating,
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          emulateJSON: true,
        })
          .then((res) => {
            // console.log(res.status);
            // console.log(res.statusText);
            // console.log(res.body);
            store.commit('getData');
          });
      }
    },
  },
});

Vue.component('leaderboard-user', {
  props: {
    user: {
      type: Object,
      required: true,
    },
  },
  template: '<li>{{user.username}}: {{user.rating}}</li>',
});
