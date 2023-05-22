import { getHistoryQuery, pushHistory } from "./client";
import { trace } from "./trace";
import { Client } from "@urql/core";

export type ArticleData = {
  contents: string;
  button: {
    completed: string;
    incompleted: string;
  };
};

export interface ArticleProps {
  userId: string;
  unitId: string;
  data: ArticleData;
}

export const renderArticle = (
  client: Client,
  parent: HTMLDivElement,
  props: ArticleProps
) => {
  trace("render article", props);

  parent.innerHTML = props.data.contents;

  const completedButton = document.createElement("button");
  completedButton.innerHTML = props.data.button.incompleted;
  parent.appendChild(completedButton);

  client
    .query(getHistoryQuery, { userId: props.userId, unitId: props.unitId })
    .then((res) => {
      trace("query", res);
      if (!(res.data.getHistory?.length > 0)) {
        return;
      }

      const progress = res.data.getHistory[0].progress as number;
      if (progress == 100) {
        completedButton.innerHTML = props.data.button.completed;
      }
    });

  completedButton.addEventListener("click", () => {
    client
      .mutation(pushHistory, {
        userId: props.userId,
        unitId: props.unitId,
        progress: 100,
        data: JSON.stringify({}),
      })
      .then((res) => {
        trace("clicked", res);
      });
  });
};
