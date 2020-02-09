var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import request from 'request-promise';
import { existsSync, mkdirSync } from 'fs';
import sanitize from 'sanitize-filename';
import * as NodeID3 from 'node-id3';
import { resolve } from 'url';
import moment from 'moment';
import { DownloadEpisode } from './DownloadEpisode';
import { Context, EncodingType } from './Context';
class Couleur3Utils {
    constructor(url, destinationFolder) {
        this.url = url;
        this.destinationFolder = destinationFolder;
    }
    updateID3Tags(fullFileName, entry) {
        const tags = {
            album: entry.show.title,
            title: entry.chapter.title,
            artist: entry.show.vendor,
            year: moment(entry.chapter.date).year(),
            length: moment(entry.chapter.duration).toISOString().substring(11, 19),
            copyright: 'RTS',
            genre: '(186)',
            comment: {
                language: '',
                shortText: '',
                text: entry.chapter.description
            },
            'WOAF': entry.resource.url,
            'WOAS': entry.episode.absoluteOverviewUrl
            /* TODO
            image: {
                mime: 'jpeg',
                type: { id: 3, name: 'front cover' },
                description: undefined,
                imageBuffer: <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 02 00 00 64 00 64 00 00 ff ec 00 11 44 75 63 6b 79 00 01 00 04 00 00 00 64 0000 ff ee 00 0e 41 64 6f 62 65 00 64 ... >
            }
            */
        };
        NodeID3.write(tags, fullFileName);
    }
    getEpisodeContext(episode) {
        const chapter = episode.chapterList[0], resource = chapter.resourceList.find(resource => resource.encoding === EncodingType.MP3);
        const dateString = moment(chapter.date).format('YYYY-MM-DD'), name = sanitize(episode.title), ext = resource.encoding;
        return {
            extra: {
                episode,
                show: episode.show,
                resource,
                chapter,
                description: ''
            },
            fileName: `${dateString}-${name}.${ext}`,
            url: resource.url
        };
    }
    download(episode, multiProgressbar) {
        return __awaiter(this, void 0, void 0, function* () {
            const episodeContext = this.getEpisodeContext(episode), fileName = episodeContext.fileName, fullFileName = `${this.destinationFolder}/${fileName}`;
            const progressBar = multiProgressbar.create(100, 0);
            const progressActions = {
                start: () => progressBar.start(100, 0, { fileName, statut: ', démarrage' }),
                progress: state => progressBar.update(state.percent * 100, { fileName, statut: '' }),
                end: () => progressBar.update(100, { fileName, statut: ', terminé' }),
                error: err => progressBar.update(0, { fileName, statut: err.message })
            };
            const result = yield new DownloadEpisode().download(episodeContext.url, fullFileName, progressActions);
            this.updateID3Tags(fullFileName, episodeContext.extra);
            return result;
        });
    }
    buildDownloadPage(uri, queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield request({
                uri,
                qs: queryParams,
                transform: (body) => JSON.parse(body)
            });
        });
    }
    downloadFromURN(urn) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.buildDownloadPage(`https://il.srgssr.ch/integrationlayer/2.0/mediaComposition/byUrn/${urn}.json`);
        });
    }
    downloadRecurciveURL(actions) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.downloadURL(this.url, actions);
        });
    }
    downloadURL(url, actions) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.url) {
                console.log(`Download url: ${url}`);
                const domain = resolve(url, '/');
                try {
                    const jsonBody = yield this.buildDownloadPage(url);
                    let episodes = jsonBody.episodes;
                    yield actions(jsonBody.episodes);
                    if (jsonBody.nextPageUrl) {
                        const nextEpisodes = yield this.downloadURL(resolve(domain, jsonBody.nextPageUrl), actions);
                        episodes = [...episodes, ...nextEpisodes];
                    }
                    return episodes;
                }
                catch (error) {
                    console.log(error);
                }
            }
            else {
                return [];
            }
        });
    }
}
;
export default (idPodcast, destinationFolder = './dest') => {
    const url = `https://www.rts.ch/play/radio/show/${idPodcast}/latestEpisodes`;
    if (!existsSync(destinationFolder)) {
        mkdirSync(destinationFolder);
    }
    return new Context(new Couleur3Utils(url, destinationFolder));
};
//# sourceMappingURL=Couleur3Context.js.map