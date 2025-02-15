const { charHasRotatedVerticalOrientation } = require('./script_detection');

const verticalizedCharacterMap = {
  '!': '︕',
  '#': '＃',
  $: '＄',
  '%': '％',
  '&': '＆',
  '(': '︵',
  ')': '︶',
  '*': '＊',
  '+': '＋',
  ',': '︐',
  '-': '︲',
  '.': '・',
  '/': '／',
  ':': '︓',
  ';': '︔',
  '<': '︿',
  '=': '＝',
  '>': '﹀',
  '?': '︖',
  '@': '＠',
  '[': '﹇',
  '\\': '＼',
  ']': '﹈',
  '^': '＾',
  _: '︳',
  '`': '｀',
  '{': '︷',
  '|': '―',
  '}': '︸',
  '~': '～',
  '¢': '￠',
  '£': '￡',
  '¥': '￥',
  '¦': '￤',
  '¬': '￢',
  '¯': '￣',
  '–': '︲',
  '—': '︱',
  '‘': '﹃',
  '’': '﹄',
  '“': '﹁',
  '”': '﹂',
  '…': '︙',
  '‧': '・',
  '₩': '￦',
  '、': '︑',
  '。': '︒',
  '〈': '︿',
  '〉': '﹀',
  '《': '︽',
  '》': '︾',
  '「': '﹁',
  '」': '﹂',
  '『': '﹃',
  '』': '﹄',
  '【': '︻',
  '】': '︼',
  '〔': '︹',
  '〕': '︺',
  '〖': '︗',
  '〗': '︘',
  '！': '︕',
  '（': '︵',
  '）': '︶',
  '，': '︐',
  '－': '︲',
  '．': '・',
  '：': '︓',
  '；': '︔',
  '＜': '︿',
  '＞': '﹀',
  '？': '︖',
  '［': '﹇',
  '］': '﹈',
  '＿': '︳',
  '｛': '︷',
  '｜': '―',
  '｝': '︸',
  '｟': '︵',
  '｠': '︶',
  '｡': '︒',
  '｢': '﹁',
  '｣': '﹂'
};

function verticalizePunctuation(input) {
  let output = '';

  for (let i = 0; i < input.length; i++) {
    const nextCharCode = input.charCodeAt(i + 1) || null;
    const prevCharCode = input.charCodeAt(i - 1) || null;

    const canReplacePunctuation =
      (!nextCharCode || !charHasRotatedVerticalOrientation(nextCharCode) || verticalizedCharacterMap[input[i + 1]]) &&
      (!prevCharCode || !charHasRotatedVerticalOrientation(prevCharCode) || verticalizedCharacterMap[input[i - 1]]);

    if (canReplacePunctuation && verticalizedCharacterMap[input[i]]) {
      output += verticalizedCharacterMap[input[i]];
    } else {
      output += input[i];
    }
  }

  return output;
}

verticalizePunctuation.verticalizedCharacterMap = verticalizedCharacterMap;

module.exports = verticalizePunctuation;
