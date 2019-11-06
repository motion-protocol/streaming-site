# K5 Streaming Site

<br />
<p align="center">
  <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="http://www.k5film.com/wp-content/themes/k5-film-2017/inc/img/logo.svg" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">K5 Streaming</h3>

  <p align="center">
    <a href="http://streaming-site-demo.s3-website.eu-central-1.amazonaws.com/">View Demo</a>
  </p>
</p>

## About The Project
ListView of minted NFTs(movies) on leapDAO

### Built With
* [Vue.js](https://vuejs.org/)

### Deployment
The site is deployed as a static website to S3. We are currently using travis for continuous deployment. The site is automatically deployed whenever a new commit is pushed to the master branch.

## Things to know about
* Dependencies fetched from CDN´s
* Application logic is contained in the file app.js
* Token data is fetched from leapDAO plasma chain
* Metadata about each token is fetched from IPFS
* Metadata is fetched in parallel ajax requests
* Passes NTF data from the site to whiterabbit plugin
* RINKEBY_ADDRESS 0xbf972fD0b929563407C249CBB00e33B4C83d49c3
* Plasma URL https://testnet-node1.leapdao.org
