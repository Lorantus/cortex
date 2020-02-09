import request from 'request-promise';
import progress from 'request-progress';
import { access, createWriteStream, unlink } from 'fs';
export class DownloadEpisode {
    download(url, fileName, progressCallBack) {
        return new Promise((resolve, reject) => {
            access(fileName, err => {
                if (err && err.code === 'ENOENT') {
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
                        unlink(fileName, () => { });
                        progressCallBack.error(err);
                        reject(err);
                        Function.prototype;
                    })
                        .pipe(writefileStream);
                }
            });
        });
    }
}
//# sourceMappingURL=DownloadEpisode.js.map