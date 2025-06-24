export type PostMessage = {
  id: number
}

export const postMessage = async (childId: string, message: string) => {
  const token = localStorage.getItem('bearer-token')
  if (!token) {
    throw new Error('No bearer token found')
  }

  const response = await fetch(`/api/messages/${childId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${token}`,
    },
    body: new URLSearchParams({
      message
    }),
  })
  if (!response.ok) {
    throw new Error('Failed to post message')
  }

  const data: PostMessage = await response.json()
  return data
}