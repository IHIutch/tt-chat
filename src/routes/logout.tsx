import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/logout')({
  beforeLoad: () => {
    localStorage.removeItem('bearer-token')
    throw redirect({
      to: '/login',
    })
  },
})
