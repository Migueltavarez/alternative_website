'use client';

import Script from 'next/script';
import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

const CHATWOOT_TOKEN = 'dnP5D6V7mgLSqkftVPMR33tj';
const CHATWOOT_URL = 'https://chat.alt3dstudio.com';

export function Chatwoot() {
  const { data: session } = useSession();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    const user = session?.user as any;
    if (!user?.id) return;

    // Evitar re-identificar al mismo usuario en cada re-render de session
    if (identifiedUserId.current === user.id) return;

    const identify = async () => {
      let identifierHash: string | undefined;
      try {
        const res = await fetch('/api/chatwoot/hmac');
        const data = await res.json();
        identifierHash = data.hash ?? undefined;
      } catch {}

      (window as any).$chatwoot?.setUser(user.id, {
        name: user.name ?? undefined,
        email: user.email ?? undefined,
        identifier_hash: identifierHash,
      });

      identifiedUserId.current = user.id;
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
