import Progress from 'cli-progress';

export interface Utils {
    download(episode: Episode, multiProgressbar: any): Promise<any>;
    downloadFromURN(urn: string): Promise<any>;
    getEpisodeContext(episode: Episode): EpisodeContext;
    downloadRecurciveURL(actions: (value: Episode[]) => Promise<Episode[]>): Promise<Episode[]>;
}

export enum EncodingType {
    AAC = 'AAC',
    MP3 = 'MP3'
}

export interface Resource {
    url: string;
    encoding: EncodingType;
}

export interface Chapiter {
    title: string;
    date: string;
    duration: number;
    description: string;
    resourceList: Resource[];
}

export interface Show {
    title: string;
    vendor: string;
}

export interface Episode {
    title: string;
    show: Show;
    absoluteOverviewUrl: string;
    urn: string;
    chapterList: Chapiter[];
}

export interface Entry {
    show: Show
    chapter: Chapiter;
    episode: Episode;
    resource: Resource;
    description: string;
}

export interface EpisodeContext {
    fileName: string;
    url: string;
    extra: Entry;
}

interface Playlist {
    url: string;
    fileName: string;
}

export class Context {

    constructor(public effectiveCxt: Utils) {}

    async extractDownloadEpisodesNumber(): Promise<Episode[]> {
        let nbEpisodes = 0, 
            nbDownload = 0;
        const results = await this.effectiveCxt.downloadRecurciveURL((episodes: Episode[]) => {
            console.log(`Nombres d'épisodes: ${episodes.length}`);
            nbEpisodes += episodes.length;
            nbDownload++;
            return Promise.resolve(episodes);
        });
        console.log(`Nombre d'épisode(s): ${nbEpisodes} sur ${nbDownload} page(s)`);
        return results;
    }

    async extractDownloadInformations(): Promise<Playlist[]> {
        const urls: Playlist[] = [];

        await this.effectiveCxt.downloadRecurciveURL(
            async (episodes: Episode[]) => {
                episodes.map(async (episode: Episode): Promise<void> => 
                    await this.effectiveCxt.downloadFromURN(episode.urn)
                        .then(episodeURN => Object.assign({}, episode, episodeURN))
                        .then(this.effectiveCxt.getEpisodeContext)
                        .then(context => {
                            urls.push({
                                url: context.url,
                                fileName: context.fileName
                            });
                        }));
                return episodes;
        });
        console.log("[playlist]");
        urls.forEach((context_1, index) => {
            const currentIndex = index + 1;
            console.log(`File${currentIndex}=${context_1.url}`);
            console.log(`Title${currentIndex}=${context_1.fileName}`);
        });
        return urls;
    }

    async downloadPages(): Promise<any> {
        const multiProgressbar = new Progress.MultiBar({ 
            format: `{bar} {percentage}% {fileName}{statut}`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            clearOnComplete: false,
            hideCursor: true
        });
        return this.effectiveCxt.downloadRecurciveURL(
            async (episodes: Episode[]) => {
                episodes.map(async (episode: Episode) => {
                    const episodeURN = await this.effectiveCxt.downloadFromURN(episode.urn);
                    return await this.effectiveCxt.download({...episode, ...episodeURN}, multiProgressbar);
                });
                return Promise.resolve(episodes);
            })
    }
}