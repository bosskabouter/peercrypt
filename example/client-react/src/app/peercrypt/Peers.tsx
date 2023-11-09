import { useEffect, useState } from 'react';
import { ID, OnlineClient, SecureLayer } from '@peercrypt/online-client';

function Peers(): JSX.Element {
  const [key1, setKey1] = useState<ID>();
  const [key2, setKey2] = useState<ID>();

  const [local, setLocal] = useState(true);
  useEffect(() => {
    if (!key1) ID.create().then(setKey1);
    if (!key2) ID.create().then(setKey2);
  }, [key1, key2]);

  return (
    <div>
      <div>
        <input
          checked={local}
          type="checkbox"
          onChange={() => {
            setLocal(!local);
          }}
        />
        {'Connected with: '}
        {local ? 'local EP²' : 'public peerJS.com'}
      </div>
      {key1 !== undefined && key2 !== undefined && (
        <div>
          <div>
            <PeerInstance id={key1} local={local} />
          </div>
          <div>
            <PeerInstance
              id={key2}
              otherPeerId={key1.publicIdentifier}
              local={local}
            />
            {/* {key2.mnemonic} */}
          </div>
        </div>
      )}
    </div>
  );
}

function PeerInstance({
  id,
  otherPeerId,
  local,
}: {
  id: ID;
  otherPeerId?: string;
  local: boolean;
}): JSX.Element {
  const [onlineClient, setOnlineClient] = useState<OnlineClient>();

  const [online, setOnline] = useState<boolean>();
  const [isPeercryptServer, setIsPeercryptServer] = useState<boolean>();

  const [secureLayer, setSecureLayer] = useState<SecureLayer>();

  const [count, setCount] = useState(0);

  const [received, setReceived] = useState('');

  function listenAndStore(sl: SecureLayer): void {
    sl.addListener('decrypted', (value) => {
      setReceived(value as string);
    });
    setSecureLayer(sl);
  }
  useEffect(() => {
    const peer = local
      ? new OnlineClient(
          id,
          'ecf1e7001dbf36f184e8d1aab54084bb26cb927b6372ceefb92ea0c4bf612171',
          {
            host: 'localhost',
            port: 3000,
            path: '/online',
            debug: 0,
            secure: false,
            key: 'ecf1e7001dbf36f184e8d1aab54084bb26cb927b6372ceefb92ea0c4bf612171',
          }
        )
      : new OnlineClient(id);

    peer.isPeerCryptServer.then((isPeercryptServerVerified) => {
      console.info('Peercrypt Server Verified: ' + isPeercryptServerVerified);
      setIsPeercryptServer(isPeercryptServerVerified);
    });
    peer.on('connected', (secureLayer) => {
      console.info('connected', secureLayer);
      listenAndStore(secureLayer);
    });
    peer.on('open', () => {
      setOnline(true);
      if (otherPeerId !== undefined) {
        listenAndStore(peer.connect(otherPeerId));
      }
    });
    peer.on('error', (e) => {
      console.error(e);
    });
    setOnlineClient(peer);

    return () => {
      peer.disconnect();
      peer.destroy();
    };
  }, [id, local, otherPeerId]);

  function doSendText(): void {
    setCount(count + 1);
    secureLayer?.send(count.toString());
  }

  function shortenBase64(v: string | undefined): string {
    if (v === undefined || v === null) return 'no id';
    const maxLength = 10;
    const firstPart = v.substring(0, maxLength / 2);
    const lastPart = v.substring(v.length - maxLength / 2);
    return firstPart + '.....' + lastPart;
  }

  function getColorFromBase64(v: string | undefined): string {
    if (v === undefined || v === null) return 'red';
    let hash = 0;
    for (let i = 0; i < v.length; i++) {
      hash = v.charCodeAt(i) + ((hash << 5) - hash);
    }
    const red = (hash & 0xff0000) >> 16;
    const green = (hash & 0x00ff00) >> 8;
    const blue = hash & 0x0000ff;
    const colorPattern = `rgb(${red}, ${green}, ${blue})`;
    return colorPattern;
  }

  return (
    <div>
      <h1>
        <div style={{ color: getColorFromBase64(onlineClient?.id) }}>
          Peer ID: {shortenBase64(onlineClient?.id)}
        </div>

        {online ? (
          <div title="Online">
            <span role="img" aria-label="is online">
              🟢
            </span>
          </div>
        ) : (
          <div title="Offline">
            <span role="img" aria-label="is OFFLINE">
              🟥
            </span>
          </div>
        )}
        {isPeercryptServer ? (
          <span role="img" aria-label="EP2Peer Server">
            👮
          </span>
        ) : (
          <span role="img" aria-label="Generic PeerJS Server">
            😷
          </span>
        )}
        {secureLayer && (
          <span role="img" aria-label="Connected with other peer">
            🧅
          </span>
        )}

        <div>received: {received}</div>

        <button onClick={doSendText} color="green">
          Send {count}
        </button>
      </h1>
    </div>
  );
}
export default Peers;
