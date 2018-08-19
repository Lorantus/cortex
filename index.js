import Context from './CortexContext';

const commander = {};

// 6656918  Cortex
// 9673679  Raconte-moi-une-histoire-vraie
const idPodcast = 9673679;

Context.buildContext({
    url: `https://www.rts.ch/play/radio/show/${idPodcast}/latestEpisodes`, 
    destinationFolder: commander.dest ? commander.dest : './dest'
}).extractDownloadInformations(commander.pages);
