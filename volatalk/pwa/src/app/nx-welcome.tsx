/*
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 This is a starter component and can be deleted.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 Delete this file and get started with your project!
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */

import { ID, OfflineClient } from '@peercrypt/offline-client';
import { useEffect, useState } from 'react';

export function NxWelcome({ title }: { title: string }) {
  const [id, setId] = useState<ID | null>(null);
  useEffect(() => {
    !id
      ? ID.create().then(setId)
      : OfflineClient.register(id, {
          port: 3000,
          host: 'boss-XPS-13-9360',
          path: '/offline',
          PublicKey:
            'ecf1e7001dbf36f184e8d1aab54084bb26cb927b6372ceefb92ea0c4bf612171',
          secure: false,
        });
  }, [id]);

  return <>Hoi: {id?.publicIdentifier}</>;
}

export default NxWelcome;
