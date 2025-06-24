import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import dayjs from 'dayjs'
import React from 'react'
import clsx from 'clsx'
import { useForm } from '@tanstack/react-form'
import { fetchMessages } from '../utils/fetch/fetch-messages'
import { postMessage } from '../utils/fetch/post-message'
import { fetchChats } from '../utils/fetch/fetch-chats'
import type { GetMessage } from '../utils/fetch/fetch-messages';

const messagesQueryOptions = (childId: string) => queryOptions({
  queryKey: ['messages', childId],
  queryFn: async () => await fetchMessages(childId),
})

const chatsQueryOptions = queryOptions({
  queryKey: ['chats'],
  queryFn: async () => await fetchChats(),
})

export const Route = createFileRoute('/chat/$childId')({
  component: RouteComponent,
  loader: ({ params, context: { queryClient } }) => {
    const { childId } = params
    if (!childId) {
      return notFound()
    }

    const messagesQueryKey = messagesQueryOptions(childId).queryKey
    const chatsQueryKey = chatsQueryOptions.queryKey

    return {
      chats: queryClient.getQueryData(chatsQueryKey) || [],
      messages: queryClient.getQueryData(messagesQueryKey) || [],
    }
  }
})

function RouteComponent() {
  const queryClient = useQueryClient()
  const { childId } = Route.useParams()

  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const chatContainerRef = React.useRef<HTMLDivElement>(null)
  const [pageDidLoad, setPageDidLoad] = React.useState(false)

  const {
    data: messages,
    isSuccess: messagesLoaded,
  } = useSuspenseQuery(messagesQueryOptions(childId))
  const { data: currentChat } = useSuspenseQuery({
    ...chatsQueryOptions,
    select: (data) => data.find(chat => String(chat.id) === childId)
  })

  const postMessageMutation = useMutation({
    mutationFn: ({ message }: { message: string }) => postMessage(childId, message),
    onMutate: async ({ message }) => {
      await queryClient.cancelQueries({ queryKey: messagesQueryOptions(childId).queryKey })

      const previousMessages: Array<GetMessage> = queryClient.getQueryData(messagesQueryOptions(childId).queryKey) || []

      queryClient.setQueryData(messagesQueryOptions(childId).queryKey, [
        ...previousMessages,
        { id: Date.now(), message, from: "Parent", created: new Date() },
      ])

      return { previousMessages }
    },
    onError: (_error, _ctx, context) => {
      queryClient.setQueryData(messagesQueryOptions(childId).queryKey, context?.previousMessages)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: messagesQueryOptions(childId).queryKey })
    },
  })

  const form = useForm({
    defaultValues: {
      message: '',
    },
    onSubmit: ({ value, formApi }) => {
      postMessageMutation.mutate({
        message: value.message.trim(),
      })
      queryClient.invalidateQueries({ queryKey: messagesQueryOptions(childId).queryKey })
      formApi.reset()
      // Scroll to the bottom of the chat
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, 0)
    },
  })

  React.useEffect(() => {
    if (chatContainerRef.current && messagesLoaded && !pageDidLoad) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
      setPageDidLoad(true)
    }
  }, [messagesLoaded, pageDidLoad])

  const computedMessages = messages.map((message, idx) => {
    const nextMsg = messages[idx + 1] as GetMessage | undefined;
    const showTime =
      !nextMsg ||
      nextMsg.from !== message.from ||
      dayjs(nextMsg.created).diff(message.created, 'minute') > 1;

    return {
      ...message,
      showTime
    }
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
              {currentChat ? (
                <div className='flex items-center gap-2'>
                  <div className='font-bold rounded-full size-8 bg-orange-400 text-white flex items-center justify-center uppercase'>
                    {currentChat.first_name[0]}
                  </div>
                  <div className='text-lg font-semibold'>
                    {currentChat.first_name}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className='flex-1' />
        </div>
      </div>


      <div className='bg-slate-100 h-full min-h-0'>
        <div className="flex flex-col h-full">
          <main ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-2xl w-full mx-auto">
              {computedMessages.map((message) => (
                <div
                  key={message.id}
                  className={clsx(
                    'flex',
                    message.from === "Parent" ? 'justify-end' : 'justify-start'
                  )}>
                  <div className={clsx(
                    'flex flex-col gap-1 items-end',
                    message.showTime ? 'pb-4' : 'pb-1'
                  )}>
                    <div
                      className={clsx(
                        'p-2 rounded-lg max-w-xs text-white',
                        message.from === "Parent" ? 'bg-teal-500 text-white' : 'bg-orange-400'
                      )}
                    >
                      {message.message}
                    </div>
                    {message.showTime ? <div className={clsx(
                      'text-xs text-gray-500',
                      message.from === 'Parent' ? 'text-right' : ''
                    )}>
                      {dayjs(message.created).format('h:mm A')}
                    </div> : null}
                  </div>
                </div>
              ))}
            </div>
          </main>
          <div className="p-4 shadow-[0_-1px_3px_0] shadow-slate-200 bg-white h-auto shrink-0">
            <div className="max-w-2xl mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  form.handleSubmit()
                }}
                className="flex space-x-2">
                <div className="relative w-full">
                  <form.Subscribe
                    selector={(state) => [state.values.message]}
                    children={([messageVal]) => (
                      <div className='invisible p-2 min-h-11 max-h-40.5 border'>
                        {messageVal}
                      </div>
                    )}
                  />
                  <form.Field
                    name="message"
                    children={(field) => (
                      <textarea
                        required
                        name={field.name}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            buttonRef.current?.click()
                          }
                        }}
                        onChange={(event) => {
                          field.handleChange(event.currentTarget.value)
                        }}
                        value={field.state.value}
                        placeholder="Type a message..."
                        className="bg-slate-100 border-slate-300 border w-full rounded-lg p-2 resize-none absolute inset-0 size-full placeholder:text-gray-800"
                        rows={1}
                      />
                    )}
                  />
                </div>
                <form.Subscribe
                  selector={(state) => [state.isSubmitting]}
                  children={([isSubmitting]) => (
                    <button
                      type="submit"
                      ref={buttonRef}
                      className="rounded-full font-semibold px-4 bg-orange-400 text-white hover:bg-orange-500 transition-colors"
                      disabled={isSubmitting}
                    // TODO: handle loading state
                    >
                      Send
                    </button>
                  )}
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
