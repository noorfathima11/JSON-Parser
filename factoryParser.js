let fs = require('fs')

fs.readFile('./parseJSONData/allTestCases.json', 'utf-8', function (err, data) {
  if (err) return console.log(err)
  console.log('final', valueParser(data.toString()))
})

let nullParser = input => input.startsWith('null') ? [null, input.slice(4)] : null
let boolParser = input => input.startsWith('true') ? [true, input.slice(4)] : (input.startsWith('false') ? [false, input.slice(5)] : null)
let numberParser = (input, num, regEx = /^(-?(0|[1-9]\d*))(\.\d+)?(((e)(\+|-)?)\d+)?/ig) => (num = input.match(regEx)) ? [num[0] * 1, input.slice(num[0].length)] : null

let stringParser = input => {
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

let arrayParser = input => {
  if (!input.startsWith('[')) return null
  input = input.substr(1)
  let returnArray = []
  while (!input.startsWith(']')) {
    let spaceCheck
    input = (spaceCheck = spaceParser(input)) ? spaceCheck[1] : input
    let result1 = valueParser(input)
    if (!result1) { continue } returnArray.push(result1[0])
    input = result1[1]
    input = (spaceCheck = spaceParser(input)) ? spaceCheck[1] : input
    let result = commaParser(input)
    if (!result) continue
    if (result[1].match(/^\s*]\s*/)) return null
    input = result[1]
  }
  return [returnArray, input.slice(1)]
}

let objectParser = input => {
  if (!input.startsWith('{')) return null
  input = input.slice(1)
  let returnObject = {}
  while (!input.startsWith('}')) {
    let spaceCheck
    input = (spaceCheck = spaceParser(input)) ? spaceCheck[1] : input
    let result1 = stringParser(input)
    if (!result1) { continue } let [prop, value] = result1
    value = (spaceCheck = spaceParser(value)) ? spaceCheck[1] : value
    value = colonParser(value)
    if (!value) continue
    if ((/^\s*\}\s*/).test(value[1])) return null
    input = (spaceCheck = spaceParser(value[1])) ? spaceCheck[1] : value[1]
    value = valueParser(input)
    if (!value) { continue } returnObject[prop] = value[0]
    input = (spaceCheck = spaceParser(value[1])) ? spaceCheck[1] : value[1]
    let result = commaParser(input)
    if (result !== null) input = result[1]
  }
  return [returnObject, input.slice(1)]
}

let factoryParser = function (...parsers) {
  return input => {
    let spaceCheck
    input = (spaceCheck = spaceParser(input)) ? spaceCheck[1] : input
    for (let parser of parsers) {
      let result = parser(input)
      if (result !== null) return result
    }
    return null
  }
}

let valueParser = factoryParser(nullParser, boolParser, numberParser, stringParser, arrayParser, objectParser)
let spaceParser = input => input.match(/^[\n*\s\n*]/) ? [null, input.slice(input.match(/\S/).index)] : null
let commaParser = input => input.startsWith(',') ? [null, input.slice(1)] : null
let colonParser = input => input.startsWith(':') ? [null, input.slice(1)] : null
