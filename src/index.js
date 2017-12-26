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

const app = new Vue({
  el: '#app',
  data: {
    message: 'New app object!',
    newuser: {
      name: '',
      rating: 1000,
    },
    newgame: {
      blackid: '',
      whiteid: '',
      result: '',
      blackscore: '',
      whitescore: '',
    },
  },
  computed: {
    users() { return store.state.users; },
    games() { return store.state.games; },
  },
  mounted() {
    store.commit('getUsers');
    store.commit('getGames');
  },
  methods: {
    clearGame() {
      this.newgame = {
        blackid: '',
        whiteid: '',
        result: '',
        blackscore: '',
        whitescore: '',
      };
    },
    clearUser() {
      this.newuser = {
        name: '',
        rating: 1000,
      };
    },
    submitGame() {
      if (this.newgame.blackid !== '' && this.newgame.whiteid !== '' && this.newgame.result !== '') {
        this.$http.post(baseurl, {
          post: 'game',
          blackid: this.newgame.blackid,
          whiteid: this.newgame.whiteid,
          result: this.newgame.result,
          blackscore: (this.newgame.blackscore === '') ? -1 : this.newgame.blackscore,
          whitescore: (this.newgame.whitescore === '') ? -1 : this.newgame.whitescore,
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
            this.clearGame();
          });
      }
    },
    submitUser() {
      if (this.newuser.name !== '') {
        this.$http.post(baseurl, {
          post: 'user',
          name: this.newuser.name,
          rating: this.newuser.rating,
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
            this.clearUser();
          });
      }
    },
  },
});

/*
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
*/

Vue.component('leaderboard-user', {
  props: {
    user: {
      type: Object,
      required: true,
    },
  },
  template: '<li>{{user.username}}: {{user.rating}}</li>',
});
