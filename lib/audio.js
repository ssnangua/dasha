'use strict';

const { parseMimes } = require('./track');
const { parseBitrate, parseSize } = require('./util');

const AUDIO_CODECS = {
  AAC: 'AAC', // https://wikipedia.org/wiki/Advanced_Audio_Coding
  AC3: 'DD', // https://wikipedia.org/wiki/Dolby_Digital
  EC3: 'DD+', // https://wikipedia.org/wiki/Dolby_Digital_Plus
  OPUS: 'OPUS', // https://wikipedia.org/wiki/Opus_(audio_format)
  OGG: 'VORB', // https://wikipedia.org/wiki/Vorbis
  DTS: 'DTS', // https://en.wikipedia.org/wiki/DTS_(company)#DTS_Digital_Surround
  ALAC: 'ALAC', // https://en.wikipedia.org/wiki/Apple_Lossless_Audio_Codec
  FLAC: 'FLAC', // https://en.wikipedia.org/wiki/FLAC
};

const parseAudioCodecFromMime = (mime) => {
  const target = mime.toLowerCase().trim().split('.')[0];
  switch (target) {
    case 'mp4a':
      return AUDIO_CODECS.AAC;
    case 'ac-3':
      return AUDIO_CODECS.AC3;
    case 'ec-3':
      return AUDIO_CODECS.EC3;
    case 'opus':
      return AUDIO_CODECS.OPUS;
    case 'dtsc':
      return AUDIO_CODECS.DTS;
    case 'alac':
      return AUDIO_CODECS.ALAC;
    case 'flac':
      return AUDIO_CODECS.FLAC;
    default:
      throw new Error(`The MIME ${mime} is not supported as audio codec`);
  }
};

const parseAudioCodec = (codecs) => {
  const mimes = parseMimes(codecs);
  for (const mime of mimes) {
    try {
      return parseAudioCodecFromMime(mime);
    } catch (e) {
      continue;
    }
  }
  throw new Error(
    `No MIME types matched any supported Audio Codecs in ${codecs}`,
  );
};

const tryParseAudioCodec = (codecs) => {
  try {
    return parseAudioCodec(codecs);
  } catch (e) {
    return null;
  }
};

// https://professionalsupport.dolby.com/s/article/What-is-Dolby-Digital-Plus-JOC-Joint-Object-Coding?language=en_US
const getDolbyDigitalPlusComplexityIndex = (supplementalProps = []) => {
  const targetScheme =
    'tag:dolby.com,2018:dash:EC3_ExtensionComplexityIndex:2018';
  for (const prop of supplementalProps)
    if (prop.attributes.schemeIdUri === targetScheme)
      return parseInt(prop.attributes.value);
};

const checkIsDescriptive = (accessibilities = []) => {
  for (const accessibility of accessibilities) {
    const { schemeIdUri, value } = accessibility.attributes;
    const firstMatch =
      schemeIdUri == 'urn:mpeg:dash:role:2011' && value === 'descriptive';
    const secondMatch =
      schemeIdUri == 'urn:tva:metadata:cs:AudioPurposeCS:2007' && value === '1';
    const isDescriptive = firstMatch || secondMatch;
    if (isDescriptive) return true;
  }
  return false;
};

const parseChannels = (channels) => {
  const isDigit = (char) => char >= '0' && char <= '9';
  if (typeof channels === 'string') {
    if (channels.toUpperCase() == 'A000') return 2.0;
    else if (channels.toUpperCase() == 'F801') return 5.1;
    else if (isDigit(channels.replace('ch', '').replace('.', '')[0]))
      // e.g., '2ch', '2', '2.0', '5.1ch', '5.1'
      return parseFloat(channels.replace('ch', ''));
    throw new Error(`Unsupported audio channels value, '${channels}'`);
  }
  return parseFloat(channels);
};

const createAudioTrack = ({
  id,
  label,
  type,
  codec,
  channels,
  contentProtection,
  bitrate,
  duration,
  jointObjectCoding = 0,
  isDescriptive = false,
  language,
  segments,
}) => {
  const parsedBitrate = parseBitrate(Number(bitrate));
  const parsedChannels = parseChannels(channels);
  const size = duration
    ? parseSize(Number(bitrate), Number(duration))
    : undefined;
  return {
    id,
    label,
    type,
    codec,
    bitrate: parsedBitrate,
    size,
    protection: contentProtection,
    language,
    segments,
    channels: parsedChannels,
    jointObjectCoding,
    isDescriptive,
    toString() {
      return [
        'AUDIO',
        `[${codec}]`,
        `${parsedChannels || '?'}` +
          (jointObjectCoding ? ` (JOC ${jointObjectCoding})` : ''),
        `${parsedBitrate.kbps} kb/s`,
        language,
      ].join(' | ');
    },
  };
};

module.exports = {
  AUDIO_CODECS,
  parseAudioCodec,
  tryParseAudioCodec,
  createAudioTrack,
  getDolbyDigitalPlusComplexityIndex,
  checkIsDescriptive,
};
