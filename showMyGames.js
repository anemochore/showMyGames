// ==UserScript==
// @name         show my owned and wished games
// @namespace    http://tampermonkey.net/
// @version      0.8.11
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
// ver 0.7.8 @ 2020-12-16
//    fixed a bug showing incorrect colors on 'GAMES STORE LIST' on dig
// ver 0.7.9 @ 2020-12-25
//    improved steam searching
// ver 0.8.0 @ 2020-12-25
//    now searches steam on all pages of indiegala
//    now supports on-sale page on fanatical
// ver 0.8.1 @ 2020-12-25
//    now supports redeem-code page on fanatical
// ver 0.8.2 @ 2020-12-27
//    fixed a small bug on humble app page
//    added support for 'other popular games on discount' section on humble app page
// ver 0.8.3 @ 2020-12-27
//    fixed a small bug on humble store/promo page
// ver 0.8.4 @ 2021-1-4
//    partial support for humble main page
//    fixed a small bug on indiegala crackerjack page
//    small refactorings...
// ver 0.8.5 @ 2021-1-8
//    updated for main page on fanatical
// ver 0.8.6 @ 2021-1-9
//    now supports most pages on fanatical
// ver 0.8.7 @ 2021-1-10
//    fixed a bug on fanatical app page
// ver 0.8.8 @ 2021-1-16
//    fixed a bug on humble app page
// ver 0.8.9 @ 2021-1-16
//    fixed a bug on fanatical main page
// ver 0.8.10 @ 2021-1-16
//    applied dom change on fanatical bundle pages
// ver 0.8.11 @ 2021-2-19
//    now supports fanatical mystery bundle pages


