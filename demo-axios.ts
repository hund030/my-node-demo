import AdmZip from 'adm-zip';
import axios, { AxiosResponse } from 'axios';
import fs from 'fs-extra';
import LRU from 'lru-cache';
import Mustache from 'mustache';

const cache = new LRU({
    max: 1024 * 1024, // 1M
    length: (value: Buffer, key: string) => value.length + key.length,
});


async function fetchZipFromUrl(url: string): Promise<AdmZip> {
    let buffer: Buffer | undefined = cache.get(url);
    // TODO: download from url if buffer undefined
    if (!buffer) {
        const result: AxiosResponse<any> = await axios.get(url, {
            responseType: 'arraybuffer'
        });

        if (result.status !== 200) {
            throw new Error()
        }

        buffer = result.data
        cache.set(url, result.data);
    }

    return new AdmZip(buffer);
}

async function unzip(zip: AdmZip) {
    const result = await zip.extractAllToAsync('./out');
    console.log(result);
}

async function getEntries(zip: AdmZip) {
    zip.getEntries().filter((entry) => entry.entryName.endsWith('.json')).forEach(async (value) => {
        const buffer = value.getData().toString();
        await fs.writeFile(value.entryName.replace('.json', ''), Mustache.render(buffer, { "appName": "app1" }));
        console.log(value.entryName);
    })
}

fetchZipFromUrl('https://github.com/v2ray/v2ray-core/releases/download/v4.27.5/v2ray-freebsd-64.zip').then((zip) => {
    /*
    unzip(zip).then(() => {
        console.log('Finish.');
    })
    */
    getEntries(zip).then(() => {
        console.log('Finish.');
    })
})