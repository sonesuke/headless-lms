
import { CognitoIdentity, GetIdCommandOutput, GetCredentialsForIdentityCommandOutput } from '@aws-sdk/client-cognito-identity';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-browser';
import { HttpRequest } from '@aws-sdk/protocol-http';


const elements = document.querySelectorAll<HTMLDivElement>('div.headless');

console.log("runninng");
for (const element of elements) {
  console.log("select something");
  const dataModuleId: string = element.getAttribute("data-module-id")!;
  element.innerHTML = `
  <video
    id="my-video"
    class="video-js"
    controls
    preload="auto"
    width="640"
    height="360"
    data-setup='{ "playbackRates": [0.5, 1, 1.5, 2] }'
  >
    <source
      src="https://d2st3kmma5alup.cloudfront.net/${dataModuleId}/video.m3u8"
      type="application/x-mpegURL">
  </video>
  `
}

const cognitoIdentity = new CognitoIdentity({
  region: 'ap-northeast-1',
});

const params = {
  IdentityPoolId: 'ap-northeast-1:fe8b5b3f-67d1-405e-b8e3-aa74167e19f5',
}
   

cognitoIdentity.getId(params, (err: any, data?: GetIdCommandOutput) => {
  if (err) console.log(err, err.stack); // an error occurred
  else console.log(data);

  cognitoIdentity.getCredentialsForIdentity({IdentityId: data?.IdentityId}, (err: any, data?: GetCredentialsForIdentityCommandOutput) => {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log(data);           // successful response

    console.log(data?.Credentials?.AccessKeyId);
    console.log(data?.Credentials?.SecretKey);
    console.log(data?.Credentials?.SessionToken);

    const url = new URL("https://jvtznrflkzhorghtrs45orsuey.appsync-api.ap-northeast-1.amazonaws.com/graphql");

    const signature = new SignatureV4({
      service: 'appsync',
      region: 'ap-northeast-1',
      credentials: {
        accessKeyId: data?.Credentials?.AccessKeyId!,
        secretAccessKey: data?.Credentials?.SecretKey!,
        sessionToken: data?.Credentials?.SessionToken!,
      },
      sha256: Sha256,
    });

    const httpRequest = new HttpRequest({
      headers: {
        'content-type': 'application/json',
        host: url.host,
      },
      hostname: url.hostname,
      method: 'POST',
      path: url.pathname,
      body: '{ "query": "{ getAllHistory(userId: \\"1234\\"){ updatedAt }}"}',
    });

    signature.sign(httpRequest);

    const signedRequest = signature.sign(httpRequest);

    signedRequest.then((req) => {
      console.log({ req });

      const response = fetch(url.toString(), {
        headers: req.headers,
        method: 'POST',
        body: '{ "query": "{ getAllHistory(userId: \\"1234\\"){ updatedAt }}"}',
      });

      response.then((res) => {
        console.log({ status: res.status, body: res.body});
      });
    });
  });
});
