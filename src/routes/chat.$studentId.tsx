import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import dayjs from 'dayjs'
import React from 'react'

export const Route = createFileRoute('/chat/$studentId')({
  component: RouteComponent,
  loader: ({ params }) => {
    const { studentId } = params
    if (!studentId) {
      throw notFound()
    }

    return {
      messages: [
        { id: 1, text: 'Hello!', sender: 'student', createdAt: "2023-03-01T12:00:00Z" },
        { id: 2, text: 'Hi there!', sender: 'me', createdAt: "2023-03-01T12:01:00Z" },
        { id: 3, text: 'How are you?', sender: 'student', createdAt: "2023-03-01T12:02:00Z" },
      ],
    }
  }
})

function RouteComponent() {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = React.useRef<HTMLDivElement>(null)
  const [currentMessage, setCurrentMessage] = React.useState<string>('')

  const { messages: loadedMessages } = Route.useLoaderData()

  const [messages, setMessages] = React.useState(loadedMessages)

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
                  className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  {(() => {
                    const nextMsg = messages[idx + 1];
                    const showTime =
                      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                      !nextMsg ||
                      nextMsg.sender !== message.sender ||
                      dayjs(nextMsg.createdAt).diff(message.createdAt, 'minute') > 1;

                    return (
                      <div className={`stack space-y-1 ${showTime ? 'pb-4' : 'pb-1'} `}>
                        <div
                          className={`p-2 rounded-lg max-w-xs text-white ${message.sender === 'me'
                            ? 'bg-teal-500 text-white'
                            : 'bg-orange-400'
                            }`}
                        >
                          {message.text}
                        </div>
                        {showTime ? <div className={`text-xs text-gray-500 ${message.sender === 'me' ? 'text-right' : ''}`}>
                          {dayjs(message.createdAt).format('h:mm A')}
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

                setMessages((prev) => [
                  ...prev,
                  { id: Date.now(), text: message, sender: 'me', createdAt: new Date().toISOString() },
                ])
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
