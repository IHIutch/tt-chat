import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import dayjs from 'dayjs'
import React from 'react'

type PostMessage = {
  id: number
}
type GetMessage = {
  id: number
  message: string
  from: "Student" | "Parent"
  created: Date
}

const fetchMessages = async (childId: string) => {
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

const postMessage = async (childId: string, message: string) => {
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

const messagesQueryOptions = (childId: string) => queryOptions({
  queryKey: ['messages', childId],
  queryFn: async () => await fetchMessages(childId),
})

export const Route = createFileRoute('/chat/$childId')({
  component: RouteComponent,
  loader: ({ params, context: { queryClient } }) => {
    const { childId } = params
    if (!childId) {
      return notFound()
    }

    const queryKey = messagesQueryOptions(childId).queryKey

    return {
      messages: queryClient.getQueryData(queryKey) || [],
    }
  }
})

function RouteComponent() {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = React.useRef<HTMLDivElement>(null)
  const [currentMessage, setCurrentMessage] = React.useState<string>('')

  const { childId } = Route.useParams()

  const messagesQuery = useSuspenseQuery(messagesQueryOptions(childId))
  const messages = messagesQuery.data
  const queryClient = useQueryClient()

  // add use mutation to post message and optmistic update the messages array
  const postMessageMutation = useMutation({
    mutationFn: ({ message }: { message: string }) => postMessage(childId, message),
    onMutate: async ({ message }) => {
      await queryClient.cancelQueries({ queryKey: messagesQueryOptions(childId).queryKey })

      const previousMessages = queryClient.getQueryData(messagesQueryOptions(childId).queryKey) as Array<GetMessage>

      queryClient.setQueryData(messagesQueryOptions(childId).queryKey, [
        ...previousMessages,
        { id: Date.now(), message, from: "Parent", created: new Date() },
      ])

      return { previousMessages }
    },
    onError: (error, { message }, context) => {
      queryClient.setQueryData(messagesQueryOptions(childId).queryKey, context?.previousMessages)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: messagesQueryOptions(childId).queryKey })
    },
  })

  return (
    <div className='fixed inset-0 overflow-hidden flex flex-col size-full'>
      <div className='bg-white shadow shadow-slate-200 z-10'>
        <div className="px-4 gap-4 flex h-12 shrink-0 items-center justify">
          <div className='flex-1 whitespace-nowrap'>
            <Link
              className='underline'
              to="/"
            >
              &lt; Back
            </Link>
          </div>
          <div className='max-w-2xl mx-auto w-full'>
            <div className="flex items-center">
              <div className='flex items-center gap-1'>
                <div className='font-bold rounded-full size-8 bg-orange-400 text-white flex items-center justify-center'>J</div>
                Jason
              </div>
            </div>
          </div>
          <div className='flex-1' />
        </div>
      </div>


      <div className='bg-slate-100 h-full min-h-0'>
        <div className="flex flex-col h-full">
          <main ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-2xl w-full mx-auto">
              {messages.map((message, idx) => (
                <div
                  key={message.id}
                  className={`flex ${message.from === "Parent" ? 'justify-end' : 'justify-start'}`}>
                  {(() => {
                    const nextMsg = messages[idx + 1];
                    const showTime =
                      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                      !nextMsg ||
                      nextMsg.from !== message.from ||
                      dayjs(nextMsg.created).diff(message.created, 'minute') > 1;

                    return (
                      <div className={`flex flex-col gap-1 items-end ${showTime ? 'pb-4' : 'pb-1'} `}>
                        <div
                          className={`p-2 rounded-lg max-w-xs text-white ${message.from === "Parent"
                            ? 'bg-teal-500 text-white'
                            : 'bg-orange-400'
                            }`}
                        >
                          {message.message}
                        </div>
                        {showTime ? <div className={`text-xs text-gray-500 ${message.from === 'Parent' ? 'text-right' : ''}`}>
                          {dayjs(message.created).format('h:mm A')}
                        </div> : null}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </main>
          <div className="p-4 shadow-[0_-1px_3px_0] shadow-slate-200 bg-white h-auto shrink-0">
            <div className="max-w-xl mx-auto">
              <form onSubmit={(event) => {
                event.preventDefault()
                const formData = new FormData(event.currentTarget)
                const message = formData.get('message') as string
                if (!message.trim()) return

                postMessageMutation.mutate({ message })
                const queryKey = messagesQueryOptions(childId).queryKey
                queryClient.invalidateQueries({ queryKey })


                if (textareaRef.current) {
                  textareaRef.current.value = ''
                  setCurrentMessage('')
                }
                // Scroll to the bottom of the chat
                setTimeout(() => {
                  chatContainerRef.current!.scrollTop = chatContainerRef.current!.scrollHeight
                }, 0)
              }} className="flex space-x-2">
                <div className="relative w-full">
                  <div className='invisible p-2 min-h-11 max-h-40.5 border'>
                    {currentMessage}
                  </div>
                  <textarea
                    required
                    ref={textareaRef}
                    name="message"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        buttonRef.current?.click()
                      }
                    }}
                    onChange={(event) => {
                      const el = event.currentTarget
                      // el.style.height = el.scrollHeight + 'px'
                      setCurrentMessage(el.value)
                    }}
                    placeholder="Type a message..."
                    className="bg-slate-100 border-slate-300 border w-full rounded-lg p-2 resize-none absolute inset-0 size-full"
                    rows={1}
                  />
                </div>
                <button type="submit" ref={buttonRef} className="rounded-full font-semibold px-4 bg-orange-400 text-white hover:bg-orange-500 transition-colors">
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
