import ContextBuilder from './contexts/Couleur3Context';

interface Commander {
    destinationFolder?: string;
    pages?: number[];
}

const commander: Commander = {};

// Id       Emission
// 6656918  Cortex
// 9673679  Raconte-moi-une-histoire-vraie
// 10528249 Scanner
const idPodcast: number = 10528249;

ContextBuilder(idPodcast, commander?.destinationFolder)
    .downloadPages();
