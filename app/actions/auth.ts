'use server';

import { clearAuth, setAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const id = (formData.get('id') as string)?.trim();
  const allowedId = process.env.ALLOWED_ID?.trim();
  
  if (!id) {
    throw new Error('ID를 입력해주세요.');
  }
  
  if (!allowedId) {
    throw new Error('환경변수 ALLOWED_ID가 설정되지 않았습니다.');
  }
  
  if (id !== allowedId) {
    throw new Error('Invalid ID');
  }

  await setAuth(id);
  redirect('/');
}

export async function logoutAction() {
  await clearAuth();
  redirect('/login');
}

