// ==UserScript==
// @name         show my owned and wished games
// @namespace    http://tampermonkey.net/
// @version      0.7.7
// @updateURL    https://raw.githubusercontent.com/anemochore/showMyGames/master/showMyGames.js
// @downloadURL  https://raw.githubusercontent.com/anemochore/showMyGames/master/showMyGames.js
// @description  try to take over the world!
// @author       fallensky@naver.com
// @include      http*://dailyindiegame.com/*
// @include      http*://www.dailyindiegame.com/*
// @include      https://www.indiegala.com/*
// @include      https://fanatical.com/*
// @include      https://www.fanatical.com/*
// @include      https://humblebundle.com/*
// @include      https://www.humblebundle.com/*
// @require      https://raw.githubusercontent.com/anemochore/showMyGames/master/lib/es6-element-ready.js
// @resource     CSS https://raw.githubusercontent.com/anemochore/showMyGames/master/fy_css.css
// @grant        GM_xmlhttpRequest
// @grant        window.onurlchange
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @connect      store.steampowered.com
// ==/UserScript==


// ver 0.1 @ 2020-10-13
//    first version.
// ver 0.2 @ 2020-10-18
//    no more uses api.
// ver 0.3 @ 2020-10-27
//    await/async refactoring
// ver 0.4 @ 2020-10-27
//    now searches app id by name in steam on indiegala
// ver 0.5 @ 2020-11-1
//    searches app id by name in steam if needed!
// ver 0.6 @ 2020-11-7
//    css decoupling and first open public
// ver 0.6.1 @ 2020-11-23
//    indiegala bug fix
// ver 0.7.0 @ 2020-11-23
//    now supports indiegala main
// ver 0.7.1 @ 2020-12-5
//    added supports for fanatical 'mix' bundle pages
// ver 0.7.2 @ 2020-12-5
//    fixed a bug that shows wrong order on fanatical bundle pages
// ver 0.7.3 @ 2020-12-7
//    added supports for fanatical main page
// ver 0.7.4 @ 2020-12-9
//    fixed an error on fanatical
// ver 0.7.5 @ 2020-12-9
//    fixed an error on fanatical main page
//    now supports latest-deals page on fanatical
// ver 0.7.6 @ 2020-12-14
//    now supports promo page on humble
// ver 0.7.7 @ 2020-12-15
//    now supports top-sellers page on fanatical
//    fixed an stopping error on indiegala main page


