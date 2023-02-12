import { apiJSON } from "../sub/utils.js";
import { errorUnsupported, genericError } from "../sub/errors.js";

import loc from "../../localization/manager.js";

import { testers } from "./servicesPatternTesters.js";

import bilibili from "./services/bilibili.js";
import reddit from "./services/reddit.js";
import twitter from "./services/twitter.js";
import youtube from "./services/youtube.js";
import vk from "./services/vk.js";
import tiktok from "./services/tiktok.js";
import tumblr from "./services/tumblr.js";
import matchActionDecider from "./matchActionDecider.js";
import vimeo from "./services/vimeo.js";
import soundcloud from "./services/soundcloud.js";

export default async function (host, patternMatch, url, lang, obj) {
    try {
        let r, isAudioOnly = !!obj.isAudioOnly;

        if (!testers[host]) return apiJSON(0, { t: errorUnsupported(lang) });
        if (!(testers[host](patternMatch))) return apiJSON(0, { t: brokenLink(lang) });

        switch (host) {
            case "twitter":
                r = await twitter({
                    id: patternMatch["id"] ? patternMatch["id"] : false,
                    spaceId: patternMatch["spaceId"] ? patternMatch["spaceId"] : false,
                    lang: lang
                });
                break;
            case "vk":
                r = await vk({
                    url: url,
                    userId: patternMatch["userId"],
                    videoId: patternMatch["videoId"],
                    lang: lang,
                    quality: obj.vQuality
                });
                break;
            case "bilibili":
                r = await bilibili({
                    id: patternMatch["id"].slice(0, 12),
                    lang: lang
                });
                break;
            case "youtube":
                let fetchInfo = {
                    id: patternMatch["id"].slice(0, 11),
                    lang: lang,
                    quality: obj.vQuality,
                    format: "webm"
                };
                if (url.match('music.youtube.com') || isAudioOnly === true) obj.vFormat = "audio";
                switch (obj.vFormat) {
                    case "mp4":
                        fetchInfo["format"] = "mp4";
                        break;
                    case "audio":
                        fetchInfo["format"] = "webm";
                        fetchInfo["isAudioOnly"] = true;
                        fetchInfo["quality"] = "max";
                        isAudioOnly = true;
                        break;
                }
                r = await youtube(fetchInfo);
                break;
            case "reddit":
                r = await reddit({
                    sub: patternMatch["sub"],
                    id: patternMatch["id"],
                    title: patternMatch["title"],
                    lang: lang,
                });
                break;
            case "douyin":
            case "tiktok":
                r = await tiktok({
                    host: host,
                    postId: patternMatch["postId"],
                    id: patternMatch["id"],
                    lang: lang,
                    noWatermark: obj.isNoTTWatermark,
                    fullAudio: obj.isTTFullAudio,
                    isAudioOnly: isAudioOnly
                });
                break;
            case "tumblr":
                r = await tumblr({
                    id: patternMatch["id"],
                    url: url,
                    user: patternMatch["user"] ? patternMatch["user"] : false,
                    lang: lang
                });
                break;
            case "vimeo":
                r = await vimeo({
                    id: patternMatch["id"].slice(0, 11),
                    quality: obj.vQuality,
                    lang: lang
                });
                break;
            case "soundcloud":
                isAudioOnly = true;
                r = await soundcloud({
                    author: patternMatch["author"],
                    song: patternMatch["song"], url: url,
                    shortLink: patternMatch["shortLink"] ? patternMatch["shortLink"] : false,
                    accessKey: patternMatch["accessKey"] ? patternMatch["accessKey"] : false,
                    format: obj.aFormat,
                    lang: lang
                });
                break;
            default:
                return apiJSON(0, { t: errorUnsupported(lang) });
        }

        if (r.isAudioOnly) isAudioOnly = true;
        let isAudioMuted = isAudioOnly ? false : obj.isAudioMuted;

        if (r.error) return apiJSON(0, { t: Array.isArray(r.error) ? loc(lang, r.error[0], r.error[1]) : loc(lang, r.error) });

        return matchActionDecider(r, host, obj.ip, obj.aFormat, isAudioOnly, lang, isAudioMuted);
    } catch (e) {
        return apiJSON(0, { t: genericError(lang, host) })
    }
}
