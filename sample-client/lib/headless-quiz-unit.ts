import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { when } from "lit/directives/when.js";

import { createClinet, getHistoryQuery, pushHistory } from "./client";
import { trace } from "./trace";

type Quiz = {
  id: string;
  type: string; // "single" | "multiple"
  question: string;
  choices: [
    {
      order: number;
      text: string;
      checked: boolean;
      isCorrect?: boolean;
    }
  ];
  answerDescription: string;
};

export type QuizData = {
  contents: [Quiz];
  button: {
    completed: string;
    incompleted: string;
  };
};

type QuizHistory = {
  id: string;
  answer: [string];
};

@customElement("headless-quiz-unit")
class HeadlessQuizUnit extends LitElement {
  @property({ attribute: "user-id" })
  userId = "";
  @property({ attribute: "unit-id" })
  unitId = "";
  @property({ attribute: "id-pool-id" })
  idPoolId = "";
  @property()
  endpoint = "";
  @property()
  data: QuizData = {} as QuizData;
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
        const history = res.data.getHistory[0].data as QuizHistory;
        this.data.contents.forEach((quiz) => {
          quiz.choices.forEach((choice) => {
            choice.checked = history.answer.includes(choice.text);
          });
        });
        this.requestUpdate();
      });
  }

  handleClick(e: Event) {
    trace("buttonClicked");
    const data = this.data.contents.map((quiz) => {
      return {
        id: quiz.id,
        answers: quiz.choices
          .filter((choice) => choice.checked)
          .map((choice) => choice.text),
      };
    });

    const client = createClinet(this.idPoolId, this.endpoint);
    client
      .mutation(pushHistory, {
        userId: this.userId,
        unitId: this.unitId,
        progress: 100,
        data: JSON.stringify(data),
      })
      .then((res) => {
        trace("clicked", res);
      });
  }

  renderQuiz(quiz: Quiz, progress: number) {
    const inputType = quiz.type == "single" ? "radio" : "checkbox";
    return html` <div>
      ${repeat(
        quiz.choices,
        (choice) => choice.order,
        (choice, index) => html`
          <input
            type="${inputType}"
            id="${quiz.id}-${choice.order}"
            name="choice-${index}"
            value="${choice.text}"
            ${when(choice.checked, () => html`checked`)}
            @click=${(e: Event) => {
              choice.checked = !choice.checked;
            }}
          />
          <label for="${quiz.id}-${choice.order}">${choice}</label>
        `
      )}
      ${when(progress == 100, () => html`<div>${quiz.answerDescription}</div>`)}
    </div>`;
  }

  render() {
    trace("render", this.data);
    const buttonMessage =
      this.progress == 100
        ? this.data.button.completed
        : this.data.button.incompleted;
    const qustions = this.data.contents.map((quiz) => {
      this.renderQuiz(quiz, this.progress);
    });
    return html`
      ${qustions}
      <button @click=${this.handleClick}>${buttonMessage}</button>
    `;
  }
}
