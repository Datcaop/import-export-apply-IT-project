'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction, type LoginState } from './actions';

import { Suspense } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/';
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-[400px] mx-4">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#ffffff" strokeWidth="1.7" strokeLinejoin="round">
              <path d="M3 7 L10 3 L17 7 V15 L10 18 L3 15 Z" />
              <path d="M3 7 L10 11 L17 7" />
              <line x1="10" y1="11" x2="10" y2="18" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold text-text">ERP System</div>
            <div className="text-xs text-text-muted">Mua hàng · Kho · Bán hàng</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h1 className="text-xl font-bold text-text mb-1">Đăng nhập</h1>
          <p className="text-sm text-text-muted mb-6">Nhập tên đăng nhập và mật khẩu để tiếp tục.</p>

          {state.error && (
            <div className="mb-4 p-3 rounded-md bg-badge-danger text-danger text-sm">
              {state.error}
            </div>
          )}

          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="redirect" value={redirectTo} />

            <div className="flex flex-col">
              <label htmlFor="login-username" className="text-sm font-medium text-text mb-1.5">
                Tên đăng nhập
              </label>
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                required
                className="h-10 px-3 border border-border-input rounded-md text-sm text-text bg-surface focus:outline-2 focus:outline-primary focus:outline-offset-1"
                placeholder="Ví dụ: thuha"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="login-password" className="text-sm font-medium text-text mb-1.5">
                Mật khẩu
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-10 px-3 border border-border-input rounded-md text-sm text-text bg-surface focus:outline-2 focus:outline-primary focus:outline-offset-1"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="h-10 bg-primary text-white font-semibold text-sm rounded-md hover:bg-primary-hover disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>
        </div>

        <p className="text-xs text-text-faint text-center mt-6">
          © 2026 ERP System · Mua hàng, Kho, Bán hàng
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-bg" />}>
      <LoginContent />
    </Suspense>
  );
}
