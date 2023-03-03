import type { NextApiRequest, NextApiResponse } from "next";

import { generateNonce } from "@walletconnect/auth-client";
const waltIdNonce = async () =>
  await fetch("http://0.0.0.0:7000/api/nonce")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not OK");
      }
      return response.body;
    })
    .then((body) => {
      if (body == null) {
        return "";
      }
      const reader = body.getReader();

      return new ReadableStream({
        start(controller) {
          return pump();

          function pump(): Promise<"" | ReadableStream<any> | undefined> {
            return reader.read().then(({ done, value }) => {
              // When no more data needs to be consumed, close the stream
              if (done) {
                controller.close();
                return;
              }

              // Enqueue the next data chunk into our target stream
              controller.enqueue(value);
              return pump();
            });
          }
        },
      });
    })
    .then((stream) => new Response(stream))
    .then((response) => response.blob())
    .then((blob) => URL.createObjectURL(blob))
    .then((nonce) => nonce.split(":")[2])
    .catch((err) => console.error(err));

type Data = {
  customNonce: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({ customNonce: `${await waltIdNonce()}:${generateNonce()}` });
}
