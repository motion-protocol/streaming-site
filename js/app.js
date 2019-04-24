const {map, curry, times, split, concat} = R;

const ABI = [
  "function tokenByIndex(uint256 index) public view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function totalSupply() public view returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address owner)"
];

const GOERLI_ADDRESS    = '0x1864b231f4fd1baa9f334150900fb9af6103526c';
const RINKEBY_ADDRESS   = '0xbf972fD0b929563407C249CBB00e33B4C83d49c3';
const LOCALHOST_ADDRESS = ''; // UPDATE

const getWeb3Provider = async(web3) => {
  return new ethers.providers.JsonRpcProvider('https://staging-testnet.leapdao.org/rpc');
};

console.log(typeof window.IpfsHttpClient)

const ipfs = window.IpfsHttpClient('ipfs.infura.io', '5001', {protocol: 'https'});

console.log('ipfs: ', ipfs);

const getContract = curry((abi, address, provider) => new ethers.Contract(address, abi, provider));

const getVideoGoerliContract    = getContract(ABI, GOERLI_ADDRESS);
const getVideoRinkebyContract   = getContract(ABI, RINKEBY_ADDRESS);
const getVideoLocalhostContract = getContract(ABI, LOCALHOST_ADDRESS);

const getVideos = curry(async (provider) => {
  try {
    const unspent = await provider.send('plasma_unspent', ['', 49153]);
    console.log('unspent: ', unspent);

    const result = await map(async(raw) => {
      const unencodedIpfsHash   = raw.output.data;
      console.log("raw ipfs hash# ", unencodedIpfsHash)
      const ipfsHash            = Base58.encode(convertToUint8Array(unencodedIpfsHash));
      console.log("ipfs hash#", ipfsHash);
      const cid                 = `${ipfsHash}`;
      const content             = await JSON.parse((await getMovieRepresentation(ipfs, cid)));

      const tokenId = raw.output.value;
      const color = raw.output.color;
      const owner = raw.output.address;

      content.tokenId = tokenId;
      content.color = color;
      content.owner =  owner;
      return content;
    }, unspent);

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
  const result = [];

  const noPrefix = inputAsHexString.slice(2);

  const d2h = d => (+d).toString(16);

  const ALGO = '12';

  const hexStringToByte = (str) => {
    if (!str) {
      return new Uint8Array();
    }
    const a = [];
    for (let i = 0, len = str.length; i < len; i+=2) {
      a.push(parseInt(str.substr(i,2),16));
    }
    return new Uint8Array(a).length;
  };

  const s = ALGO + d2h(hexStringToByte(noPrefix)) + noPrefix;

  for(var i = 0; i < s.length; i+=2) {
    result.push(parseInt(s.substring(i, i + 2), 16));
  }
  return Uint8Array.from(result)
};

const selectNetwork = async(provider) => {
  return await getVideoRinkebyContract(provider);
};

const createUiModel = (movies) => R.map((movie) => {
  console.log(movie);
  return ({
    owner: movie.owner,
    tokenid: movie.tokenId,
    title: movie.name,
    video: movie.movie.hls,
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
  inserted: function(item) {
    const siblings = getSiblings(item);
    const [title, poster, owner, tokenId] = siblings;
    console.log('sending customEvent', title, poster, owner, tokenId)
    window.dispatchEvent(new CustomEvent("wr-video-play", {detail: { title, poster, owner, tokenId }}));
    videojs(document.getElementById(item.id)).play();
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
        this.existPlugin();
        this.popup.video = video;
        this.popup.on = true;
        this.existPluginVal = true;
      },
      removePopup: function () {
        this.popup.on = false;
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
          try {
            const provider    = await getWeb3Provider(window.web3);
            const contract    = await selectNetwork(provider);
            const movies      = await getVideos(provider);
            console.log(movies);
            this.videos       = concat(this.videos, createUiModel(movies));
          } catch (error) {
            console.error(error.stack);
          }
        });
      }
    }
});
