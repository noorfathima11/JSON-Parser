/* /* jshint esversion: 6 */
let fs = require('fs')

fs.readFile('./reddit.json', 'utf-8', function (err, data) {
  if (err) return console.log(err)
  console.log('final', valueParser(data))
})

function valueParser (input) {
  let spaceCheck = spaceParser(input)
  if (spaceCheck !== null) input = spaceCheck[1]
  let valueArray = [
    nullParser,
    boolParser,
    numberParser,
    stringParser,
    arrayParser,
    objectParser
  ]
  // console.log(valueArray)
  for (let i = 0; i < valueArray.length; i++) {
    let result = valueArray[i](input)
    if (result !== null) return result
  }
  return null
}

function nullParser (input) {
  if (input.startsWith('null')) return [null, input.slice(4)]
  return null
}

function boolParser (input) {
  if (input.startsWith('true')) return [true, input.slice(4)]
  if (input.startsWith('false')) return [false, input.slice(5)]
  return null
}

function numberParser (input) {
  let regExpression = /^(-?(0|[1-9]\d*))(\.\d+)?(((e)(\+|-)?)\d+)?/ig
  if (/^-?0\d+/.test(input)) return null
  let m = input.match(regExpression)
  if (m === null) return null
  return [m[0] * 1, input.slice(m[0].length)]
}

function stringParser (input) {
  let remaining = ''
  let actual = ''
  if (!input.startsWith('"')) return null
  let inputRaw = input.substr(1)
  for (let i = 1; i < inputRaw.length; i++) {
    if (inputRaw.charAt(i) === '"' && inputRaw.charAt(i - 1) !== '\\') {
      actual = inputRaw.slice(0, i + 1).slice(0, -1)
      remaining = inputRaw.slice((i + 1))
      break
    }
    if (/\\/.test(inputRaw.charAt(i)) && /\\/.test(inputRaw.charAt(i - 1)) && /"/.test(inputRaw.charAt(i + 1))) {
      if (inputRaw.charAt(i - 2) === '\\') continue
      actual = '\\"'
      remaining = inputRaw.slice(i + 2)
      break
    }
  }
  if (/\\\\"/.test(actual)) return [actual, remaining]
  if (inputRaw.charAt(0) === '"') {
    actual = ''
    remaining = inputRaw.slice(1)
    return [actual, remaining]
  }
  for (let i = 1; i < actual.length; i++) {
    if (actual.charAt(i) === '\\') {
      let slashCheck = (actual.charAt(i + 1) === '"') || actual.charAt(i + 1) === '\\' || actual.charAt(i + 1) === '/' ||
      actual.charAt(i + 1) === 'b' || actual.charAt(i + 1) === 'f' || actual.charAt(i + 1) === 'n' ||
      actual.charAt(i + 1) === 'n' || actual.charAt(i + 1) === 'r' || actual.charAt(i + 1) === 't' || actual.charAt(i + 1) === 'u'
      if (slashCheck === false) return null
      if (actual.charAt(i + 1) === 'u') {
        let hexCheck = actual.slice(i + 1, i + 6)
        for (let i = 0; i < hexCheck.length; i++) {
          if (/u(\d|[A-F]){4}/i.test(hexCheck) !== true) return null
        }
      }
    }
  }
  return [actual, remaining]
}

/* function stringRegExParser (input) {
  let inputRaw = String.raw`${input}`
  let regEx = /^\"([^\\\\"]*|\\(\"|\\|\/|b|n|r|t|u(\d|[A-F]){4}))*\"/ig
  let remaining = ''
  if (regEx.test(inputRaw)) {
    remaining = inputRaw.slice(((inputRaw.match(regEx))).toString().length)
    if (remaining.includes('"')) return null
    return [inputRaw.match(regEx).join(''), (inputRaw.slice(((inputRaw.match(regEx))).toString().length))]
  } else return null
} */

function arrayParser (input) {
  if (!input.startsWith('[')) return null
  input = input.substr(1)
  let returnArray = []
  let spaceCheck = spaceParser(input)
  if (spaceCheck !== null) input = spaceCheck[1]
  while (!input.startsWith(']')) {
    input = valueParser(input)
    if (input === null) return null
    returnArray.push(input[0])
    let spaceCheck = spaceParser(input[1])
    if (spaceCheck !== null) input = spaceCheck[1]
    else input = input[1]
    let result = commaParser(input)
    if (result === null) break
    if (result[1].match(/^\s*h]\s*/)) return null
    input = result[1]
  }
  return [returnArray, input.slice(1)]
}

function objectParser (input) {
  if (!input.startsWith('{')) return null
  let returnObject = {}
  input = input.slice(1)
  let spaceCheck = spaceParser(input)
  if (spaceCheck !== null) input = spaceCheck[1]
  while (!input.startsWith('}')) {
    let spaceCheck = spaceParser(input)
    if (spaceCheck !== null) input = spaceCheck[1]
    input = stringParser(input)
    if (input === null) return null
    let prop, value
    [prop, value] = input
    spaceCheck = spaceParser(value)
    if (spaceCheck !== null) value = spaceCheck[1]
    value = colonParser(value)
    if (value === null) return null
    if ((/^\s*\}\s*/).test(value[1])) return null
    spaceCheck = spaceParser(value[1])
    if (spaceCheck !== null) input = spaceCheck[1]
    else input = value[1]
    value = valueParser(input)
    if (value === null) return null
    returnObject[prop] = value[0]
    spaceCheck = spaceParser(value[1])
    if (spaceCheck !== null) input = spaceCheck[1]
    else input = value[1]
    let result = commaParser(input)
    if (result === null) break
    if (result[1].match(/^\s*}\s*/)) return null
    input = result[1]
  }
  return [returnObject, input.slice(1)]
}

function spaceParser (input) {
  if (input.match(/^[\n*\s\n*]/)) {
    return [null, input.slice(input.match(/\S/).index)]
  }
  return null
}

function commaParser (input) {
  if (input.startsWith(',')) return [null, input.slice(1)]
  return null
}

function colonParser (input) {
  if (input.startsWith(':')) return [null, input.slice(1)]
  return null
}
