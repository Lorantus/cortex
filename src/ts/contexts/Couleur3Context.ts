import request from 'request-promise';
import {existsSync, mkdirSync} from 'fs';
import sanitize from 'sanitize-filename';
import * as NodeID3 from 'node-id3';
import {resolve} from 'url';
import moment from 'moment';
import {ProgressListener, DownloadEpisode} from './DownloadEpisode';
import {Utils, Context, Episode, EncodingType, Entry, EpisodeContext} from './Context';

interface PageRequest {
    nextPageUrl: string;
    episodes: Episode[];
}

class Couleur3Utils implements Utils {

    constructor(public url: string, public destinationFolder: string) {
    }

    updateID3Tags(fullFileName: string, entry: Entry): void {
        const tags = {
            album: entry.show.title,
            title: entry.chapter.title,
            artist: entry.show.vendor,
            year: moment(entry.chapter.date).year(),
            length: moment(entry.chapter.duration).toISOString().substring(11, 19),
            copyright: 'RTS',
            genre: '(186)', // PODCAST
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

    getEpisodeContext(episode: Episode): EpisodeContext {
        const chapter = episode.chapterList[0],
            resource = chapter.resourceList.find(resource => resource.encoding === EncodingType.MP3)
        const dateString = moment(chapter.date).format('YYYY-MM-DD'),
            name = sanitize(episode.title),
            ext = resource.encoding;
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
        }
    }

    async download(episode: Episode, multiProgressbar: any): Promise<any> {
        const episodeContext: EpisodeContext = this.getEpisodeContext(episode),
            fileName: string = episodeContext.fileName,
            fullFileName: string = `${this.destinationFolder}/${fileName}`;

        const progressBar = multiProgressbar.create(100, 0);
        const progressActions: ProgressListener = {
            start: () => progressBar.start(100, 0, {fileName, statut: ', démarrage'}),
            progress: state => progressBar.update(state.percent * 100, {fileName, statut: ''}),
            end: () => progressBar.update(100, {fileName, statut: ', terminé'}),
            error: err => progressBar.update(0, {fileName, statut: err.message})
        };

        const result = await new DownloadEpisode().download(episodeContext.url, fullFileName, progressActions);
        this.updateID3Tags(fullFileName, episodeContext.extra);

        return result;
    }

    async buildDownloadPage(uri: string, queryParams?: string): Promise<PageRequest> {
        return await request({
            uri,
            qs: queryParams,
            transform: (body: string) => JSON.parse(body)
        });
    }

    async downloadFromURN(urn: string): Promise<PageRequest> {
        return await this.buildDownloadPage(`https://il.srgssr.ch/integrationlayer/2.0/mediaComposition/byUrn/${urn}.json`);
    }

    async downloadRecurciveURL(actions: (value: any) => Promise<Episode[]>): Promise<Episode[]> {
        return await this.downloadURL(this.url, actions);
    }

    async downloadURL(url: string, actions: (value: any) => Promise<Episode[]>): Promise<Episode[]> {
        if(this.url) {
            console.log(`Download url: ${url}`);
            const domain: string = resolve(url, '/');
            try {
                const jsonBody: PageRequest = await this.buildDownloadPage(url);
                let episodes = jsonBody.episodes;
                await actions(jsonBody.episodes);
                if(jsonBody.nextPageUrl) {
                    const nextEpisodes: Episode[] = await this.downloadURL(resolve(domain, jsonBody.nextPageUrl), actions);
                    episodes = [...episodes, ...nextEpisodes];
                }
                return episodes;
            } catch(error) {
                console.log(error);
            }
        } else {
            return [];
        }
    }
};

export default (idPodcast: number, destinationFolder: string = './dest'): Context => {
    const url: string = `https://www.rts.ch/play/radio/show/${idPodcast}/latestEpisodes`;

    if (!existsSync(destinationFolder)){
        mkdirSync(destinationFolder);
    }

    return new Context(new Couleur3Utils(url, destinationFolder));
}