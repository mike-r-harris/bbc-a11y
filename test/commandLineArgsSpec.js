/* eslint-env mocha */
const commandLineArgs = require('../lib/cli/args')
const assert = require('assert')

describe('commandLineArgs.parse(argv)', function () {
  it('parses --width integer as viewport width', function () {
    const args = commandLineArgs.parse(['node', 'bbc-a11y', '--width', '777'])
    assert.strictEqual(777, args.width)
  })

  it('parses --interactive as a boolean', function () {
    const args = commandLineArgs.parse(['node', 'bbc-a11y', '--interactive'])
    assert.strictEqual(true, args.interactive)
  })

  it('parses --config as a string', function () {
    const args = commandLineArgs.parse(['node', 'bbc-a11y', '--config', 'foo'])
    assert.strictEqual('foo', args.configPath)
  })

  it('parses all other arguments as URLs', function () {
    const args = commandLineArgs.parse(['node', 'bbc-a11y', 'foo', 'bar'])
    assert.deepStrictEqual(['foo', 'bar'], args.urls)
  })
})
