// 재생 상태 관련 Web API (JSDoc 포함)

import { createSpotifyClient } from "@/lib/spotifyClient";
import { RepeatMode } from "@/types/spotify";

/**
 * [기기 등록] 내 웹 브라우저의 SDK(스피커)를 스포티파이 서버의 '현재 재생 기기'로 등록
 */
export async function transferToDevice(deviceId: string, accessToken: string) {
  const client = createSpotifyClient(accessToken);

  return client.put("me/player", {
    device_ids: [deviceId],
    play: false,
  });
}

/**
 * [곡 재생] 특정 곡(들)을 지정한 기기에서 재생하라고 서버에 명령
 */
export async function startPlayback(
  uris: string[],
  deviceId: string,
  accessToken: string,
  offsetIndex?: number,
) {
  const client = createSpotifyClient(accessToken);

  const body =
    offsetIndex !== undefined
      ? { uris, offset: { position: offsetIndex } }
      : { uris };

  return client.put(`me/player/play?device_id=${deviceId}`, body);
}

/**
 * [셔플 제어]
 * SDK 자체 셔플 제어 기능이 없어서 서버로 직접 요청
 */
export async function setShuffle(
  state: boolean,
  deviceId: string,
  accessToken: string,
) {
  const client = createSpotifyClient(accessToken);
  return client.put(`me/player/shuffle?state=${state}&device_id=${deviceId}`);
}

/**
 * [반복 제어] SDK 자체 반복 기능이 없어서 서버로 직접 요청
 * @param state 'track'(한곡), 'context'(전체), 'off'(반복 안함)
 */
export async function setRepeatMode(
  state: RepeatMode,
  deviceId: string,
  accessToken: string,
) {
  const client = createSpotifyClient(accessToken);
  return client.put(`me/player/repeat?state=${state}&device_id=${deviceId}`);
}
