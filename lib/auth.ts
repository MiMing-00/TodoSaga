import { cookies } from 'next/headers';

const ALLOWED_ID = process.env.ALLOWED_ID;

export async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  return userId === ALLOWED_ID;
}

export async function setAuth(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('userId', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30일
  });
}

export async function clearAuth(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
}

export function validateId(id: string): boolean {
  return id === ALLOWED_ID;
}

