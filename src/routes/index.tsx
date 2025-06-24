import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

// [{ "id": "848", "first_name": "Chris", "last_name": "Moyer" }] %
type Chat = {
  id: string
  first_name: string
  last_name: string
}

const fetchChats = async () => {
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

const chatsQueryOptions = queryOptions({
  queryKey: ['chats'],
  queryFn: async () => await fetchChats(),
})

export const Route = createFileRoute('/')({
  component: RouteComponent,
  loader: ({ context: { queryClient } }) => {
    return {
      chats: queryClient.getQueryData(chatsQueryOptions.queryKey) || [],
    }
  },
})

function RouteComponent() {
  const postsQuery = useSuspenseQuery(chatsQueryOptions)
  const chats = postsQuery.data

  return (
    <div className='fixed inset-0 overflow-hidden flex flex-col size-full'>
      <div className="px-4 flex h-12 shrink-0 items-center justify bg-white shadow shadow-slate-200 z-10">
        <div className='max-w-2xl mx-auto w-full'>
          <Link
            to="/"
            activeOptions={{ exact: true }}
          >
            ThinkTech
          </Link>
        </div>
      </div>
      <div className='bg-slate-100 h-full min-h-0'>
        <div className="flex flex-col h-full">
          <main className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-2xl w-full mx-auto">
              <div className="space-y-4">
                {chats.map((chat) => (
                  <Link to="/chat/$childId"
                    params={{ childId: String(chat.id) }}
                    key={chat.id}
                    className="block p-4 rounded bg-white shadow hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="font-bold">{chat.first_name}</div>
                    <p className="line-clamp-1 text-gray-500">{chat.last_name}</p>
                  </Link>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
