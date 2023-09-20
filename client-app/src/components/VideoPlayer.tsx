import React from "react";
import videojs from "video.js";

import "video.js/dist/video-js.css";

interface VideoPlayerPorps {
  src: string;
}

export default class VideoPlayer extends React.Component<VideoPlayerPorps> {
  private player?: videojs.Player;
  private videoNode?: HTMLVideoElement;

  constructor(props: VideoPlayerPorps) {
    super(props);
    this.player = undefined;
    this.videoNode = undefined;
  }

  componentDidMount(): void {
    this.player = videojs(this.videoNode, {
      sources: [
        {
          src: this.props.src,
          type: "application/x-mpegURL",
        },
      ],
      controls: true,
      width: 640,
      height: 360,
      preload: "auto",
      playbackRates: [0.5, 1, 1.5, 2],
    });

    this.player.on("play", () => {
      console.log("playback started!");
    });

    this.player.on("endede", () => {
      console.log("playback ended!");
    });

    this.player.on("ended", () => {
      console.log("playback ended!");
    });

    this.player.on("timeupdate", () => {
      console.log(this.player?.currentTime());
    });
  }

  componentWillUnmount(): void {
    if (this.player) {
      this.player.dispose();
    }
  }

  render(): React.ReactNode {
    return (
      <div>
        <video
          ref={(node) => (this.videoNode = node)}
          className="video-js vjs-big-play-centered vjs-show-big-play-button-on-pause"
        />
      </div>
    );
  }
}
