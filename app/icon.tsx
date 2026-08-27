import { faviconSvg } from '@/lib/favicon';

export const size = { width: 16, height: 16 };
export const contentType = 'image/svg+xml';

export default function Icon() {
  return new Response(faviconSvg(process.env.NODE_ENV === 'development'), {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
}
