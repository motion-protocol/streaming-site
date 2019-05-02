const {map, curry, times, split, concat} = R;

const RINKEBY_ADDRESS   = '0xbf972fD0b929563407C249CBB00e33B4C83d49c3';
const ipfs              = window.IpfsHttpClient('ipfs.infura.io', '5001', {protocol: 'https'});

const getWeb3Provider = async () => new ethers.providers.JsonRpcProvider('https://staging-testnet.leapdao.org/rpc');

const getVideos = curry(async (provider) => {
  try {
    const unspents = await provider.send('plasma_unspent', ['', 49153]);
    console.log("unspents: ", unspents);
    const result = await map(async(raw) => {
      const unencodedIpfsHash   = raw.output.data;
      const cid                 = Base58.encode(convertToUint8Array(unencodedIpfsHash));
      const content             = await JSON.parse((await getMovieRepresentation(ipfs, cid)));
      const tokenId   = raw.output.value;
      const color     = raw.output.color;
      const owner     = raw.output.address;
      content.tokenId = tokenId;
      content.color   = color;
      content.owner   = owner;
      return content;
    }, unspents);

    return await Promise.all(result);
  } catch (error) {
    console.error(error.stack);
  }
});

const getMovieRepresentation = (provider, cid) => {
  return new Promise((resolve, reject) => {
    provider.get(cid, (err, files) => {
      if(err) { reject(err) };
      resolve(files[0].content.toString('utf8'));
    });
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

const createUiModel = (movies) => R.map((movie) => {
  return ({
    owner: movie.owner,
    tokenid: movie.tokenId,
    title: movie.name,
    video: movie.movie.mp4,
    poster: movie.image
  });
}, movies);

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

    setTimeout(() => {
      console.log ('pause');
      item.pause();
    },2000)
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
        } ,false);
      },
      initWeb3Provider: async function () {
        window.addEventListener('load', async () => {
          try {
            const provider    = await getWeb3Provider();
            const movies      = await getVideos(provider);
            this.videos       = concat(this.videos, createUiModel(movies));
          } catch (error) {
            console.error(error.stack);
          }
        });
      }
    }
});
