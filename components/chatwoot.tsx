'use client';

import { useEffect } from 'react';

export function Chatwoot() {
  useEffect(() => {
    const BASE_URL = 'https://chat.alt3dstudio.com';
    const script = document.createElement('script');
    script.src = BASE_URL + '/packs/js/sdk.js';
    script.async = true;
    script.onload = () => {
      (window as any).chatwootSDK.run({
        websiteToken: 'cqpy71Mth5s2wtgUFi6CrqTr',
        baseUrl: BASE_URL,
      });
    };
    document.head.appendChild(script);
  }, []);

  return null;
}
