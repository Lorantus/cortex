import Context from './CortexContext';

const commander = {};

Context.buildContext({
    url: 'https://www.rts.ch/play/radio/show/6656918/latestEpisodes', 
    destinationFolder: commander.dest ? commander.dest : './dest'
}).extractDownloadInformations(commander.pages);