var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Progress from 'cli-progress';
export var EncodingType;
(function (EncodingType) {
    EncodingType["AAC"] = "AAC";
    EncodingType["MP3"] = "MP3";
})(EncodingType || (EncodingType = {}));
export class Context {
    constructor(effectiveCxt) {
        this.effectiveCxt = effectiveCxt;
    }
    extractDownloadEpisodesNumber() {
        return __awaiter(this, void 0, void 0, function* () {
            let nbEpisodes = 0, nbDownload = 0;
            const results = yield this.effectiveCxt.downloadRecurciveURL((episodes) => {
                console.log(`Nombres d'épisodes: ${episodes.length}`);
                nbEpisodes += episodes.length;
                nbDownload++;
                return Promise.resolve(episodes);
            });
            console.log(`Nombre d'épisode(s): ${nbEpisodes} sur ${nbDownload} page(s)`);
            return results;
        });
    }
    extractDownloadInformations() {
        return __awaiter(this, void 0, void 0, function* () {
            const urls = [];
            yield this.effectiveCxt.downloadRecurciveURL((episodes) => __awaiter(this, void 0, void 0, function* () {
                episodes.map((episode) => __awaiter(this, void 0, void 0, function* () {
                    return yield this.effectiveCxt.downloadFromURN(episode.urn)
                        .then(episodeURN => Object.assign({}, episode, episodeURN))
                        .then(this.effectiveCxt.getEpisodeContext)
                        .then(context => {
                        urls.push({
                            url: context.url,
                            fileName: context.fileName
                        });
                    });
                }));
                return episodes;
            }));
            console.log("[playlist]");
            urls.forEach((context_1, index) => {
                const currentIndex = index + 1;
                console.log(`File${currentIndex}=${context_1.url}`);
                console.log(`Title${currentIndex}=${context_1.fileName}`);
            });
            return urls;
        });
    }
    downloadPages() {
        return __awaiter(this, void 0, void 0, function* () {
            const multiProgressbar = new Progress.MultiBar({
                format: `{bar} {percentage}% {fileName}{statut}`,
                barCompleteChar: '\u2588',
                barIncompleteChar: '\u2591',
                clearOnComplete: false,
                hideCursor: true
            });
            return this.effectiveCxt.downloadRecurciveURL((episodes) => __awaiter(this, void 0, void 0, function* () {
                episodes.map((episode) => __awaiter(this, void 0, void 0, function* () {
                    const episodeURN = yield this.effectiveCxt.downloadFromURN(episode.urn);
                    return yield this.effectiveCxt.download(Object.assign(Object.assign({}, episode), episodeURN), multiProgressbar);
                }));
                return Promise.resolve(episodes);
            }));
        });
    }
}
//# sourceMappingURL=Context.js.map