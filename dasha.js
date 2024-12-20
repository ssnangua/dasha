'use strict';

const dash = require('./lib/dash');
const hls = require('./lib/hls');
const {
  filterByResolution,
  filterByQuality,
  filterByCodecs,
  filterByLanguages,
  filterByChannels,
} = require('./lib/track');
const { SUBTITLE_CODECS } = require('./lib/subtitle');

const parse = (text, url, fallbackLanguage) => {
  if (text.includes('<MPD'))
    return dash.parseManifest(text, url, fallbackLanguage);
  else if (text.includes('#EXTM3U')) return hls.parseManifest(text, url);
  else throw new Error('Invalid manifest');
};

module.exports = {
  parse,
  filterByResolution,
  filterByQuality,
  filterByCodecs,
  filterByLanguages,
  filterByChannels,
  SUBTITLE_CODECS,
};
