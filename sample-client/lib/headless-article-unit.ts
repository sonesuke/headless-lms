import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { createClinet, getHistoryQuery, pushHistory } from "./client";
import { trace } from "./trace";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

export type ArticleData = {
  contents: string;
  button: {
    completed: string;
    incompleted: string;
  };
};

@customElement("headless-article-unit")
class HeadlessArticleUnit extends LitElement {
  @property({ attribute: "user-id" })
  userId = "";
  @property({ attribute: "unit-id" })
  unitId = "";
  @property({ attribute: "id-pool-id" })
  idPoolId = "";
  @property()
  endpoint = "";
  @property()
  data: ArticleData = {} as ArticleData;
  @property({ attribute: false })
  progress = 0;

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
        if (!(res.data.getHistory?.length > 0)) {
          return;
        }
        this.progress = res.data.getHistory[0].progress;
      });
  }

  handleClick(e: Event) {
    trace("buttonClicked");
    const client = createClinet(this.idPoolId, this.endpoint);
    client
      .mutation(pushHistory, {
        userId: this.userId,
        unitId: this.unitId,
        progress: 100,
        data: JSON.stringify({}),
      })
      .then((res) => {
        trace("clicked", res);
      });
  }

  render() {
    trace("render");
    const buttonMessage =
      this.progress == 100
        ? this.data.button.completed
        : this.data.button.incompleted;
    return html`
      ${unsafeHTML(this.data.contents)}
      <button @click=${this.handleClick}>${buttonMessage}</button>
    `;
  }
}