(async () => {
  //singletons
  let syncMenu;  //instantiation should be included in below switch
  const toast = new fadingAlert();


  //globals
  let pageDivs = [];  //should be numeric and should be empty if no link found.
  let pageAppIds = [], pageGameLinks = [];

  let navDivs = []
  let navAppIds = [], navGameLinks = [];

  let relDivs = [];
  let relAppIds = [], relGameLinks = [];

  let inverseBackground = false, styleModsString = '';  //additional style fixes
  let titles = [], title = '';


  //parsing current page
  toast.log('analyzing current page...');
  let isAsync = false;
  switch(document.location.host) {
    case "dailyindiegame.com":
    case "www.dailyindiegame.com":
      syncMenu = new someMenu(document.querySelector('table'), {
        width: '1000px',
        margin: '0 auto',
      }, {
        position: 'absolute',
        top: '42px',
        marginLeft: '790px',
        height: '23px',
      });

      //individual bundle and app page
      pageGameLinks = [...document.querySelectorAll('td>a>span.XDIGcontent, td.XDIGcontent>a>span')]
      .map(el => el.parentElement)
      .filter(el => el.href.startsWith("https://store.steampowered.com/app/"));
      if(pageGameLinks.length > 0) {
        pageAppIds = pageGameLinks.map(el => parseInt(el.href.replace(/\/$/, '').split('/').pop()));
        pageDivs = pageGameLinks.map(el => el.parentElement);
      }
      else {
        //top selling games, etc
        pageGameLinks = [...document.querySelectorAll('td.XDIGcontent>a')]
        .filter(el => el.pathname.startsWith("/site_gamelisting_"));
        if(pageGameLinks.length > 0) {
          pageAppIds = pageGameLinks.map(el => parseInt(el.pathname.split('_').pop()));
          pageDivs = pageGameLinks.map(el => el.parentElement.parentElement);
        }
        else {
          //staff picks, main
          pageGameLinks = [...document.querySelectorAll('td>a')]
          .filter(el => el.pathname.startsWith("/site_gamelisting_"));
          if(pageGameLinks.length > 0) {
            pageAppIds = pageGameLinks.map(el => parseInt(el.pathname.split('_').pop()));
            if(document.location.pathname == "/" || document.location.pathname == "/content_main.html")
              pageDivs = pageGameLinks.map(el => el.parentElement);
            else
              pageDivs = pageGameLinks.map(el => el.parentElement.parentElement.parentElement.parentElement);
          }
        }
      }
      break;
    case "www.indiegala.com":
      syncMenu = new someMenu(document.body.querySelector('div>header'), {
        width: '1146px',
        margin: '0 auto',
      }, {
        position: 'absolute',
        top: '56px',
        marginLeft: '922px',
      });

      //games in nav bar: commented for now
      /*
      if(document.querySelector('div#main-submenu-big-store')) {
        await elementReady('div#main-submenu-big-store>div>div.main-submenu-big-right>aside a.main-submenu-big-right-browse-items');
        navDivs = [...document.querySelectorAll('div#main-submenu-big-store>div>div.main-submenu-big-right>aside div.main-submenu-big-right-item-col')]
        .filter(el => el.querySelector('span>i.fa-steam'));
        navGameLinks = navDivs.map(el => el.querySelector('a').pathname.split('_')[0]);  //to trim possible '_adult', etc string
        navAppIds = navGameLinks.map(el => parseInt(el.replace(/\/$/, '').split('/').pop()));
      }
      */

      if(document.location.pathname == '/') {
        //main
        //await elementReady('div.load-more-contents>a[style=""]');  //deprecated!

        //sadly impossible to tell the numbers are appid or subid.
        //todo0: refactor to steam search

        isAsync = true;
        $(document).ajaxStop(() => {
          pageDivs = [...document.querySelectorAll('div#big-list-store>div.list-cont>div.item-cont, section[class^="homepage"] div.main-list-item-col div.main-list-item')]
          .filter(el => el.querySelector('span>i.fa-steam'));
          pageGameLinks = pageDivs.map(el => el.querySelector('a').pathname.split('_')[0]);
          pageAppIds = pageGameLinks.map(el => parseInt(el.replace(/\/$/, '').split('/').pop()));

          preEntry();
        });
      }
      else if(document.location.pathname.startsWith('/bundle/')) {
        //bundle page
        pageGameLinks = [...document.querySelectorAll('div.bundle-slider-game-info-pub-dev>a')];
        pageAppIds = pageGameLinks.map(el => parseInt(el.pathname.replace(/\/$/, '').split('/').pop()));
        pageDivs = [...document.querySelector('div.bundle-page-tier-games>div.row').children];
      }
      else if(document.location.pathname.startsWith('/store/game/')) {
        //app page
        if(document.querySelector('div.info-row div.platform-info-icon>i.fa-steam')) {
          inverseBackground = true;
          pageGameLinks = [document.location.pathname.split('_')[0]];
          pageAppIds = [parseInt(pageGameLinks[0].replace(/\/$/, '').split('/').pop())];
          pageDivs = [document.querySelector('h1')];
        }

        //'see also' section
        relGameLinks = [...document.querySelectorAll('section.related-products-cont>div.row>div.rel-item>div.rel-item-inner>a')];
        if(relGameLinks.length > 0)
          relGameLinks = relGameLinks.filter(el => el.parentElement.parentElement.querySelector('span>i.fa-steam'));
        if(relGameLinks.length > 0) {
          relGameLinks = relGameLinks.map(el => el.pathname.split('_')[0]);
          relAppIds = relGameLinks.map(el => parseInt(el.replace(/\/$/, '').split('/').pop()));
          relDivs = relGameLinks.map(el => el.parentElement.parentElement);
        }
      }
      else if(document.location.pathname == '/games' || document.location.pathname.startsWith('/games/') ||
              document.location.pathname == '/store' || document.location.pathname.startsWith('/store/') ||
              document.location.pathname == '/search' || document.location.pathname.startsWith('/search/')) {
        //store or search (list)
        await elementReady('div.pagination>div.page-link-cont');
        //todo2: 페이지 이동 어쩔+++

        pageDivs = [...document.querySelectorAll('div.main-list-item-col div.main-list-item')]
        .filter(el => el.querySelector('span>i.fa-steam'));
        pageGameLinks = pageDivs.map(el => el.querySelector('a').pathname.split('_')[0]);
        pageAppIds = pageGameLinks.map(el => parseInt(el.replace(/\/$/, '').split('/').pop()));
      }
      else if(document.location.pathname == '/crackerjack') {
        //crackerjack main
        pageDivs = [...document.querySelectorAll('div.crackerjack-item-col')];
        pageGameLinks = pageDivs.map(el => el.querySelector('a.fit-click'));  //assuming all games are on steam
        igGetTitles_(pageGameLinks, titlesDict => {  //very slow!
          titles = [];
          pageGameLinks = pageGameLinks.map(el => el.pathname.slice(13));  //removes '/crackerjack/'
          Object.entries(titlesDict).forEach(([k, v]) => {
            titles[pageGameLinks.indexOf(k)] = v;
          });

          isAsync = true;
          searchSteam(titles, appIdsDict => {
            titles.forEach((title, index) => {
              pageAppIds[index] = appIdsDict[title];
            });
            preEntry();
          });
        });
      }
      else if(document.location.pathname.startsWith('/crackerjack/')) {
        //crackerjack app page
        pageDivs = [document.querySelector('div.title')];
        if(pageDivs.length > 0) {
          title = document.querySelector('div.title').innerText;

          isAsync = true;
          searchSteam([title], appIdsDict => {
            pageAppIds = [appIdsDict[title]];
            preEntry();
          });
        }
      }

      pageDivs = pageDivs.concat(navDivs).concat(relDivs);
      pageAppIds  = pageAppIds.concat(navAppIds).concat(relDivs);
      break;
    case "fanatical.com":
    case "www.fanatical.com":
      await elementReady('nav.navbar>div.w-100>div.nav-container');
      syncMenu = new someMenu(document.querySelector('nav.navbar>div.w-100>div.nav-container'), {
        display: 'flex',
        justifyContent: 'flex-end',
        width: '100%'
      }, {
        marginTop: '-18px',
        height: '27px',
      }, 'appendChild');

      //games in nav bar
      //todo? pass+++

      window.onurlchange = fanaticalonMenuLoadingDone_;
      isAsync = true;
      fanaticalonMenuLoadingDone_();
      break;
    case "humblebundle.com":
    case "www.humblebundle.com":
      syncMenu = new someMenu(document.querySelector('div.base-main-wrapper'), {
        display: 'flex',
        justifyContent: 'flex-end',
        maxWidth: '1500px',
        margin: '0 auto',
        background: '#494f5c',
      }, {
        height: '27px',
      });

      if(document.location.pathname == '/games' || document.location.pathname.startsWith('/games/') || document.location.pathname.startsWith('/subscription/')) {
        //bundle or subscription(hb choice) page
        pageDivs = [...document.querySelectorAll('div.dd-image-box, div.content-choice')]
        .filter(el => el.querySelector('i.hb-steam'));
        titles = pageDivs.map(el => el.querySelector('span.front-page-art-image-text, span.content-choice-title').textContent.trim());

        isAsync = true;
        searchSteam(titles, appIdsDict => {
          titles.forEach((title, index) => {
            pageAppIds[index] = appIdsDict[title];
          });
          pageDivs = pageDivs.map(el => [el, el.querySelector('div.dd-image-box-caption-container, div.title-and-delivery-methods')]);
          preEntry();
        });
      }
      else if(document.location.pathname == '/store' || document.location.pathname == '/store/search' || document.location.pathname.startsWith('/store/search/') || document.location.pathname.startsWith('/store/promo/')) {
        //store main or search or promo page
        //'featured' section is not supported
        //todo3: 페이지 이동 어쩔+++

        isAsync = true;
        $(document).ajaxStop(() => {  //elementReady is not usable. so i had to depend on jquery...
          inverseBackground = true;
          pageDivs = [...document.querySelectorAll('div.entity')].filter(el => el.querySelector('div.entity-purchase-details li.hb-steam'));
          titles = pageDivs.map(el => el.querySelector('span.entity-title').textContent.trim());
          searchSteam(titles, appIdsDict => {
            titles.forEach((title, index) => {
              pageAppIds[index] = appIdsDict[title];
            });

            pageDivs = pageDivs.map(el => [el, el.querySelector('div.entity-meta'), el.querySelector('div.entity-purchase-details')]);
            preEntry();
          });
        });
      }
      else if(document.location.pathname.startsWith('/store/')) {
        //app page
        pageDivs = document.querySelector('h1.human_name-view');
        if(pageDivs) {
          title = pageDivs.textContent.trim();
          pageDivs = [pageDivs];

          isAsync = true;
          searchSteam([title], appIdsDict => {
            pageAppIds = [appIdsDict[title]];

            //OTHER POPULAR GAMES ON ...
            //todo4+++

            preEntry();
          });
        }
      }
      break;
    default:
      //todo999: add other sites
  }
  preEntry(isAsync);


  function preEntry(isAsync = false) {
    if(isAsync) return;

    if(pageAppIds.length == 0) {
      toast.log('no steam game links found on this page or not supported page.');
      toast.log();
      syncMenu.update(true, 'ready');
      return;
    }
    else {
      toast.log(pageAppIds.length+' links are found. checking user game lists are available...');
      entry();
    }
  }

  function entry() {
    const userData = GM_getValue('USER_DATA');
    const syncDate = GM_getValue('SYNC_DATE');

    if(userData && syncDate) {
      syncMenu.update(true, 'ready');
      syncMenu.updateLabel(syncDate);
      showMatched(userData);
    }
    else
      syncFunc(entry);
  }

  function syncFunc(callBackFunc) {
    syncMenu.update(false, 'busy');
    const targetUrl = 'https://store.steampowered.com/dynamicstore/userdata/';

    //no error-handling!!!
    toast.log("fetching user data...");
    GM_xmlhttpRequest({
      method: 'GET',
      url: targetUrl,
      onload: res => {
        const userData = JSON.parse(res.responseText);
        if(userData.rgWishlist.length == 0) {
          alert('login to steam first and retry.');
          return;
        }
        GM_setValue('USER_DATA', userData);
        GM_setValue('SYNC_DATE', new Date());

        toast.log(`done! ${userData.rgOwnedApps.length} owned, ${userData.rgWishlist.length} wished, ${userData.rgFollowedApps.length} followed, ${Object.keys(userData.rgIgnoredApps).length} ignored games were synced.`);
        toast.log();
        if(callBackFunc) callBackFunc();
      }
    });
  }

  function searchSteam(titles, callBackFunc) {
    syncMenu.update(false, 'busy');

    let appIds = {}, count = titles.length;
    toast.log('searching for appIds...');

    let localCount = 0;
    let idForTitleCache = GM_getValue('ID_FOR_TITLE_CACHE');
    if(!idForTitleCache) {
      idForTitleCache = {};
      GM_setValue('ID_FOR_TITLE_CACHE', idForTitleCache);
    }

    console.info('titles', titles);  //dev
    titles.forEach((title, i) => {
      if(idForTitleCache[title]) {
        localCount++;
        appIds[title] = idForTitleCache[title];

        console.info('<'+title+'> found on cache:',localCount,'/',count,'done...');  //dev
        if(localCount == count)
          preCallback_();
      }
      else {
        const targetUrl = 'https://store.steampowered.com/search/?ignore_preferences=1&term=' + encodeURIComponent(title);
        GM_xmlhttpRequest({
          method: 'GET',
          url: targetUrl,
          onload: res => {
            //console.info(res.finalUrl);  //dev
            const steamDoc = new DOMParser().parseFromString(res.responseText, 'text/html');
            const key = decodeURIComponent(res.finalUrl.slice(res.finalUrl.indexOf('&term=')+6));
            const as = [...steamDoc.querySelectorAll('div#search_resultsRows>a.search_result_row')];
            const urls = as.map(el => el.href);
            const titles = as.map(el => el.querySelector('span.title').textContent);

            let async = false;
            if(urls.length == 0)
              appIds[key] = 'not found';
            else {
              let idx = 0;
              if(!key.includes(' ') && titles.indexOf(key) > 0)  //for case like Basement (appId: 340150)
                idx = titles.indexOf(key)

              //ex: ["https:", "", "store.steampowered.com", "app", "70617", ...]
              const a = as[idx];
              const url = urls[idx];
              const type = url.split('/')[3];
              const id   = url.split('/')[4];
              if(type == 'app') {
                appIds[key] = parseInt(id);
                idForTitleCache[key] = parseInt(id);
                toast.log('added <'+key+'> to title cache.');
              }
              else if(type == 'bundle') {
                let items = JSON.parse(a.getAttribute('data-ds-bundle-data')).m_rgItems.map(el => el.m_rgIncludedAppIDs);

                //assert every m_rgIncludedAppIDs's length == 1  //dev
                if(items.every(item => item.length != 1)) {
                  console.error("assertion failed. contact to dev: m_rgIncludedAppIDs's legnth is not 1 on", item);
                  return;
                }
                items = items.map(item => parseInt(item[0]));

                appIds[key] = items.slice();
                idForTitleCache[key] = appIds[key];
                toast.log('added <'+key+'> to title cache.');
              }
              else if(type == 'sub') {
                //todo5: 패키지에 속한 애들이 위시리스트에 있는지는 따로 봐야 함.+++
                //let items = JSON.parse(a.getAttribute('data-ds-appid')).split(',').map(el => parseInt(el));
                appIds[key] = 'sub' + id;
                idForTitleCache[key] = appIds[key];
                toast.log('added <'+key+'> to title cache.');
              }
              else {
                console.error('unsupported url:', res.finalUrl);
                return;
              }
            }
            localCount++;

            console.info('<'+title+'> searched:',localCount,'/',count,'done...');  //dev
            if(localCount == count)
              preCallback_();
          }
        });
      }
    });

    function preCallback_() {
      toast.log('done searching!');
      GM_setValue('ID_FOR_TITLE_CACHE', idForTitleCache);
      appIds = Object.fromEntries(Object.entries(appIds).filter(([k, v]) => v != 'not found'));

      syncMenu.update(true, 'ready');
      callBackFunc(appIds);
    }
  }

  function showMatched(userData) {
    if(pageAppIds.length == 0) return;

    const css = GM_getResourceText('CSS');
    GM_addStyle(css);

    //assuming no-error here
    const ownedIds    = userData.rgOwnedApps;
    const ownedSubIds = userData.rgOwnedPackages;
    const followedIds = userData.rgFollowedApps;
    const wishedIds   = userData.rgWishlist;
    const ignoredIds  = Object.keys(userData.rgIgnoredApps).map(el => parseInt(el));
    //ignored package is not supported. idk if it's being used at all.

    toast.log('now matching user games with '+pageAppIds.length+' games on the page...');
    console.info('pageAppIds', pageAppIds);  //dev
    console.info('pageDivs', pageDivs);  //dev

    let followedCount = 0, ownedCount = 0, wishedCount = 0, ignoredCount = 0;
    pageAppIds.forEach((idOrIds, idIndex) => {
      let ids = [idOrIds];
      if(Array.isArray(idOrIds)) ids = idOrIds;

      const divOrdivs = pageDivs[idIndex];
      let divs = [divOrdivs];
      if(Array.isArray(divOrdivs)) divs = divOrdivs;

      if(styleModsString != '') {
        divs.forEach(div => {
          div.classList.add('fy-mods-'+styleModsString);
        });
      }

      if(ids.every(id => followedIds.includes(id))) {
        divs.forEach(div => {
          div.classList.add('fy-container-followed');
        });
        followedCount++;
      }

      //assuming bundles are not included in a package
      if(ids.every(id => ownedIds.includes(id)) || ids.every(id => id && ownedSubIds.includes(id.toString().replace('sub', '')))) {
        divs.forEach(div => {
          div.classList.add('fy-container');
          if(inverseBackground) div.classList.add('fy-container-bg-inversed');
          div.classList.add('fy-bg-owned');
        });
        ownedCount++;
      }
      else if(ids.every(id => wishedIds.includes(id))) {
        divs.forEach(div => {
          div.classList.add('fy-container');
          if(inverseBackground) div.classList.add('fy-container-bg-inversed');
          div.classList.add('fy-bg-wished');
        });
        wishedCount++;
      }
      else if(ids.every(id => ignoredIds.includes(id))) {
        divs.forEach(div => {
          div.classList.add('fy-container-ignored');
        });
        ignoredCount++;
      }
    });

    toast.log(`done! ${ownedCount} owned, ${wishedCount} wished, ${followedCount} followed, ${ignoredCount} ignored games were matched.`);
    toast.log();
  }


  //some utils per sites
  function igGetTitles_(links, callBackFunc) {
    syncMenu.update(false, 'busy');

    let titles = {}, count = links.length;
    toast.log('searching for titles...');

    links.forEach(link => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: link,
        onload: res => {
          const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
          const title = doc.querySelector('div.title') && doc.querySelector('div.title').innerText;  //i wanna use ?.
          const key = res.finalUrl.slice(res.finalUrl.indexOf('/crackerjack/')+13);

          if(!title)
            titles[key] = 'not found';
          else
            titles[key] = title;

          if(Object.keys(titles).length == count) {
            toast.log('done searching!');
            titles = Object.fromEntries(Object.entries(titles).filter(([k, v]) => v != 'not found'));

            syncMenu.update(true, 'ready');
            callBackFunc(titles);
          }
        }
      });
    });
  }

  async function fanaticalonMenuLoadingDone_() {
    pageDivs = [], pageAppIds = [], pageGameLinks = [];
    inverseBackground = false, styleModsString = '';

    if(document.location.pathname.split('/').length > 3 && document.location.pathname.split('/')[2] == 'game') {
      //app page (including star deal page)
      await elementReady('div.game-details>dl.row div a');
      pageGameLinks = [...document.querySelectorAll('div.game-details>dl.row div a')]
      .filter(el => el.host == "store.steampowered.com")
      .map(el => el.href);
      if(pageGameLinks.length > 0) {
        pageAppIds = [parseInt(pageGameLinks[0].replace(/\/$/, '').split('/').pop())];
        pageDivs = [document.querySelector('h1')];
      }

      //'you may also like' section
      //todo6: click click click...+++
      //relGameLinks = [...document.querySelectorAll('div.slick-list div.card-container a.w-100')];
      //if(relGameLinks.length> console.log(relGameLinks);

      preEntry();
    }
    else if(document.location.pathname.split('/').length > 3 && (document.location.pathname.split('/')[2] == 'bundle' || document.location.pathname.includes('bundle') || document.location.pathname.includes('mix'))) {
      //bundle page
      await elementReady('div.carousel-buttons-container>div>button+button');
      pageDivs = [...document.querySelectorAll('div[class*="-column-row"]>div.bundle-product-card, div[class*="-column-row"]>a>button.bundle-product-card')]
      .filter(el => el.querySelector('div.card-icons-price-container div.drm-container-steam'));

      let [start, end] = document.querySelector('div.carousel-buttons-container>div.carousel-count').innerText.split(' of ')
      .map(el => parseInt(el));

      let nextButton = document.querySelector('div.carousel-buttons-container>div>button+button');
      let target = document.querySelector('div#carousel-content');
      let titles = {};
      pageGameLinks = [target.querySelector('a.d-none') && target.querySelector('a.d-none').href];

      let observer = new MutationObserver(mutations => {
        pageGameLinks.push(target.querySelector('a.d-none') && target.querySelector('a.d-none').href);
        nextButton.click();
        if(pageGameLinks.length == end) {
          observer.disconnect();

          if('scrollRestoration' in history) history.scrollRestoration = 'manual';
          window.scrollTo(0, 0);

          //detail에서 스팀 링크가 없는 경우가 있어서...
          pageGameLinks.forEach((el, idx) => {
            if(!el)
              pageDivs[idx] = null;
            else
              pageAppIds[idx] = parseInt(el.replace(/\/$/, '').split('/').pop());
          });

          preEntry();
        }
      });

      observer.observe(target, {
        childList: true,
        characterData: true,
        subtree: true,
      });
      nextButton.click();

      //todo8: Other products you may like?
      //...
    }
    else if(document.location.pathname.split('/').pop() == '' || document.location.pathname.split('/')[2] == 'latest-deals' || document.location.pathname.split('/')[2] == 'search') {
      //main or latest-deals
      if(document.location.pathname.split('/').pop() == '')
        await elementReady('a.btn-all-deals');
      else if(document.location.pathname.split('/')[2] == 'latest-deals')
        await elementReady('ul.pagination>li>a.page-item');
      else if(document.location.pathname.split('/')[2] == 'search')
        await elementReady('ul.ais-Pagination__root>li.ais-Pagination__item>a.Pagination__itemLink');

      const commonCardSel = 'div.card-container>div.video-hit-card>div.card-content';
      pageDivs = [...document.querySelectorAll('div.container>div.row>' +commonCardSel)]  //Top Sellers & More Great Deals & latest-deals
      .concat(    ...document.querySelectorAll('div.container>div.pb-5 '+commonCardSel))  //New Releases and ...
      .concat(    ...document.querySelectorAll('div.container>div.trending-deals-two-row-carousel '+commonCardSel))  //Trending Deals
      .concat(    ...document.querySelectorAll('div.container div.ais-Hits__root '+commonCardSel))  //search
      .filter(el => el.querySelector('div.icons-price-container>div.drm-container-steam') && el.querySelector('div.icons-price-container div.card-os-icons>span'));

      let titles = pageDivs.map(el => el.querySelector('div.product-name-container>a').innerText.trim());
      searchSteam(titles, appIdsDict => {
        titles.forEach((title, index) => {
          pageAppIds[index] = appIdsDict[title];
        });
        preEntry();
      });
    }
    else if(document.location.pathname.split('/')[2] == 'top-sellers') {
      //top-sellers page
      //'load more' is not supported!
      await elementReady('div.ts-item a');

      pageDivs = [...document.querySelectorAll('div.ts-item')]
      .filter(el => el.querySelector('a').href.includes('/game/'))  //excludes bundles
      .filter(el => el.querySelector('div.icons-container>div.drm-container-steam') && el.querySelector('div.icons-container div.card-os-icons>span'));

      let titles = pageDivs.map(el => el.querySelector('div.ts-title>a').innerText.trim());
      searchSteam(titles, appIdsDict => {
        titles.forEach((title, index) => {
          pageAppIds[index] = appIdsDict[title];
        });

        pageDivs = pageDivs.map(el => el.querySelector('div.card-overlay'));
        inverseBackground = true;
        styleModsString = 'fanatical-top_sellers';
        preEntry();
      });
    }
    else {
      //todo7: genres,  etc...
      isAsync = false;
    }
  }


  //classes
  function someMenu(referenceNode, conCss = {}, divCss = {}, method = 'insertBefore') {
    let s;  //temp var

    this.container = document.createElement('div');
    this.container.id = 'someMenuContainer';
    for(const k in conCss) this.container.style[k] = conCss[k];

    this.sync = document.createElement('button');
    this.sync.innerText = 'sync (steam login required)';
    this.sync.onclick = syncFunc.bind(this, entry, 3);
    s = this.sync.style;
    s.fontSize = '10px';
    s.height = '23px';

    //default button style (at least in Vivaldi)
    s.padding = '1px 6px';
    s.background = 'rgb(240, 240, 240)';
    s.border = '2px outset rgb(240, 240, 240)';

    this.labelOwned = document.createElement('label');
    this.labelOwned.appendChild(this.sync);

    this.statusMsg = document.createElement('span');
    s = this.statusMsg.style;
    s.fontSize = '10px';
    this.statusMsg.style.marginLeft = '1em';

    this.div = document.createElement('div');
    this.div.appendChild(this.labelOwned);
    this.div.appendChild(this.statusMsg);

    this.update = (enabled = false, msg = '') => {
      this.statusMsg.innerText = msg.trim();
      //console.info('status:', msg.trim());  //dev
      if(enabled)
        this.sync.disabled = false;
      else
        this.sync.disabled = true;
    };

    this.getStatus = () => this.statusMsg.innerText;

    this.updateLabel = syncDate => {
      this.labelOwned.title  = 'last sync: ' + new Date(syncDate).toLocaleString();
    };

    s = this.div.style;
    s.width = '206px';
    s.padding = '2px';
    s.backgroundColor = 'LawnGreen';
    s.fontSize = '70%';
    s.color = 'Black';
    for(const k in divCss) this.div.style[k] = divCss[k];

    this.container.appendChild(this.div);
    if(!referenceNode)
      referenceNode = document.body.querySelector('section, div, table') || document.body.firstChild;

    if(method == 'insertBefore')
      referenceNode.parentElement.insertBefore(this.container, referenceNode);
    else if(method == 'appendChild')
      referenceNode.appendChild(this.container);

    this.update(false, 'init');
  }

  function fadingAlert() {
    this.div = document.createElement('div');
    this.div.id = 'alertBoxDiv';
    document.body.appendChild(this.div);

    const s = this.div.style;
    s.position = 'fixed';
    s.top = '47.5%';
    s.left = '45%';
    s.textAlign = 'center';
    s.width = '300px';
    s.height = 'auto';
    s.padding = '2px';
    s.border = 0;
    s.color = 'Black';
    s.backgroundColor = 'LawnGreen';
    s.overflow = 'auto';
    s.zIndex = '2147483647';

    this.log = (txt = '') => {
      txt = txt.trim();
      if(txt.length == 0) {
        this.div.style.transition = '2.5s';
        this.div.style.opacity = 0;
      }
      else {
        this.div.innerHTML = txt;
        this.div.style.transition = '';
        this.div.style.opacity = 1;
        console.log(txt);
      }
    };
  }

})();