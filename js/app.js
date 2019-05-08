const {sort, map, curry, times, split, concat, compose, filter} = R;

const RINKEBY_ADDRESS   = '0xbf972fD0b929563407C249CBB00e33B4C83d49c3';

const getWeb3Provider = async () => new ethers.providers.JsonRpcProvider('https://staging-testnet.leapdao.org/rpc');

const reflect = p => p.then(v => ({v, status: "fulfilled" }), e => ({e, status: "rejected" }));

const getVideos = curry(async (provider) => {
  try {
    const unspents = await provider.send('plasma_unspent', ['', 49154]);
    console.log(unspents);


    const tasks = await map(async(raw) => {
      const unencodedIpfsHash   = raw.output.data;
      const cid                 = Base58.encode(convertToUint8Array(unencodedIpfsHash));
      console.log(unencodedIpfsHash, cid);
      const content   = await promiseTimeout(getMovieRepresentation(cid));
      const tokenId   = raw.output.value;
      const color     = raw.output.color;
      const owner     = raw.output.address;
      content.tokenId = tokenId;
      content.color   = color;
      content.owner   = owner;

      return content;
    }, unspents);

    const results = await Promise.all(tasks.map(reflect));
    const fulfilled = results.filter(x => x.status === "fulfilled");
    return map(movie => movie.v, fulfilled);

  } catch (error) {
    console.error(error.stack);
  }
});

const promiseTimeout = (promise) => {
  return new Promise(function(resolve, reject){
    const timer = setTimeout(() => {
      reject(new Error("promise timeout"));
    }, 3000);

    promise
    .then((res) => {
      clearTimeout(timer);
      resolve(res);
    })
    .catch((err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
};

const getMovieRepresentation = async(cid) => {
  return new Promise(async(resolve, reject) => {
    const response = await fetch('https://ipfs.infura.io/ipfs/' + cid);
    const json = await response.json();
    return resolve(json)
  });
};

const convertToUint8Array = (inputAsHexString) => {
  const result    = [];
  const noPrefix  = inputAsHexString.slice(2);
  const d2h       = d => (+d).toString(16);
  const ALGO      = '12';

  const hexStringToByte = (str) => {
    if (!str) { return new Uint8Array(); }
    const a = [];
    for (let i = 0, len = str.length; i < len; i+=2) {
      a.push(parseInt(str.substr(i,2),16));
    }
    return new Uint8Array(a).length;
  };

  const s = ALGO + d2h(hexStringToByte(noPrefix)) + noPrefix;

  for(let i = 0; i < s.length; i+=2) {
    result.push(parseInt(s.substring(i, i + 2), 16));
  }
  return Uint8Array.from(result)
};


const propSelector = (movies) => map((movie) => {
  return ({
    owner: movie.owner,
    tokenid: movie.tokenId,
    title: movie.name,
    video: movie.movie.mp4,
    poster: movie.image,
    created: movie.created
  });
}, movies);

const sortMovies = sort((a,b) => b.created - a.created);

1557230241
1557317963
1557317093
1557229970286
1557319732


const haveCreatedProp = movie => {
  if(movie.created) console.log(movie.title, movie.created);
  return movie.created && movie.created !== 1557229970286;
};

const filterMovies = filter(haveCreatedProp)

const createUiModel = compose(sortMovies, filterMovies, propSelector);

const getSiblings = (elem) => {
  var siblings = [];
  var sibling = elem.parentNode.firstChild;
  while (sibling) {
    if (sibling.nodeType === 1 && sibling !== elem) {
      siblings.push(sibling);
    }
    sibling = sibling.nextSibling
  }
  return map(sibling => sibling.value, siblings);
};

Vue.directive('init-video', {
  bind: function(item) {
    const onPlay = (item) => {
      const siblings = getSiblings(item.target);
      const [title, poster, owner, tokenId] = siblings;
      window.dispatchEvent(new CustomEvent("wr-video-play", {detail: { title, poster, owner, tokenId }}));
    };

    item.onplay = onPlay;
    item.onloadedmetadata = onPlay;

    setTimeout(() => {
      console.log ('pause');
      item.pause();
    },7000)
  }
});

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
        console.log("video", video);
        this.existPlugin();
        this.popup.video = video;
        this.popup.on = true;
        this.existPluginVal = true;
      },
      removePopup: function () {
        this.popup.on = false;
      },
      existPlugin: function () {
        console.log('whiterabbit plugin PING!');
        window.dispatchEvent(new CustomEvent("wr-exist-plugin",{q:'exist-plugin'}));
      },
      eventExistPlugin: function () {
        window.addEventListener("wr-message", (e) => {
          console.log('whiterabbit plugin PONG' , e.detail);
          if (e.detail.sataus == 200) this.existPluginVal = true;
          else this.existPluginVal = false;

          if(e.detail.sataus == 200 && e.detail.wr_pay_movie != undefined) {
            console.log('pay', e.detail.wr_pay_movie.title);
            const input = document.querySelector('.popup-inner input[name="video_title"]');
            if (input && input.value.toString().length > 0) {
              const video = document.querySelector('.popup-inner video');
              if(video) video.play();
            }
          }
        } ,false);
      },
      initWeb3Provider: async function () {
        window.addEventListener('load', async () => {
          try {
            const provider    = await getWeb3Provider();
            const movies      = await getVideos(provider);
            console.log("movies: ", movies);
            this.videos       = concat(this.videos, createUiModel(movies));
          } catch (error) {
            console.error(error.stack);
          }
        });
      }
    }
});
