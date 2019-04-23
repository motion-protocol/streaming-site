const {map, curry, times, split, concat} = R;

const ABI = [
  "function tokenByIndex(uint256 index) public view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function totalSupply() public view returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address owner)"
];

const GOERLI_ADDRESS    = '0x1864b231f4fd1baa9f334150900fb9af6103526c';
const RINKEBY_ADDRESS   = '0xaa5809214239995d873f9d742351cecb4dafad30';
const LOCALHOST_ADDRESS = ''; // UPDATE

const getWeb3Provider = async(web3) => {
  if(web3) {
    return new ethers.providers.Web3Provider(web3.currentProvider);
  } else {
    throw new Error('Non-Ethereum browser detected. You should consider trying MetaMask!');
  }
};

const getContract = curry((abi, address, provider) => new ethers.Contract(address, abi, provider));

const getVideoGoerliContract    = getContract(ABI, GOERLI_ADDRESS);
const getVideoRinkebyContract   = getContract(ABI, RINKEBY_ADDRESS);
const getVideoLocalhostContract = getContract(ABI, LOCALHOST_ADDRESS);

const getVideos = curry(async (contract) => {
  const totalSupply   = await contract.totalSupply();
  const indexes       = await times(contract.tokenByIndex ,totalSupply)
  const movieIds      = map((id) => id.toNumber(), await Promise.all(indexes));

  const allMovies     = await map(async(tokenId) => {
    const uri   = await contract.tokenURI(tokenId);
    const owner = await contract.ownerOf(tokenId);
    return { uri, owner, tokenId };
  }, movieIds);

  return await Promise.all(allMovies);
});

const selectNetwork = async(provider) => {
  const {name}      = await provider.getNetwork();
  if(name === 'goerli') {
    return await getVideoGoerliContract(provider);
  } else if (name === 'rinkeby') {
    return await getVideoRinkebyContract(provider);
  } else {
    return await getVideoLocalhostContract(provider);
  }
};

// TODO: whiterabbit needs to upload all the data related to an movie , poster, video
const createUiModel = (movies) => R.map((movie) => {
  console.log(movie);
  const parts = split('#', movie.uri);
  return ({
    owner: movie.owner,
    tokenid: movie.tokenId,
    title: parts[1],
    video: movie.uri,
    poster: 'https://images-na.ssl-images-amazon.com/images/M/MV5BMjAxMTk0MTUxNV5BMl5BanBnXkFtZTgwNTY0MjAzODE@._V1_SX300.jpg'
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
            const movies      = await getVideos(contract);
            this.videos       = concat(this.videos, createUiModel(movies));
          } catch (error) {
            console.error(error.stack);
          }
        });
      }
    }
});
