const videos = [
    {
        title: 'Superfast',
        video: './video/Superfast.mp4',
        poster: 'https://images-na.ssl-images-amazon.com/images/M/MV5BNjM3MjQxNjkxM15BMl5BanBnXkFtZTgwMDIyMTA0NDE@._V1_SX300.jpg'
    },
    {
        title: 'WAR BOOK',
        video: './video/WAR BOOK.mp4',
        poster: 'https://images-na.ssl-images-amazon.com/images/M/MV5BMjI2MDA2ODY1Ml5BMl5BanBnXkFtZTgwNDA0NzcyNDE@._V1_SX300.jpg'
    },
    {
        title: 'Paterson',
        video: './video/Paterson_DomTrlr1_1080p_H264_Ch1&2-Stereo.mp4',
        poster: 'https://images-na.ssl-images-amazon.com/images/M/MV5BMTUzODA4Nzk0OF5BMl5BanBnXkFtZTgwNzE1MDIwMDI@._V1_SX300.jpg'
    },
    {
        title: 'Born to be Blue',
        video: './video/Born to be Blue.mp4',
        poster: 'https://images-na.ssl-images-amazon.com/images/M/MV5BMjI3NTk0OTM5OF5BMl5BanBnXkFtZTgwOTMxMTE5NzE@._V1_SX300.jpg'
    },
    {
        title: 'The Reluctant Fundamentalist',
        video: './video/The Reluctant Fundamentalist.mp4',
        poster: 'https://images-na.ssl-images-amazon.com/images/M/MV5BNzAzNjg3Mzg1Nl5BMl5BanBnXkFtZTcwOTUzNzExOQ@@._V1._CR25,27.166671752929688,1347,1995.9999542236328_SY132_CR0,0,89,132_AL_.jpg_V1_SX300.jpg'
    },
    {
        title: 'Cutie And The Boxer',
        video: './video/Cutie And The Boxer.mp4',
        poster: 'https://images-na.ssl-images-amazon.com/images/M/MV5BMjEyNzgyMjUzNl5BMl5BanBnXkFtZTcwODk3NjQyOQ@@._V1_SX300.jpg'
    },
    {
        title: 'Dancing In Jaffa',
        video: './video/Dancing_In_Jaffa_Trailer.mp4',
        poster: 'https://images-na.ssl-images-amazon.com/images/M/MV5BMTgzMzU0MDQ5Nl5BMl5BanBnXkFtZTgwMzUyNDQ0MTE@._V1_SX300.jpg'
    },
    {
        title: 'Next Goal Wins',
        video: './video/Next Goal Wins.mp4',
        poster: 'https://images-na.ssl-images-amazon.com/images/M/MV5BMjI3ODcxOTExNl5BMl5BanBnXkFtZTgwOTU0NTg1MTE@._V1_SX300.jpg'
    },
    {
        title: 'Night Train To Lisbon',
        video: './video/Night Train To Lisbon.mp4',
        poster: 'https://ia.media-imdb.com/images/M/MV5BNDE5OTkxNzMxNl5BMl5BanBnXkFtZTgwMjQ4NjY3MDE@._V1_SX300.jpg'
    },
    {
        title: 'One More Time',
        video: './video/One More Time.mp4',
        poster: 'https://images-na.ssl-images-amazon.com/images/M/MV5BMjAxMTk0MTUxNV5BMl5BanBnXkFtZTgwNTY0MjAzODE@._V1_SX300.jpg'
    },
];

Vue.directive('init-video', {
  bind: function(items) {
    var Video = {
      onPlay: function(e) {
        var title = Video.getTitle(e.target);
        var poster = Video.getPoster(e.target);
        Video.postMessage(title, poster);
      },
      onPause: function() {
        console.log("The video paused");
      },
      getPoster: function (el) {
        return el.nextSibling.nextSibling.nextElementSibling.value;
      },
      getTitle: function (el) {
        return el.nextSibling.nextElementSibling.value;
      },
      postMessage: function (title, poster) {
        console.log('sending customEvent', title, poster)
        window.dispatchEvent(new CustomEvent("wr-video-play", {detail: { title: title, poster: poster }}));
      }
    };

    items.onplay = Video.onPlay;
    items.onpause = Video.onPause;
    items.onloadedmetadata = Video.onPlay;
  }
});

const ABI = [
  "function tokenByIndex(uint256 index) public view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function totalSupply() public view returns (uint256)"
];

const ADDRESS = "0x1864b231f4fd1baa9f334150900fb9af6103526c";

const getWeb3Provider = async(web3) => {
  if(web3) {
    return new ethers.providers.Web3Provider(web3.currentProvider);
  } else {
    throw new Error('web3 not in scope');
  }
};

const getContract = R.curry((abi, address, provider) => new ethers.Contract(address, abi, provider));
const getVideoContract = getContract(ABI, ADDRESS);

const getVideoUris = R.curry(async (contract) => {
  const totalSupply   = await contract.totalSupply();
  const indexes       = await R.times(contract.tokenByIndex ,totalSupply)
  const movieIds      = R.map((id) => id.toNumber(), await Promise.all(indexes));
  const allMovies     = R.map(id => contract.tokenURI(id), movieIds);
  return await Promise.all(allMovies);
});

const createUiModel = (movieUris) => R.map((uri) => {
  const parts = R.split('#', uri);
  return ({
    title: parts[1],
    video: '',
    poster: 'https://images-na.ssl-images-amazon.com/images/M/MV5BMjAxMTk0MTUxNV5BMl5BanBnXkFtZTgwNTY0MjAzODE@._V1_SX300.jpg'
  });
}, movieUris);

var app = new Vue({
    el: '#app',
    data: {
      existPluginVal:false,
      videos: [],
      popup: {
          on:false,
          video:{}
      },

    },
    mounted: async function () {
      this.eventExistPlugin();
      this.existPlugin();
      this.initWeb3Provider();
    },
    methods: {
        getPopup: function (video) {
            this.existPlugin();
            this.popup.video = video;
            this.popup.on = true;
            this.existPluginVal = true;
        },
        existPlugin: function () {
            console.log ('whiterabbit plugin PING!');
            window.dispatchEvent(new CustomEvent("wr-exist-plugin",{q:'exist-plugin'}));
        },
        eventExistPlugin: function () {
          var self = this;
          window.addEventListener("wr-message", function (e) {
              console.log ('whiterabbit plugin PONG' , e.detail);
              if (e.detail.sataus == 200) self.existPluginVal = true;
              else self.existPluginVal = false;
          } ,false);
        },
        initWeb3Provider: async function () {
          window.addEventListener('load', async () => {
            if (window.web3) {
              const provider    = await getWeb3Provider(window.web3);
              const contract    = await getVideoContract(provider)
              const movieUris   = await getVideoUris(contract);
              this.videos       = R.concat(this.videos, createUiModel(movieUris));
            }
            else {
              console.error('Non-Ethereum browser detected. You should consider trying MetaMask!');
            }
          });
        }
    }
});
