import request from 'request-promise';
import fs from 'fs';
import sanitize from 'sanitize-filename';
import NodeID3 from 'node-id3';
import URL from 'url';
import ProgressBar from 'cli-progress';
import DownloadEpisode from '../../ts/contexts/DownloadEpisode';

export default {
    buildContext({url, destinationFolder}) {
        const domain = URL.resolve(url, '/');

        if (!fs.existsSync(destinationFolder)){
            fs.mkdirSync(destinationFolder);
        }

        return {
            updateID3Tags(fullFileName, entry) {
                const tags = {
                    album: entry.show.title,
                    title: entry.chapter.title,
                    artist: entry.show.vendor,
                    year: entry.chapter.date.substring(0, 4),
                    length: new Date(entry.chapter.duration).toISOString().substring(11, 19),
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
            },

            getEpisodeContext(episode) {
                const chapter = episode.chapterList[0],
                    resource = chapter.resourceList.find(resource => resource.encoding === 'MP3')
                const dateString = chapter.date.substring(0, 10),
                    name = sanitize(episode.title),
                    ext = resource.encoding;
                return {
                    extra: {
                        episode,
                        show: episode.show,
                        resource,
                        chapter
                    },
                    fileName: `${dateString}-${name}.${ext}`,
                    url: resource.url
                }
            },

            getEpisodeContext(episode) {
                const chapter = episode.chapterList[0],
                    resource = chapter.resourceList.find(resource => resource.encoding === 'MP3')
                const dateString = chapter.date.substring(0, 10),
                    name = sanitize(episode.title),
                    ext = resource.encoding;
                return {
                    extra: {
                        episode,
                        show: episode.show,
                        resource,
                        chapter
                    },
                    fileName: `${dateString}-${name}.${ext}`,
                    url: resource.url
                }
            },

            async download(episode, multiProgressbar) {
                const episodeContext = this.getEpisodeContext(episode),
                    fileName = episodeContext.fileName,
                    fullFileName = `${destinationFolder}/${fileName}`;

                const progressBar = multiProgressbar.create(100, 0);
                const progressActions = {
                    start: () => progressBar.start(100, 0, {fileName, statut: ', démarrage'}),
                    progress: state => progressBar.update(state.percent * 100, {fileName, statut: ''}),
                    end: () => progressBar.update(100, {fileName, statut: ', terminé'}),
                    eror: err => progressBar.update(0, {fileName, statut: err.message})
                };

                await DownloadEpisode.download(episodeContext.url, fullFileName, progressActions);

                return this.updateID3Tags(fullFileName, episodeContext.extra);
            },

            buildDownloadPage(uri, queryParams) {
                return request({
                    uri,
                    qs: queryParams,
                    transform: body => JSON.parse(body)
                });
            },

            downloadFromURN(urn) {
                return this.buildDownloadPage(`https://il.srgssr.ch/integrationlayer/2.0/mediaComposition/byUrn/${urn}.json`);
            },

            downloadURL(url, actions) {
                let nextPageUrl;
                if(url) {
                    console.log(`Download url: ${url}`);
                    return this.buildDownloadPage(url)
                        .then(jsonBody => {
                            nextPageUrl = jsonBody.nextPageUrl;
                            return jsonBody;
                        })
                        .then(jsonBody => jsonBody.episodes)
                        .then(actions)
                        .then(() => nextPageUrl ? this.downloadURL(URL.resolve(domain, nextPageUrl), actions) : {})
                        .catch(error => console.log(error));
                } else {
                    return Promise.resolve();
                }
            },

            extractDownloadEpisodesNumber() {
                let nbEpisodes = 0, nbDownload = 0;
                this.downloadURL(url, 
                    episodes => {
                        console.log(`Nombres d'épisodes: ${episodes.length}`);
                        nbEpisodes += episodes.length;
                        nbDownload++;
                    })
                    .then(() => console.log(`Nombre d'épisode(s): ${nbEpisodes} sur ${nbDownload} page(s)`));
            },

            extractDownloadInformations() {
                const urls = [];

                this.downloadURL(url,
                    episodes => {
                        const actions = episodes.map(episode =>  
                            this.downloadFromURN(episode.urn)
                                .then(episodeURN => Object.assign({}, episode, episodeURN))
                                .then(this.getEpisodeContext)
                                .then(context => {
                                    urls.push({
                                        url: context.url,
                                        fileName: context.fileName
                                    })
                                })
                            )
                        return Promise.all(actions);
                    })
                    .then(() => {
                        console.log("[playlist]");
                        urls.forEach((context, index) => {
                            const currentIndex = index + 1;
                            console.log(`File${currentIndex}=${context.url}`)
                            console.log(`Title${currentIndex}=${context.fileName}`);
                        });
                    })
            },        

            downloadPages() {
                const multiProgressbar = new ProgressBar.MultiBar({ 
                    format: `{bar} {percentage}% {fileName}{statut}`,
                    barCompleteChar: '\u2588',
                    barIncompleteChar: '\u2591',
                    clearOnComplete: false,
                    hideCursor: true
                });
                this.downloadURL(url,
                    episodes => {
                        const actions = episodes.map(async episode => {
                            const episodeURN = await this.downloadFromURN(episode.urn);
                            return await this.download(Object.assign({}, episode, episodeURN), multiProgressbar);
                        });
                        return Promise.all(actions);
                    })
            }
        }
    }
}