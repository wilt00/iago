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
            self.state.games = j.payload.map((val) => {
              const newval = val;
              newval.blackWin = (val.result === 1);
              newval.whiteWin = (val.result === 2);
              newval.draw = (!val.blackWin) && (!val.whiteWin);
              return newval;
            });
          }
        }
      };
      req.open('GET', `${baseurl}?get=games`);
      req.send();
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
            store.commit('getGames');
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
    getUser(id) {
      const user = this.users.find(elem => elem.userid === id);
      if (user === undefined) {
        return {
          name: 'Undefined',
          rating: '0',
        };
      }
      return user;
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

Vue.component('game-row', {
  props: {
    game: {
      type: Object,
      required: true,
    },
  },
  computed: {
    blackuser() {
      return store.state.users.find(elem => elem.userid === this.game.blackid);
    },
    whiteuser() {
      return store.state.users.find(elem => elem.userid === this.game.whiteid);
    },
    result() {
      switch (this.game.result) {
        case 1: return 'Black';
        case 2: return 'White';
        case 3: return 'Draw';
        default: return 'Indeterminate';
      }
    },
  },
  template: `
      <td>{{blackuser.username}}</td>
      <td>{{whiteuser.username}}</td>`,
});
