import { getHistoryQuery, pushHistory } from "./client";
import { Client } from "@urql/core"
import { trace } from "./trace";

type Quiz = {
  id: string;
  type: string; // "single" | "multiple"
  question: string;
  choices: [string];
  answer: [string];
  answerDescription: string;
};

export type QuizData = {
  contents: [Quiz];
  button: {
    completed: string;
    incompleted: string;
  };
};

export interface QuizProps {
  userId: string;
  unitId: string;
  data: QuizData;
}

type QuizHistory = {
  id: string;
  answer: [string];
};

const renderOneQuestion = (
  parent: HTMLDivElement,
  quiz: Quiz,
  history?: QuizHistory
) => {
  const question = document.createElement("div");
  question.innerHTML = quiz.question;
  parent.insertBefore(question, parent.lastChild);

  const choices = document.createElement("div");
  choices.setAttribute("id", quiz.id);

  let counter: number = 0;
  quiz.choices.forEach((choice) => {
    const choiceId = quiz.id + "-" + (counter++).toString();
    const choiceDivElement = document.createElement("div");
    const choiceInputElement = document.createElement("input");
    choiceInputElement.setAttribute(
      "type",
      quiz.type == "single" ? "radio" : "checkbox"
    );
    choiceInputElement.setAttribute("name", quiz.id);
    choiceInputElement.setAttribute("value", choice);
    choiceInputElement.setAttribute("id", choiceId);
    if (history?.answer.includes(choice)) {
      choiceInputElement.setAttribute("checked", "checked");
    }
    choiceDivElement.appendChild(choiceInputElement);

    const choiceLabelElement = document.createElement("label");
    choiceLabelElement.setAttribute("for", choiceId);
    choiceLabelElement.innerText = choice;

    choiceDivElement.appendChild(choiceLabelElement);
    choices.appendChild(choiceDivElement);
  });
  if (history?.answer) {
    const answerDescrption = document.createElement("div");
    answerDescrption.innerHTML = quiz.answerDescription;
    choices.appendChild(answerDescrption);
  }
  parent.insertBefore(choices, parent.lastChild);
};

export const renderQuiz = (client: Client, parent: HTMLDivElement, props: QuizProps) => {
  trace("render quiz", props);

  const completedButton = document.createElement("button");
  completedButton.innerHTML = props.data.button.incompleted;
  parent.appendChild(completedButton);

  client
    .query(getHistoryQuery, { userId: props.userId, unitId: props.unitId })
    .then((res) => {
      trace("query", res);
      if (res.data.getHistory?.length > 0) {
        const progress = res.data.getHistory[0].progress as number;
        if (progress == 100) {
          completedButton.innerHTML = props.data.button.completed;
        }
        props.data.contents.forEach((quiz) => {
          const histories = JSON.parse(res.data.getHistory[0].data) as [
            QuizHistory
          ];
          const history = histories.find((h) => h.id === quiz.id);
          renderOneQuestion(parent, quiz, history);
        });
      } else {
        props.data.contents.forEach((quiz) => {
          renderOneQuestion(parent, quiz);
        });
      }
    });

  completedButton.addEventListener("click", () => {
    const nodes = [...parent.childNodes];
    const quizHistories = nodes.map((node) => {
      if (node.nodeName === "DIV") {
        const question = node as HTMLDivElement;
        const id = question.getAttribute("id")!;
        if (id) {
          const choices = [...question.querySelectorAll("input")];

          const answers = choices.filter((input) => input.checked);
          trace(choices, answers);
          return { id, answer: answers.map((a) => a.getAttribute("value")) };
        }
      }
    });
    client
      .mutation(pushHistory, {
        userId: props.userId,
        unitId: props.unitId,
        progress: 100,
        data: JSON.stringify(quizHistories.filter((q) => q)),
      })
      .then((res) => {
        trace("clicked", res);
      });
  });
};
