import React, { useEffect, useState } from "react";
import { OfflineClient, ID } from "@peercrypt/offline-client";

import TEST_VAPID_KEYS from "../../../../conf.json"
import { PushConfig } from "libs/offline/client/src/lib/config";

const PORT = 3000;

const serverConfig: PushConfig = {
  host: "localhost",
  port: PORT,
  path: "/offline",
  secure: false,
  PublicKey: "ecf1e7001dbf36f184e8d1aab54084bb26cb927b6372ceefb92ea0c4bf612171",
};

export default function PushYourself(): JSX.Element {
  const [id, setId] = useState<ID>();
  const [offlineClient, setOfflineClient] = useState<OfflineClient | null>();
  const [result, setResult] = useState<boolean>();

  const [count, setCount] = useState(0);
  useEffect(() => {
    (async () => {
      if (offlineClient !== undefined) return;
      const id = await ID.create();
      setId(id);
      setOfflineClient(await OfflineClient.register(id, serverConfig, import.meta.env.MODE));
    })().catch(console.error);
  }, [offlineClient]);

  return (
    <div>
      <div>Key: {id?.publicIdentifier}</div>
      <div>Push: {offlineClient?.sharedSubscription?.toString()}</div>
      <div>Result: {result?.toString()}</div>
      <button onClick={postMessage}>Push yourself</button>
    </div>
  );

  async function postMessage(): Promise<void> {
    setCount(count + 1);
    id !== undefined &&
      setResult(
        await pushSecureMessage("Hi again: " + count.toString(), id.publicIdentifier)
      );
  }

  async function pushSecureMessage(
    payload: string,
    peerId: string
  ): Promise<boolean | undefined> {
    return await offlineClient?.pushText(
      {
        body: payload,
        vibrate: [count * 1000, 100, 200, 1000],
      } as NotificationOptions,
      peerId,
      offlineClient.sharedSubscription
    );
  }
}
