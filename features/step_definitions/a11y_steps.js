/* eslint no-eval: "off" */
const { Given, When, Then } = require('@cucumber/cucumber')
const assert = require('assert')

const Standards = require('../../lib/standards')
const jquery = require('jquery')

Given('a website running on a11ytests.com', function () {

})

Given('a file named {string} with:', function (filePath, contents) {
  return this.writeFile(filePath, contents)
})

Given('all the tests pass', function () {
  return this.runA11y('https://a11ytests.com/perfect')
})

When('I run `bbc-a11y`', function () {
  return this.runA11y()
})

When('I run `bbc-a11y {url}`', function (url) {
  return this.runA11y(url)
})

When('I run `bbc-a11y {url} --interactive`', function (url) {
  return this.runA11yInteractively(url)
    .then(interactiveProcess => {
      this.interactiveProcess = interactiveProcess
    })
})

When('I run `bbc-a11y {url} --width {int}`', function (url, width) {
  return this.runA11y(`${url} --width ${width}`)
})

When('I run `bbc-a11y --config {configPath}`', function (configPath) {
  return this.runA11y(`--config ${configPath}`)
})

When('I run `bbc-a11y --reporter {reporter}`', function (reporter) {
  return this.runA11y(`--reporter ${reporter}`)
})

When('I run `bbc-a11y --help`', function () {
  return this.runA11y('--help')
})

When('I run `bbc-a11y --coverage list`', function () {
  return this.runA11y('--coverage list')
})

When('I run `bbc-a11y {url} --manual`', function (url) {
  return this.runA11yWithManualTests({ url })
})

When('I run a11y against a failing page', function () {
  return this.runA11y('https://a11ytests.com/missing_main_heading')
    .then(result => {
      this.stdout = result.stdout
      this.stderr = result.stderr
      this.exitCode = result.exitCode
    })
})

Given('a page with the HTML:', function (html) {
  this.pageFrame = document.createElement('iframe')
  document.body.appendChild(this.pageFrame)
  return new Promise((resolve, reject) => {
    this.pageFrame.addEventListener('load', function () {
      resolve()
    })
    this.pageFrame.srcdoc = html
  })
})

Given('a page with the body:', function (body) {
  this.pageFrame = document.createElement('iframe')
  document.body.appendChild(this.pageFrame)
  return new Promise((resolve, reject) => {
    this.pageFrame.addEventListener('load', function () {
      resolve()
    })
    this.pageFrame.srcdoc = '<html><body>' + body + '</body></html>'
  })
})

Given('I am performing a manual test of the {string} standard', function (standard) {
  return this.runA11yWithManualTests({ url: 'about:blank', only: [standard] })
})

Given('I have been asked {string}', function (question) {
  return this.assertCurrentQuestionIs(question)
})

When('I answer {string}', function (answer) {
  return this.answerQuestion(answer)
})

Then('the manual test fails', function () {
  return this.countAllErrors()
    .then(count => assert.notStrictEqual(count, 0))
})

Then('the manual test passes', function () {
  return this.countAllErrors()
    .then(count => assert.strictEqual(count, 0))
})

When('my page configuration is:', function (string) {
  eval(`this.pageConfiguration = ${string}`)
})

When('I test the {string} standard', function (name) {
  const $ = jquery(this.pageFrame.contentDocument)
  const matching = Standards.matching(name)
  if (matching.standards.length !== 1) throw new Error("Expected 1 standard called '" + name + "', found " + matching.standards.length)
  return matching.test($.find.bind($), this.pageConfiguration || {})
    .then(outcome => { this.outcome = outcome })
})

Then('it passes', function () {
  if ('exitCode' in this) {
    assert.strictEqual(this.exitCode, 0, '\n' + this.stdout + this.stderr)
  } else {
    const resultsWithErrors = this.outcome.results.filter(function (result) {
      return result.errors.length > 0
    })
    assert(resultsWithErrors.length === 0, '\nExpected pass, but it failed with:\n' + require('util').inspect(resultsWithErrors, false, null))
  }
})

Then('it passes with the warning:', function (message) {
  const pass = !this.outcome.results.find(function (result) {
    return result.errors.length > 0
  })
  assert(pass)
  const actualMessage = this.outcome.results.filter(function (result) {
    return result.warnings.length > 0
  }).map(function (result) {
    return result.warnings.map(function (e) {
      return e.map(function (a) {
        return a.xpath ? a.xpath : a
      }).join(' ')
    }).join('\n')
  }).join('\n')
  assert.strictEqual(actualMessage, message)
})

Then('it should fail with:', function (expectedOutput) {
  const actualOutput = this.stdout + this.stderr
  expectedOutput = expectedOutput.replace('[count all standards - 1]', Standards.all.length - 1)
  assert(actualOutput.indexOf(expectedOutput) > -1,
    '\n------------------\nExpected:\n------------------\n' +
    expectedOutput +
    '\n------------------\nActual:\n------------------\n' +
    actualOutput)
})

Then('it should fail with exactly:', function (expectedOutput) {
  const actualOutput = (this.stdout + this.stderr)
  // HACK: work around junk generated by missing xvfb
  const sanitisedActualOutput = actualOutput.split('\n').filter(line => line.indexOf('extension "RANDR" missing') === -1).join('\n')
  if (process.env.DEBUG_OUTPUT && sanitisedActualOutput !== expectedOutput) {
    console.log(sanitisedActualOutput)
    process.exit(1)
  }
  assert.strictEqual(sanitisedActualOutput, expectedOutput, 'Expected:\n' + expectedOutput.replace(/\n/g, '[\\n]\n') + '\nActual:\n' + sanitisedActualOutput.replace(/\n/g, '[\\n]\n'))
})

Then('it should pass with:', function (string) {
  const actualOutput = (this.stdout + this.stderr)
  if (actualOutput.indexOf(string) === -1) {
    throw new Error('Expected:\n' + string + '\nActual:\n' + actualOutput)
  }
  assert.strictEqual(this.exitCode, 0)
})

Then('it fails with the message:', function (message) {
  const actualMessage = this.outcome.results.filter(function (result) {
    return result.errors.length > 0
  }).map(function (err) {
    return err.errors.map(function (e) {
      return e.map(function (a) {
        return a.xpath ? a.xpath : a
      }).join(' ')
    }).join('\n')
  }).join('\n')
  assert.strictEqual(actualMessage, message)
})

Then('the exit status should be {int}', function (status) {
  assert.strictEqual(this.exitCode, status)
})

Then('the window should remain open', function () {
  return new Promise((resolve, reject) => {
    this.interactiveProcess.on('error', e => reject(e))
    this.interactiveProcess.on('close', (code, signal) => {
      resolve()
    })
    this.interactiveProcess.stdout.on('data', data => {
      if (data.toString().indexOf('Testing shows the presence, not the absence of bugs')) {
        setTimeout(() => reject(new Error('Failed to kill the process')), 500)
        this.interactiveProcess.kill('SIGINT')
      }
    })
  })
})

When('I answer the following questions:', function (table) {
  const questionsAndAnswers = table.hashes()
  return this.answerManualTestQuestions(questionsAndAnswers)
})

When('I answer all questions except one with a pass', function () {
  return this.answerAllManualTestQuestionsWithOneFail()
})

Then('it should result in a pass for {url}', function (url) {
  return this.countManualTestErrors(url)
    .then(count => assert.strictEqual(count, 0))
})

Then('it should result in a fail for {url}', function (url) {
  return this.countErrorsForUrl(url)
    .then(count => assert.notStrictEqual(count, 0))
})
