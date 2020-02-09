var _a;
import ContextBuilder from './contexts/Couleur3Context';
const commander = {};
// Id       Emission
// 6656918  Cortex
// 9673679  Raconte-moi-une-histoire-vraie
// 10528249 Scanner
const idPodcast = 10528249;
ContextBuilder(idPodcast, (_a = commander) === null || _a === void 0 ? void 0 : _a.destinationFolder)
    .downloadPages();
//# sourceMappingURL=index.js.map