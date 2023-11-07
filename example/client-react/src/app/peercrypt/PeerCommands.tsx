import React from 'react';
import CommandExecutor, { Command } from './Commander';
import { ID, OnlineClient } from '@peercrypt/online-client';

function PeerCommands() {
  let key: ID;
  let peer: OnlineClient;
  // let online: boolean;
  const commands: Command[] = [
    async () => {
      key = await ID.create();
      return key.publicIdentifier;
    },
    async () => {
      peer = new OnlineClient(key);
      return peer.toString();
    },
  ];
  return <CommandExecutor commandList={commands} />;
}

export default PeerCommands;
