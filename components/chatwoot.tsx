'use client';

import Script from 'next/script';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

const CHATWOOT_TOKEN = 'cqpy71Mth5s2wtgUFi6CrqTr';
const CHATWOOT_URL = 'https://chat.alt3dstudio.com';

export function Chatwoot() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;
    const user = session.user as any;

    const identify = () => {
      (window as any).$chatwoot?.setUser(user.id, {
        name: user.name ?? undefined,
        email: user.email ?? undefined,
      });
    };

    if ((window as any).$chatwoot) {
      identify();
    } else {
      window.addEventListener('chatwoot:ready', identify, { once: true });
      return () => window.removeEventListener('chatwoot:ready', identify);
    }
  }, [session]);

  return (
    <Script
      id="chatwoot-sdk"
      src={`${CHATWOOT_URL}/packs/js/sdk.js`}
      strategy="afterInteractive"
      onLoad={() => {
        (window as any).chatwootSDK.run({
          websiteToken: CHATWOOT_TOKEN,
          baseUrl: CHATWOOT_URL,
        });
      }}
    />
  );
}
