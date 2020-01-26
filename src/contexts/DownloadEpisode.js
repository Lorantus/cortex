import request from 'request-promise';
import progress from 'request-progress';
import ProgressBar from 'cli-progress';
import fs from 'fs';

export default {
    download(url, fileName, progressCallBack = {}) {
        const applyEmptyIf = cb => cb && typeof cb === 'function' ? 
            cb : 
            () => {};

        const progressCbk = {
            start: applyEmptyIf(progressCallBack.start),
            progress: applyEmptyIf(progressCallBack.progress),
            end: applyEmptyIf(progressCallBack.end)
        };

        return new Promise((resolve, reject) => {
            fs.access(fileName, err => {
                if(err && err.code === 'ENOENT') {
                    const writefileStream = fs.createWriteStream(fileName);
                    progressCbk.start(fileName);
                    progress(request(url))
                        .on('progress', progressCbk.progress)
                        .on('end', () => {
                            writefileStream.end();
                            progressCbk.end();
                            resolve();
                        })
                        .on('error', err => {
                            writefileStream.end();
                            fs.unlink(fileName);
                            progressCbk.progressBar(err);
                            reject(err);
                        })
                        .pipe(writefileStream);
                }
            })
        })
    }
}