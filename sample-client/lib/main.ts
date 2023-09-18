import { createClinet } from "./client";
import { VideoData, renderVideo } from "./headless-video-unit";
import { trace } from "./trace";
import { QuizData, renderQuiz } from "./headless-quiz-unit";
import { getUnitQuery } from "./client";
import "./headless-unit";

export const render = (tag: string, userId:string, idPoolId: string, endPoint: string) => {
  // trace("runninng");
  // const client = createClinet(idPoolId, endPoint);
  // const elements = document.querySelectorAll<HTMLDivElement>(tag);
  // for (const element of elements) {
  //   trace("select something");
  //   const unitId: string = element.getAttribute("data-unit-id")!;
  //   client.query(getUnitQuery, { id: unitId }).then((res) => {
  //     trace("query", res);
  //     if (res.data.getUnit.length > 0) {
  //       const data = JSON.parse(res.data.getUnit[0].data);
  //       const type = res.data.getUnit[0].type as string;
  //       switch (type) {
  //         case "video":
  //           renderVideo(client, element, {
  //             userId,
  //             unitId,
  //             data: data as VideoData,
  //           });
  //           break;
  //         case "article":
  //           renderArticle(client, element, {
  //             userId,
  //             unitId,
  //             data: data as ArticleData,
  //           });
  //           break;
  //         case "quiz":
  //           renderQuiz(client, element, {
  //             userId,
  //             unitId,
  //             data: data as QuizData,
  //           });
  //           break;
  //         default:
  //           throw new Error("unknown type");
  //       }
  //     }
  //   });
  // }
};
