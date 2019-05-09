# K5 Streaming Site

<br />
<p align="center">
  <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="http://www.k5film.com/wp-content/themes/k5-film-2017/inc/img/logo.svg" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">K5 Streaming</h3>

  <p align="center">
    <a href="https://k5-streaming.now.sh">View Demo</a>
  </p>
</p>

## About The Project
ListView of minted NFTs(movies) on leapDAO

### Built With
* [Vue.js](https://vuejs.org/)

## Getting Started


### Prerequisites
* live-server or similar
```sh
npm i live-server -g
```

### Deployment
The site could more or less be deployed anyware, we are currently using Zeit because its easy and offers immutable deployments.

[Zeit](https://zeit.co/download)

## Things to know about
* Dependencies fetched from CDN´s
* Application logic is contained in the file app.js
* Token data is fetched from leapDAO plasma chain
* Metadata about each token is fetched from IPFS
* Metadata is fetched in parallel ajax requests
* Passes NTF data from the site to whiterabbit plugin
* RINKEBY_ADDRESS 0xbf972fD0b929563407C249CBB00e33B4C83d49c3
* Plasma URL https://staging-testnet.leapdao.org/rpc
