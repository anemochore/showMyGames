# showMyGames
show owned steam games on major game sites. running on [tampermonkey](https://www.tampermonkey.net/).

## features
1. scrapes user data from https://store.steampowered.com/dynamicstore/userdata/ and stores in browser ([location](https://stackoverflow.com/questions/16823686/where-does-gm-setvalue-store-data)). so steam login is required.
2. if a page has steam links, determines and marks if games on page are followed and/or owned or wishlisted or ignored.
3. if a page has no steam links, scrapes info from steam search page. so it's not perfect.
4. not like app, bundle and package is partially supported due to there's no api or doc whatsoever.

## supported sites
1. www.dailyindiegame.com
2. www.indiegala.com
3. www.fanatical.com
4. www.humblebundle.com

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

## todo (too many)
1. ~~main on 2~~ (done on 0.7.0)
2. genres, etc list on 3
3. pagination on list on 2,4,3
4. related games on app page on 4
5. determine if a package (subId) is wishlisted
6. related games on app page on 3
7. genres, top-sellers, etc... list on 3

999. support other sites. any suggestion?
