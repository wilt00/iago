// import { getDefaultSettings } from "http2";

// const Vue = require('vue');
// const Vuex = require('vuex');

// Vue.use(Vuex);

const baseurl = 'https://acm.cs.uic.edu/~wtoher/cgi-bin/iago.py';
const allusersurl = 'https://acm.cs.uic.edu/~wtoher/cgi-bin/iago.py?get=users&id=all&select=all&filter=all';

const store = new Vuex.Store({
  state: {
    users: [],
    games: [],
  },
  mutations: {
    getUsers() {
      const self = this;
      const req = new XMLHttpRequest();
      req.onreadystatechange = () => {
        if (req.readyState === XMLHttpRequest.DONE) {
          if (req.status === 200) {
            const j = JSON.parse(req.responseText);
            self.state.users = j.payload.sort((a, b) => b.rating - a.rating);
          }
        }
      };
      req.open('GET', allusersurl, true);
      // TODO: Figure out CORS
      // req.setRequestHeader('Access-Control-Allow-Origin', '*');
      req.send();
    },
    getGames() {
      const self = this;
      const req = new XMLHttpRequest();
      req.onreadystatechange = () => {
        if (req.readyState === XMLHttpRequest.DONE) {
          if (req.status === 200) {
            const j = JSON.parse(req.responseText);
            self.state.games = j.payload;
          }
        }
      };
      req.open('GET', `${baseurl}?get=games`);
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
    store.commit('getUsers');
  },
  methods: {
  },
});

const gameform = new Vue({
  el: '#gameform',
  data: {
    blackid: '',
    whiteid: '',
    result: '',
    blackscore: '',
    whitescore: '',
  },
  computed: {
    users() { return store.state.users; },
  },
  methods: {
    submitGame() {
      if (this.blackid !== '' && this.whiteid !== '' && this.result !== '') {
        this.$http.post(baseurl, {
          post: 'game',
          blackid: this.blackid,
          whiteid: this.whiteid,
          result: this.result,
          blackscore: (this.blackscore === '') ? -1 : this.blackscore,
          whitescore: (this.whitescore === '') ? -1 : this.whitescore,
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
            store.commit('getUsers');
          });
      }
    },
  },
});

const userform = new Vue({
  el: '#userform',
  data: {
    name: '',
    rating: 1000,
  },
  methods: {
    submitUser() {
      if (this.name !== '') {
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
            store.commit('getUsers');
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
