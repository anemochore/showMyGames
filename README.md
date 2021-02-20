# showMyGames
show owned steam games on major game sites. running on [tampermonkey](https://www.tampermonkey.net/).

## features
1. scrapes user data from https://store.steampowered.com/dynamicstore/userdata/ and stores in browser ([location](https://stackoverflow.com/questions/16823686/where-does-gm-setvalue-store-data)). so steam login is required.
2. if a page has steam links, determines and marks if games on page are followed and/or owned or wishlisted or ignored.
3. if a page has no steam links, scrapes info from steam search page. so it's not perfect.
4. scraped info is stored in browser too.
5. not like app, bundle and package is partially supported due to there's no api or doc whatsoever.

## supported sites
1. www.dailyindiegame.com
2. www.indiegala.com
3. www.fanatical.com
4. www.humblebundle.com

## todo (too many)
0. ~~refactoring to use steam search on 2~~ (done on 0.8.0)
1. ~~main on 2~~ (done on 0.7.0)
2. pagination on list on 2
3. pagination on list on 4
4. related games on app page on 4
5. determine if a package (subId) is wishlisted
6. related games on app page on 3
7. genres, top-sellers, etc... list on 3 (partially done on 0.7.7)
99. 'traits' section on app page on 4
999. support other sites. any suggestion?

## history
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
    // ver 0.8.12 @ 2021-2-21
    //    fixed a bug on fanatical bundle pages
    //    temporarily stopped the parsing on fanatical main (and etc) pages