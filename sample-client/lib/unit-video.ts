import videojs from "video.js";
import { getHistoryQuery, pushHistory } from "./client";
import { trace } from "./trace";
import { Client } from "@urql/core"

export type VideoData = {
  contents: string;
};

export interface VideoProps {
  userId: string;
  unitId: string;
  data: VideoData;
}

export const renderVideo = (client: Client, parent: HTMLDivElement, props: VideoProps) => {
  trace("render video", props);

  const element = document.createElement("video");
  parent.appendChild(element);
  element.setAttribute("class", "video-js");
  
  const player = videojs(element, {
    autoplay: false,
    controls: true,
    preload: "auto",
    window: 640,
    height: 360,
    playbackRates: [0.5, 1, 1.5, 2],
    sources: [
      {
        src: props.data.contents,
        type: "application/x-mpegURL",
      },
    ],
  });
  player.addClass("vjs-big-play-centered", "vjs-show-big-play-button-on-pause");

  const button = player.$(".vjs-big-play-button");
  button?.classList.remove("vjs-big-play-replay");
  trace("button", button);

  client
    .query(getHistoryQuery, { userId: props.userId, unitId: props.unitId })
    .then((res) => {
      trace("query", res);
      if (!(res.data.getHistory?.length > 0)) {
        return;
      }
      const data = JSON.parse(res.data.getHistory[0].data);
      player.currentTime(data.currentTime);
      button?.classList.add("vjs-big-play-replay");
    });

  player.on("ended", () => {
    const data = JSON.stringify({ currentTime: player.currentTime() });
    client
      .mutation(pushHistory, { userId: props.userId, unitId: props.unitId, progress: 100, data })
      .then((res) => {
        trace("ended", res);
      });
  });
};
