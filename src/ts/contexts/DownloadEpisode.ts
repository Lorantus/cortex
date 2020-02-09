import request from 'request-promise';
import progress from 'request-progress';
import {access, createWriteStream, unlink} from 'fs';

export interface ProgressListener {
    start: (fileName: string) => void;
    progress: (state: any) => void;
    end: () => void;
    error: (err: any) => void;
}

export class DownloadEpisode {
    download(url: string, fileName: string, progressCallBack: ProgressListener): Promise<any> {
        return new Promise((resolve, reject) => {
            access(fileName, err => {
                if(err && err.code === 'ENOENT') {
                    const writefileStream = createWriteStream(fileName);
                    progressCallBack.start(fileName);
                    progress(request(url))
                        .on('progress', progressCallBack.progress)
                        .on('end', () => {
                            writefileStream.end();
                            progressCallBack.end();
                            resolve();
                        })
                        .on('error', err => {
                            writefileStream.end();
                            unlink(fileName, () => {});
                            progressCallBack.error(err);
                            reject(err);
                            Function.prototype;
                        })
                        .pipe(writefileStream);
                }
            })
        })
    }
}