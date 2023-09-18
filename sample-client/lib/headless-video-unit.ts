import videojs from "video.js";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { createClinet, getHistoryQuery, pushHistory } from "./client";
import { trace } from "./trace";

export type VideoData = {
  contents: string;
};

export interface VideoProps {
  userId: string;
  unitId: string;
  data: VideoData;
}

@customElement("headless-video-unit")
export class HeadlessVideoUnit extends LitElement {
  @property({ attribute: "user-id" })
  userId = "";
  @property({ attribute: "unit-id" })
  unitId = "";
  @property({ attribute: "id-pool-id" })
  idPoolId = "";
  @property()
  endpoint = "";
  @property()
  data: VideoData = { } as VideoData;
  @property({ attribute: false })
  progress: number = 0;

  connectedCallback() {
    super.connectedCallback();
    trace("connected");
    const client = createClinet(this.idPoolId, this.endpoint);
    client
      .query(getHistoryQuery, {
        userId: this.userId,
        unitId: this.unitId,
      })
      .then((res) => {
        trace("query", res);
        if (res.data.getHistory.length > 0) {
          this.progress = res.data.getHistory[0].progress;
        }
      });
  }

  handleCompleted(e: Event) {
    trace("completed");
    const client = createClinet(this.idPoolId, this.endpoint);
    client
      .mutation(pushHistory, {
        userId: this.userId,
        unitId: this.unitId,
        progress: 100,
        data: JSON.stringify({}),
      })
      .then((res) => {
        trace("completed", res);
      });
  }

  render() {
    const classId = this.progress === 100 ? "vjs-big-play-retry" : "";
    return html`
      <video-js
        class="vjs-big-play-centered vjs-show-big-play-button-on-pause ${classId}"
        controls
        preload="auto"
        width="640"
        height="360"
        data-setup='{"playbackRates": [0.5, 1, 1.5, 2]}'
      >
        <source src="${this.data.contents}" type="application/x-mpegURL" />
      </video-js>
    `;
  }
}
