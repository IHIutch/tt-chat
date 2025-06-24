export type GetMessage = {
  id: number
  message: string
  from: "Student" | "Parent"
  created: Date
}

export const fetchMessages = async (childId: string) => {
  const token = localStorage.getItem('bearer-token')
  if (!token) {
    throw new Error('No bearer token found')
  }

  const response = await fetch(`/api/messages/${childId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch messages')
  }
  const data: Array<GetMessage> = await response.json()
  return data
    .map((message) => {
      // Convert UTC time to local time
      const localTime = new Date(message.created + 'Z');
      return ({
        ...message,
        created: localTime,
      })
    }).sort((a, b) => a.created.getTime() - b.created.getTime())
}