'use client'

import ToastProvider from './ToastProvider'
import AlertInterceptor from './AlertInterceptor'

export default function ClientToasts() {
  return (
    <>
      <ToastProvider />
      <AlertInterceptor />
    </>
  )
}

