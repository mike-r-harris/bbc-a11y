/* eslint-env mocha */
const configLoader = require('../lib/config/loader')
const assert = require('assert')
const path = require('path')

describe('configLoader.loadConfigFromPath(pathToConfigModule)', function () {
  function pathToConfigModule (name) {
    return path.resolve(__dirname, './configs/' + name + '.js')
  }

  context('when the config module lists two pages', function () {
    it('resolves with a list of pages', function () {
      return configLoader.loadConfigFromPath(pathToConfigModule('simple'))
        .then(function (config) {
          assert.deepStrictEqual(config, {
            pages: [
              { url: 'https://www.bbc.co.uk' },
              { url: 'https://www.bbc.co.uk/news' }
            ]
          })
        })
    })
  })

  context('when the config module lists pages with skip and only elements', function () {
    it('resolves with a list of pages', function () {
      return configLoader.loadConfigFromPath(pathToConfigModule('skipAndOnly'))
        .then(function (config) {
          assert.deepStrictEqual(config, {
            pages: [
              { url: 'https://www.bbc.co.uk', skip: ['x'] },
              { url: 'https://www.bbc.co.uk/news', skip: ['y', 'z'] },
              { url: 'https://www.bbc.co.uk/sport', only: ['a'] },
              { url: 'https://www.bbc.co.uk/weather', only: ['b', 'c'] }
            ]
          })
        })
    })
  })

  context('when the config module specifies viewport width', function () {
    it('resolves with a list of pages', function () {
      return configLoader.loadConfigFromPath(pathToConfigModule('viewportWidth'))
        .then(function (config) {
          assert.deepStrictEqual(config, {
            pages: [
              { url: 'https://www.bbc.co.uk', width: 789 }
            ]
          })
        })
    })
  })

  context('when the config module has a syntax error', function () {
    it('rejects with the syntax error', function () {
      return configLoader.loadConfigFromPath(pathToConfigModule('syntaxError'))
        .then(function () {
          throw new Error('Expected a rejection')
        })
        .catch(function (e) {
          assert.strictEqual("Unexpected token '>'", e.message)
        })
    })
  })

  context('when there is a global page property', function () {
    let oldPage, hadPage

    beforeEach(function () {
      hadPage = 'page' in global
      oldPage = global.page
      global.page = 666
    })

    afterEach(function () {
      if (hadPage) { global.page = oldPage } else { delete global.page }
    })

    context('and the configuration is valid', function () {
      it('resets page to its previous value', function () {
        return configLoader.loadConfigFromPath(pathToConfigModule('empty'))
          .then(function () {
            assert.strictEqual(666, global.page)
          })
      })
    })

    context('and the configuration is invalid', function () {
      it('resets page to its previous value', function () {
        return configLoader.loadConfigFromPath(pathToConfigModule('syntaxError'))
          .then(function () {
            assert.strictEqual(666, global.page)
          })
          .catch(function () {
            assert.strictEqual(666, global.page)
          })
      })
    })
  })

  context('when there is no global page property', function () {
    let oldPage, hadPage

    beforeEach(function () {
      hadPage = 'page' in global
      oldPage = global.page
      delete global.page
    })

    afterEach(function () {
      if (hadPage) { global.page = oldPage } else { delete global.page }
    })

    context('and the configuration is valid', function () {
      it('does not set a page property', function () {
        return configLoader.loadConfigFromPath(path.resolve(__dirname, './configs/empty.js'))
          .then(function () {
            assert(!('page' in global))
          })
      })
    })

    context('and the configuration is invalid', function () {
      it('does not set a page property', function () {
        return configLoader.loadConfigFromPath(path.resolve(__dirname, './configs/syntaxError.js'))
          .then(function () {
            assert(!('page' in global))
          })
          .catch(function () {
            assert(!('page' in global))
          })
      })
    })
  })
})
