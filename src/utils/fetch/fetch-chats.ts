type Chat = {
  id: string
  first_name: string
  last_name: string
}

export const fetchChats = async () => {
  const token = localStorage.getItem('bearer-token')
  if (!token) {
    throw new Error('No bearer token found')
  }

  const response = await fetch('/api/children', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch chats')
  }
  const data: Array<Chat> = await response.json()
  return data
}