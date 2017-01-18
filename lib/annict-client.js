'use strict';

const Nightmare = require('nightmare');
const nightmareConfig = require('../config/nightmare.json');

const ANIMES_PER_PAGE = 25;

class AnnictClient {

  constructor(aUserID) {
    this.nightmare = Nightmare(nightmareConfig);
    this.userID = aUserID;
  }

  * fetchMaxPageIndex() {
    let maxPageIndex;

    yield this.nightmare
      .goto(`https://annict.com/@${this.userID}/watched`)
      .wait('#ann')
      .evaluate((aAnimesPerPage) => {
        const watchedNum = document.querySelector('#ann > div.app__main > div.content > div.c-tabs > div > a.tab.tab--active > div.count').innerText;
        return Math.ceil(watchedNum / aAnimesPerPage); // number of webpages
      }, ANIMES_PER_PAGE)
      .then((aIndex) => {
        console.log(`MAX PAGE: ${aIndex}`);
        maxPageIndex = aIndex;
      });

      return maxPageIndex;
  }

  * fetchAnimes(aMaxPageIndex) {
    let animes = [];

    for (let i = 1; i <= aMaxPageIndex; i++) {
      yield this.nightmare
        .goto(`https://annict.com/@${this.userID}/watched?page=${i}`)
        .wait(500) // TODO: maybe unstable
        .wait('#ann');

      for (let j = 1; j <= ANIMES_PER_PAGE; j++) {
        yield this.nightmare
          .evaluate((aIndex) => {
            const anime = document.querySelector(`#ann > div.app__main > div.works > div:nth-child(${aIndex}) > div.container > div > div.middle > h2 > a`);

            if (!anime) {
              return null;
            }

            return {
              id: anime.href.split('/')[4],
              name: anime.innerText
            };
          }, j)
          .then((aAnime) => {
            if (aAnime) {
              console.log(`id: ${aAnime.id}, name: ${aAnime.name}`);
              animes.push(aAnime);
            }
          });
      }

      yield this.nightmare
        .goto('about:blank');
    }

    return animes;
  }

  dispose() {
    this.nightmare.end().then();
  }
}

module.exports = AnnictClient;

