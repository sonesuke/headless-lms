import { CognitoIdentity } from "@aws-sdk/client-cognito-identity";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-browser";
import { HttpRequest } from "@aws-sdk/protocol-http";
import * as urql from "@urql/core";
import { retryExchange } from "@urql/exchange-retry";
import { trace } from "./trace";

const toLocalStorage = (
  accessKeyId: string,
  secretAccessKey: string,
  sessionToken: string
) => {
  localStorage.setItem("accessKeyId", accessKeyId);
  localStorage.setItem("secretAccessKey", secretAccessKey);
  localStorage.setItem("sessionToken", sessionToken);
};

const clearLocalStorage = () => {
  localStorage.removeItem("accessKeyId");
  localStorage.removeItem("secretAccessKey");
  localStorage.removeItem("sessionToken");
};

const getCredential = async (idPoolId: string) => {
  let accessKeyId: string = localStorage.getItem("accessKeyId")!;
  let secretAccessKey: string = localStorage.getItem("secretAccessKey")!;
  let sessionToken: string = localStorage.getItem("sessionToken")!;

  if (accessKeyId && secretAccessKey && sessionToken) {
    return { accessKeyId, secretAccessKey, sessionToken };
  } else {
    const cognitoIdentity = new CognitoIdentity({
      region: "ap-northeast-1",
    });

    const params = {
      IdentityPoolId: idPoolId,
    };
    const data = await cognitoIdentity.getId(params);
    const data2 = await cognitoIdentity.getCredentialsForIdentity({
      IdentityId: data?.IdentityId,
    });
    accessKeyId = data2?.Credentials?.AccessKeyId!;
    secretAccessKey = data2?.Credentials?.SecretKey!;
    sessionToken = data2?.Credentials?.SessionToken!;
    toLocalStorage(accessKeyId, secretAccessKey, sessionToken);
    return { accessKeyId, secretAccessKey, sessionToken };
  }
};

const getSignature = async (idPoolId: string) => {
  return new SignatureV4({
    service: "appsync",
    region: "ap-northeast-1",
    credentials: await getCredential(idPoolId),
    sha256: Sha256,
  });
};

const awsFetch =
  (idPoolId: string) =>
  async (input: RequestInfo | URL, init?: RequestInit) => {
    let signature: SignatureV4 = await getSignature(idPoolId);
    let url: URL;
    if (typeof input === "string") {
      url = new URL(input);
    } else if (input instanceof URL) {
      url = input;
    } else {
      throw new Error("input is not URL or string");
    }

    const httpRequest = new HttpRequest({
      headers: {
        "content-type": "application/json",
        host: url.host,
      },
      hostname: url.hostname,
      method: "POST",
      path: url.pathname,
      body: init?.body,
    });
    const signed = await signature.sign(httpRequest);
    return fetch(input, {
      headers: signed.headers,
      method: "POST",
      body: init?.body,
    });
  };

export const createClinet = (idPoolId: string, endPoint: string) => {
  return urql.createClient({
    url: endPoint,
    fetch: awsFetch(idPoolId),
    exchanges: [
      retryExchange({
        retryWith: (error, operations) => {
          trace("retry", error.name, error.message);
          clearLocalStorage();
          if (!error.message.includes("expired")) {
            return null;
          }
          getCredential(idPoolId);
          return { ...operations };
        },
        maxNumberAttempts: 2,
      }),
      urql.fetchExchange,
    ],
  });
};

export const getHistoryQuery = urql.gql`
  query ($userId: ID!, $unitId: ID!) {
    getHistory(userId: $userId, unitId: $unitId) {
      progress
      data
    }
  }
`;

export const pushHistory = urql.gql`
  mutation ($userId: ID!, $unitId: ID!, $progress: Int!, $data: String!) {
    pushHistory(
      userId: $userId
      unitId: $unitId
      progress: $progress
      data: $data
    ) {
      userId
      unitId
      progress
      data
      updatedAt
    }
  }
`;

export const getUnitQuery = urql.gql`
    query ($id: ID!) {
      getUnit(id: $id) {
        type
        data
      }
    }
  `;
