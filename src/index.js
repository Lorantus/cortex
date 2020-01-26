import Context from './contexts/Couleur3Context';

const commander = {};

// 6656918  Cortex
// 9673679  Raconte-moi-une-histoire-vraie
// 10528249 Scanner
const idPodcast = 10528249;

Context.buildContext({
    url: `https://www.rts.ch/play/radio/show/${idPodcast}/latestEpisodes`, 
    destinationFolder: commander.dest ? commander.dest : './dest'
}).extractDownloadEpisodesNumber(commander.pages);