(async () => {
  //singletons
  let syncMenu;  //instantiation should be included in below switch
  const toast = new fadingAlert();

  //globals
  let pageDivs = [];  //should be numeric and should be empty if no link found.
  let pageAppIds = [], links = [];

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
      links = [...document.querySelectorAll('td>a>span.XDIGcontent, td.XDIGcontent>a>span')]
      .map(el => el.parentElement)
      .filter(el => el.href.startsWith("https://store.steampowered.com/app/"));
      if(links.length > 0) {
        pageAppIds = links.map(el => parseInt(el.href.replace(/\/$/, '').split('/').pop()));
        pageDivs = links.map(el => el.parentElement);
      }
      else {
        //top selling games, etc
        links = [...document.querySelectorAll('td.XDIGcontent>a')]
        .filter(el => el.pathname.startsWith("/site_gamelisting_"));
        if(links.length > 0) {
          pageAppIds = links.map(el => parseInt(el.pathname.split('_').pop()));
          pageDivs = links.map(el => el.parentElement.parentElement);
        }
        else {
          //staff picks, main
          links = [...document.querySelectorAll('td>a')]
          .filter(el => el.pathname.startsWith("/site_gamelisting_"));
          if(links.length > 0) {
            pageAppIds = links.map(el => parseInt(el.pathname.split('_').pop()));
            if(document.location.pathname == "/" || document.location.pathname == "/content_main.html")
              pageDivs = links.map(el => el.parentElement);
            else if(document.location.pathname == "/site_content_marketplace.html")
              pageDivs = links.map(el => el.parentElement.parentElement);
            else
              pageDivs = links.map(el => el.parentElement.parentElement.parentElement.parentElement);
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

      //games in nav bar: removed support for now

      inverseBackground = true;
      if(document.location.pathname == '/') {
        //main
        isAsync = true;
        $(document).ajaxStop(() => {
          pageDivs = [...document.querySelectorAll('div#big-list-store>div.list-cont>div.item-cont, section[class^="homepage"] div.main-list-item-col div.main-list-item')]
          .filter(el => el.querySelector('span>i[class*="fa-steam"]'));
          titles = pageDivs.map(el => el.querySelector('a').title);

          searchSteam(titles, appIdsDict => {
            titles.forEach((title, index) => {
              pageAppIds[index] = appIdsDict[title];
            });
            preEntry();
          });
        });
      }
      else if(document.location.pathname.startsWith('/bundle/')) {
        //bundle page
        pageDivs = [...document.querySelectorAll('div.bundle-page-tier-games div.row>div>div>div')]
        .filter(el => el.querySelector('span>i[class*="fa-steam"]'));
        titles = pageDivs.map(el => el.querySelector('figure>img').alt);
        pageDivs = pageDivs.map(el => [el, el.querySelector('figcaption')]);

        isAsync = true;
        searchSteam(titles, appIdsDict => {
          titles.forEach((title, index) => {
            pageAppIds[index] = appIdsDict[title];
          });
          preEntry();
        });
      }
      else if(document.location.pathname.startsWith('/store/game/')) {
        //app page
        isAsync = true;
        $(document).ajaxStop(() => {
          if(document.querySelector('div.info-row div.platform-info-icon>i[class*="fa-steam"]')) {
            pageDivs = [document.querySelector('h1.store-product-page-title')];
            titles = [pageDivs[0].textContent.trim()];
          }

          //add 'see also' section too
          let relDivs = [...document.querySelectorAll('section.related-products-cont div.row>div.rel-item>div')]
          //if(relDivs.length > 0)
          //  relDivs = relDivs.filter(el => el.querySelector('span>i[class*="fa-steam"]'));
          .filter(el => el.querySelector('span>i[class*="fa-steam"]'));
          pageDivs = pageDivs.concat(relDivs.map(el => [el, el.querySelector('figcaption')]));
          titles = titles.concat(relDivs.map(el => el.querySelector('a').title));

          searchSteam(titles, appIdsDict => {
            titles.forEach((title, index) => {
              pageAppIds[index] = appIdsDict[title];
            });
            preEntry();
          });
        });
      }
      else if(document.location.pathname == '/games' || document.location.pathname.startsWith('/games/') ||
              document.location.pathname == '/store' || document.location.pathname.startsWith('/store/') ||
              /*document.location.pathname == '/search' || */document.location.pathname.startsWith('/search/')) {
        //store or search (list)
        //todo2: 페이지 이동 어쩔+++ dom이 변하지 않는다???

        isAsync = true;
        $(document).ajaxStop(() => {
          pageDivs = [...document.querySelectorAll('div.main-list-item-col div.main-list-item')]
          .filter(el => el.querySelector('span>i[class*="fa-steam"]'));
          titles = pageDivs.map(el => el.querySelector('a').title);

          isAsync = true;
          searchSteam(titles, appIdsDict => {
            titles.forEach((title, index) => {
              pageAppIds[index] = appIdsDict[title];
            });
            preEntry();
          });
        });
      }
      else if(document.location.pathname == '/crackerjack') {
        //crackerjack main
        pageDivs = [...document.querySelectorAll('div.crackerjack-item-col')];
        links = pageDivs.map(el => el.querySelector('a.fit-click').href);

        isAsync = true;
        getInfo_(links, ['div.title', 'i[class*="fa-steam"]'], dicts => {  //very slow!?
          const [titlesDict, pDict] = [...dicts];
          Object.entries(pDict).forEach(([k, v]) => {
            titles[links.indexOf(k)] = titlesDict[k];
          });
          pageDivs = pageDivs.filter((el, i) => pDict[links[i]]);
          titles = titles.filter(el => el);

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
        pageDivs = [document.querySelector('div.title')]
        .filter(el => el.parentNode.querySelector('i[class*="fa-steam"]'));
        if(pageDivs.length > 0) {
          title = pageDivs[0].textContent.trim();

          isAsync = true;
          searchSteam([title], appIdsDict => {
            pageAppIds = [appIdsDict[title]];
            preEntry();
          });
        }
      }
      break;
    case "fanatical.com":
    case "www.fanatical.com":
      await elementReady_('nav.navbar>div.w-100>div.nav-container');
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

      if(document.location.pathname == '/') {
        //main
        pageDivs = [...document.querySelectorAll('div.tile-holder>a>div.tile-info.store')]
        .map(el => el.parentNode.parentNode);

        //getInfo_() is not possible since pages are dynamically served
      }
      else if(document.location.pathname == '/games' || document.location.pathname.startsWith('/games/') || document.location.pathname.startsWith('/subscription/')) {
        //bundle or subscription(hb choice) page
        pageDivs = [...document.querySelectorAll('div.dd-image-box, div.content-choice')]
        .filter(el => el.querySelector('i.hb-steam'));
        titles = pageDivs.map(el => el.querySelector('span.front-page-art-image-text, span.content-choice-title').textContent.trim());
        pageDivs = pageDivs.map(el => [el, el.querySelector('div.dd-image-box-caption-container, div.title-and-delivery-methods')]);

        isAsync = true;
        searchSteam(titles, appIdsDict => {
          titles.forEach((title, index) => {
            pageAppIds[index] = appIdsDict[title];
          });
          preEntry();
        });
      }
      else if(document.location.pathname == '/store' || 
        document.location.pathname == '/store/search' || document.location.pathname.startsWith('/store/search/') || 
        document.location.pathname.startsWith('/store/promo/')) {
        //store main or search or promo page
        //todo3: 페이지 이동 어쩔+++
        //todo: TRENDING DEALS in store page is not working+++

        await elementReady_('div.entity', document.querySelector('.entity-list.full-grid'));  //ajaxStop is not usable...

        pageDivs = [...document.querySelectorAll('.slick-list div.entity')]
        //pageDivs = [...document.querySelectorAll('.slick-list div.entity, .entity-list div.entity')]  //todo
        .filter(el => el.querySelector('div.entity-purchase-details li.hb-steam'));
        titles = pageDivs.map(el => el.querySelector('span.entity-title').textContent.trim());

        //'featured' slick list filtering
        pageDivs.forEach((el, i) => {
          let featuredEl = document.querySelector('.entity-list.carousel-large');
          if(parentNodes_(el).includes(featuredEl))
            pageDivs[i] = [el, el.querySelector('div.entity-purchase-details')];
          else
            pageDivs[i] = [el, el.querySelector('div.entity-purchase-details'), el.querySelector('div.entity-meta')];
        });

        inverseBackground = true;

        isAsync = true;
        searchSteam(titles, appIdsDict => {
          titles.forEach((title, index) => {
            pageAppIds[index] = appIdsDict[title];
          });
          preEntry();
        });
      }
      else if(document.location.pathname.startsWith('/store/')) {
        //app page
        isAsync = true;
        $(document).ajaxStop(() => {
          if(document.querySelector('div.showcase-info-section i.hb-steam') && document.querySelector('h1.human_name-view')) {
            pageDivs = [document.querySelector('h1.human_name-view')];
            titles = [pageDivs[0].textContent.trim()];
          }

          //todo99: 'traits' section
          //cannot add color to images :(

          //add 'see also' section too
          inverseBackground = true;
          let relDivs = [...document.querySelectorAll('div.recommendation-collection div.entity')]
          .filter(el => el.querySelector('div.entity-purchase-details li.hb-steam'));

          pageDivs = pageDivs.concat(relDivs.map(el => [el, el.querySelector('div.entity-meta'), el.querySelector('div.entity-purchase-details')]));
          titles = titles.concat(relDivs.map(el => el.querySelector('span.entity-title').textContent.trim()));

          searchSteam(titles, appIdsDict => {
            titles.forEach((title, index) => {
              pageAppIds[index] = appIdsDict[title];
            });
            preEntry();
          });
        });
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

    //tmp code for v0.8
    if(new Date(syncDate) < new Date(2020,11,25)) {
      console.log('title cache cleared to fix some bugs earlier than v0.8.');
      GM_setValue('ID_FOR_TITLE_CACHE', {});
      syncFunc(entry);
    }
    else if(userData && syncDate) {
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
          alert('login to steam and visit https://store.steampowered.com/dynamicstore/userdata/ and hit refresh and then retry this script.');
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
    toast.log('searching for appIds...');

    let appIds = {}, count = titles.length;

    let localCount = 0;
    let idForTitleCache = GM_getValue('ID_FOR_TITLE_CACHE');

    if(count == 0) {
      console.log('titles are empty. nothing done.');
      preCallback_();
    }
    else if(!idForTitleCache) {
      idForTitleCache = {};
      GM_setValue('ID_FOR_TITLE_CACHE', idForTitleCache);
    }

    //console.info('titles', titles);  //dev
    titles.forEach((title, i) => {
      if(!title) {
        localCount++;
        console.info('title is empty. nothing done.',localCount,'/',count,'done...');  //dev
        if(localCount == count)
          preCallback_();
      }
      else if(idForTitleCache[title]) {
        localCount++;
        appIds[title] = idForTitleCache[title];

        //console.info('<'+title+'> found on cache: '+localCount+'/'+count+' done...');
        if(localCount == count)
          preCallback_();
      }
      else {
        //뒤에 4 Pack 같은 게 붙는 경우 떼어냄. 물론 예외도 있으나 몇 개 없으니 무시하겠음.
        const oldTitle = title;
        const strToRemove = [' 4 Pack', ' 4-Pack', ' 2 Pack', ' 2-Pack'];
        for(str of strToRemove) {  //to use break
          if(title.endsWith(str)) {
            title = title.slice(0, -str.length)
            titles[i] = title;
            break;
          }
        }
        if(oldTitle != title) console.info(oldTitle + ' adjusted to ' + title);  //dev
        
        const targetUrl = 'https://store.steampowered.com/search/?ignore_preferences=1&term=' + encodeURIComponent(title);
        //console.info('opening '+targetUrl+'...');  //dev
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
            //console.log(urls);  //dev

            if(urls.length == 0)
              appIds[key] = 'not found';
            else {
              let idx = 0;
              if(titles.indexOf(key) > 0)  //exact match first
                idx = titles.indexOf(key);

              //ex: ["https:", "", "store.steampowered.com", "app", "70617", ...]
              const a = as[idx];
              const url = urls[idx];
              const type = url.split('/')[3];
              const id   = url.split('/')[4];
              if(type == 'app') {
                appIds[key] = parseInt(id);
                idForTitleCache[key] = parseInt(id);
                console.info('added <'+key+'> to title cache.');
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
                console.info('added <'+key+'> to title cache.');  //번들은 풀어서 각각을 저장함.
              }
              else if(type == 'sub') {
                //todo5: 패키지에 속한 애들이 위시리스트에 있는지는 따로 봐야 함.+++
                //let items = JSON.parse(a.getAttribute('data-ds-appid')).split(',').map(el => parseInt(el));
                appIds[key] = 'sub' + id;
                idForTitleCache[key] = appIds[key];
                console.info('added <'+key+'> to title cache.');
              }
              else {
                console.error('unsupported url:', res.finalUrl);
                return;
              }
            }
            localCount++;

            //console.info('<'+title+'> searched: '+localCount+'/'+count+' done...');
            if(localCount == count)
              preCallback_();
          }
        });
      }
    });

    function preCallback_() {
      toast.log('done searching on steam!');
      if(idForTitleCache)
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
    //console.info('pageAppIds', pageAppIds);  //dev
    //console.info('pageDivs', pageDivs);  //dev

    let followedCount = 0, ownedCount = 0, wishedCount = 0, ignoredCount = 0;
    pageAppIds.forEach((idOrIds, idIndex) => {
      let ids = idOrIds;
      if(!Array.isArray(idOrIds)) ids = [idOrIds];

      const divOrdivs = pageDivs[idIndex];
      let divs = divOrdivs;
      if(!Array.isArray(divOrdivs)) divs = [divOrdivs];

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
  function getInfo_(links = [], selectors, callBackFunc) {
    syncMenu.update(false, 'busy');
    toast.log('searching for infos...');

    if(!Array.isArray(selectors)) selectors = [selectors];
    let dicts = new Array(selectors.length).fill({}), count = links.length * selectors.length;

    if(count == 0) {
      console.info('links are empty. nothing done.');  //dev
      callBackFunc(dicts);
    }

    links.forEach(link => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: link,
        onload: res => {
          const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
          //console.info(doc);  //uncomment to see humblebundle's initial DOM
          selectors.forEach((selector, i) => {
            let dict = {...dicts[i]};
            if(doc.querySelector(selector))
              dict[link] = doc.querySelector(selector).innerText.trim() || 'blank text';
            else
              dict[link] = null;
            dicts[i] = {...dict};

            if(dicts.map(obj => Object.keys(obj).length).reduce((a, c) => a + c) == count) {
              toast.log('done searching on this site!');
              dicts.forEach((dict, i) => {
                dicts[i] = Object.fromEntries(Object.entries(dict).filter(([k, v]) => v));
              });

              syncMenu.update(true, 'ready');
              callBackFunc(dicts);
            }
          });
        }
      });
    });
  }

  async function fanaticalonMenuLoadingDone_() {
    pageDivs = [], pageAppIds = [], links = [];
    inverseBackground = false, styleModsString = '';
    titles = [], title = '';

    if(document.location.pathname.split('/').length > 3 && document.location.pathname.split('/')[2] == 'game') {
      //app page (including star deal page)
      await elementReady_('div.game-details>dl.row div a');
      links = [...document.querySelectorAll('div.game-details>dl.row div a')]
      .filter(el => el.host == "store.steampowered.com")
      .map(el => el.href);
      if(links.length > 0) {
        let tokens = links[0].replace(/\/$/, '').split('/');
        pageAppIds = [parseInt(tokens.pop())];
        if(tokens.pop() == 'sub') pageAppIds = ['sub' + pageAppIds[0]];
        pageDivs = [document.querySelector('h1')];
      }

      //'you may also like' 섹션은 다음 선택자로 main과 비슷하게 처리하면 되는데
      //로딩을 기다려야 하며 페이지 이동까지 해야 해서 귀찮다. 패스.
      //const commonCardSel = 'div:not([class$="-cloned"])>div>' + 'div.card-container>div[class]>div[class]';

      preEntry();
    }
    else if(document.location.pathname.split('/').length > 3 && (document.location.pathname.split('/')[2] == 'bundle' || document.location.pathname.includes('bundle') || document.location.pathname.includes('mix'))) {
      //bundle page
      await elementReady_('div.container .bundle-game-card, div.container .mystery-game', document.querySelector('div.content'), true);

      if(!document.querySelector('div.product-trust>div.card-body span')) {
        //mix bundle, etc.
        pageDivs = [...document.querySelectorAll('div[class*="-column-row"]>div.bundle-game-card, div[class*="-column-row"]>a>button.bundle-game-card')]
        .filter(el => el.querySelector('div.card-icons-price-container div.drm-container-steam'));

        if(pageDivs.length > 0) {
          let [start, end] = document.querySelector('div.carousel-buttons-container>div.carousel-count').innerText.split(' of ')
          .map(el => parseInt(el));

          let nextButton = document.querySelector('div.carousel-buttons-container>div>button+button');
          let target = document.querySelector('div#carousel-content');
          links = [target.querySelector('a.d-none') && target.querySelector('a.d-none').href];

          let observer = new MutationObserver(mutations => {
            links.push(target.querySelector('a.d-none') && target.querySelector('a.d-none').href);
            nextButton.click();
            if(links.length == end) {
              observer.disconnect();

              if('scrollRestoration' in history) history.scrollRestoration = 'manual';
              window.scrollTo(0, 0);

              //detail에서 스팀 링크가 없는 경우가 있어서...
              links.forEach((el, idx) => {
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
        else
          preEntry();  //nothing to do
      }
      else if(document.querySelector('div.product-trust>div.card-body span').parentNode.innerText == 'Redeem on Steam') {
        //jackbox bundle, etc.
        pageDivs = [...document.querySelectorAll('div.container div.container>div.row')];

        titles = pageDivs.map(el => (el.querySelector('p[class]').firstChild.textContent.trim()));
        searchSteam(titles, appIdsDict => {
          titles.forEach((title, index) => {
            pageAppIds[index] = appIdsDict[title];
          });
          preEntry();
        });
      }
      else
        preEntry();  //nothing to do
    }
    else if(document.location.pathname.split('/')[2] == 'redeem-code') {
      //redeem code page
      await elementReady_('div.carousel-buttons-container>div>button+button');

      pageDivs = [...document.querySelectorAll('div.redeem-product-card')]
      .filter(el => el.querySelector('div.product-icons-container>div.drm-container-steam'));
      titles = pageDivs.map(el => el.querySelector('div.product-name>a').innerText.trim());

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
      inverseBackground = true;
      styleModsString = 'fanatical-top_sellers';

      await elementReady_('div.ts-item a');

      pageDivs = [...document.querySelectorAll('div.ts-item')]
      .filter(el => el.querySelector('a').href.includes('/game/'))  //excludes bundles
      .filter(el => el.querySelector('div.icons-container>div.drm-container-steam'));  //&& el.querySelector('div.icons-container div.card-os-icons>span'));

      titles = pageDivs.map(el => el.querySelector('div.ts-title>a').innerText.trim());
      pageDivs = pageDivs.map(el => el.querySelector('div.card-overlay'));

      searchSteam(titles, appIdsDict => {
        titles.forEach((title, index) => {
          pageAppIds[index] = appIdsDict[title];
        });
        preEntry();
      });
    }
    else {
      //main, on-sale, etc...
      await elementReady_('div.container>div[class]', document.querySelector('div.content'), true, true);
      //console.log([...document.querySelector('div.content').querySelectorAll('div.container>div[class]')].map(el => el.className));  //dev

      const commonCardSel = 'div.card-container>div[class]>div[class]';
      pageDivs = [...document.querySelectorAll('div.container>div[class] ' + commonCardSel)]
      .concat(    ...document.querySelectorAll('div.container div.ais-Hits__root ' + commonCardSel))  //search
      .filter(el => el.querySelector('div[class$="price-container"]>div.drm-container-steam') && el.querySelector('div[class$="price-container"] div.card-os-icons>span'));

      titles = pageDivs.map(el => (el.querySelector('a') || (el.parentNode.querySelector('div.overlay-content-container a') && el.parentNode.querySelector('div.overlay-content-container a'))).innerText.trim());
      searchSteam(titles, appIdsDict => {
        titles.forEach((title, index) => {
          pageAppIds[index] = appIdsDict[title];
        });

        pageDivs = pageDivs.map(el => [el, el.querySelector('div.hitCardStripe')]);
        preEntry();
      });
    }
  }


  //utils
  function elementReady_(selector, baseEl = document.documentElement, waitFirst = false, checkIfAllChildrenAreAdded = false) {
    return new Promise((resolve, reject) => {
      let els = [...baseEl.querySelectorAll(selector)];
      if(els.length > 0 && !waitFirst) resolve(els[els.length-1]);
      
      this.prevElNumber = els.length;

      new MutationObserver(async (mutationRecords, observer) => {
        let els = [...baseEl.querySelectorAll(selector)];
        if(els.length > 0) {
          if(!checkIfAllChildrenAreAdded) {
            observer.disconnect();
            resolve(els[els.length-1]);
          }

          if(els.length > this.prevElNumber) {
            this.prevElNumber = els.length;
            await sleep_(1000);  //dirty hack
            if([...baseEl.querySelectorAll(selector)].length == this.prevElNumber) {
              observer.disconnect();
              resolve(els[els.length-1]);
            }
          }
        }
      })
      .observe(baseEl, {
        childList: true,
        subtree: true
      });
    });
    
    function sleep_(ms) {
      return new Promise(r => setTimeout(r, ms));
    }
  }


  function parentNodes_(el) {
    return [...(function*(e) {
      do
        yield e;
      while(e = e.parentNode);
    })(el)];
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
        this.div.textContent = txt;
        this.div.style.transition = '';
        this.div.style.opacity = 1;
        console.log(txt);
      }
    };
  }

})();