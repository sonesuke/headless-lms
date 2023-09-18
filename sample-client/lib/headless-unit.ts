import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { createClinet, getUnitQuery } from "./client";
import { trace } from "./trace";
import "./headless-article-unit";
import { ArticleData } from "./headless-article-unit";
import "./headless-quiz-unit";
import { QuizData } from "./headless-quiz-unit";
import "./headless-video-unit";
import { VideoData } from "./headless-video-unit";


@customElement("headless-unit")
export class HeadlessUnit extends LitElement {

  @property({ attribute: "unit-id" })
  unitId = "";
  @property({ attribute: "user-id" })
  userId = "";
  @property({ attribute: "id-pool-id" })
  idPoolId = "";
  @property()
  endpoint = "";

  @property({ attribute: false })
  type = ``;

  @property({ attribute: false })
  data = {};


  connectedCallback() {
    super.connectedCallback()
    trace("connected");
    trace(this.idPoolId, this.endpoint);
  
    const client = createClinet(this.idPoolId, this.endpoint);
    client.query(getUnitQuery, { id: this.unitId }).then((res) => {
      trace("query", res);
      if (res.data.getUnit.length > 0) {
        this.data = JSON.parse(res.data.getUnit[0].data);
        this.type = res.data.getUnit[0].type as string;
        this.requestUpdate();
      }
    });
  }

  render() {
    trace("render");
    trace(this.idPoolId, this.endpoint);
    switch (this.type) {
      case "video":
        const videoProps = this.data as VideoData;
        return html`<headless-video-unit
          user-id=${this.userId}
          unit-id=${this.unitId}
          id-pool-id=${this.idPoolId}
          endpoint=${this.endpoint}
          data=${videoProps.contents}
        ></headless-video-unit>`;
      case "article":
        const articleProps = this.data as ArticleData;
        return html`<headless-article-unit
          user-id=${this.userId}
          unit-id=${this.unitId}
          id-pool-id=${this.idPoolId}
          endpoint=${this.endpoint}
          data=${articleProps.contents}
          button-completed=${articleProps.button.completed}
          button-incompleted=${articleProps.button.incompleted}
        ></headless-article-unit>`;
      case "quiz":
        const quizProps = this.data as QuizData;
        return html`<headless-quiz-unit
          user-id=${this.userId}
          unit-id=${this.unitId}
          id-pool-id=${this.idPoolId}
          endpoint=${this.endpoint}
          data=${quizProps.contents}
          button-completed=${quizProps.button.completed}
          button-incompleted=${quizProps.button.incompleted}
        ></headless-quiz-unit>`;
      default:
        return html``;
    }
  }
}
