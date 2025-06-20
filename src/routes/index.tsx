import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: RouteComponent,
  loader: () => {
    return {
      conversations: [
        { id: 1, name: 'Alice', lastMessage: 'See you tomorrow!' },
        { id: 2, name: 'Bob', lastMessage: 'Sounds good.' },
        { id: 3, name: 'Charlie', lastMessage: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut ut gravida risus. Donec quam nibh, sagittis ultrices neque vel, fringilla vulputate dui. Nam imperdiet diam quis nisi varius suscipit. Maecenas nec vulputate turpis. Praesent pharetra, neque vel imperdiet finibus, odio sapien commodo ex, ac sodales ex magna eget elit.' },
      ],
    }
  }
})

function RouteComponent() {
  const { conversations } = Route.useLoaderData()

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
                {conversations.map((convo) => (
                  <Link to="/chat/$studentId"
                    params={{ studentId: String(convo.id) }}
                    key={convo.id}
                    className="block p-4 rounded bg-white shadow hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="font-bold">{convo.name}</div>
                    <p className="line-clamp-1 text-gray-500">{convo.lastMessage}</p>
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
