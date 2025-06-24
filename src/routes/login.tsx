import { useForm } from '@tanstack/react-form'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import Button from '../components/button'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmitAsync: async ({ value }) => {
        const response = await fetch('/api/authenticate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            email: value.email,
            password: value.password,
            type: 'parent',
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.error) {
            return {
              form: data.error,
              fields: {}
            }
          } else {
            if (!data.token) {
              return {
                form: "Something went wrong, please try again.",
                fields: {}
              }
            }
            localStorage.setItem('bearer-token', data.token)
            navigate({ to: '/' })
          }
        } else {
          return {
            form: "Network error, please try again.",
            fields: {}
          }
        }
      }
    }
  })

  return (
    <div className="p-2 bg-slate-100 size-full fixed inset-0">
      <div className='max-w-sm w-full bg-white rounded shadow-sm mx-auto mt-32 overflow-hidden'>
        <div className='bg-teal-500 p-6'>
          <p className='text-white text-2xl font-bold text-center'>ThinkTech</p>
        </div>
        <div className='p-6'>
          <h1 className='text-2xl font-bold mb-4'>
            Parent Login
          </h1>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="flex flex-col gap-6">
            <form.Field
              name="email"
              children={(field) => (
                <div>
                  <label
                    htmlFor={field.name}
                    className="block mb-2 text-sm font-medium text-slate-800 dark:text-white"
                  >
                    Your email
                  </label>
                  <input
                    type="email"
                    id={field.name}
                    defaultValue={field.state.value}
                    onChange={(e) => field.handleChange(e.currentTarget.value)}
                    className="bg-slate-50 border border-slate-300 rounded-full h-10 w-full px-4"
                    required
                  />
                </div>
              )}
            />
            <form.Field
              name="password"
              children={(field) => (
                <div>
                  <label
                    htmlFor={field.name}
                    className="block mb-2 text-sm font-medium text-slate-800 dark:text-white"
                  >
                    Your password
                  </label>
                  <input
                    type="password"
                    id={field.name}
                    defaultValue={field.state.value}
                    onChange={(e) => field.handleChange(e.currentTarget.value)}
                    className="bg-slate-50 border border-slate-300 rounded-full h-10 w-full px-4"
                    required
                  />
                </div>
              )}
            />
            <form.Subscribe
              selector={s => [s.errorMap.onSubmit]}
              children={([formError]) => formError ? (
                <div className='bg-red-100 rounded p-2'>
                  <div className="text-red-800 text-sm font-medium">{formError}</div>
                </div>
              ) : null}
            />
            <form.Subscribe
              selector={(state) => [state.isSubmitting]}
              children={([isSubmitting]) => (
                <Button
                  type="submit"
                  className="rounded-full font-semibold px-4 bg-orange-400 text-white hover:bg-orange-500 transition-colors h-10 mx-auto min-w-24"
                  aria-disabled={isSubmitting}
                  isLoading={isSubmitting}
                  loadingText="Logging in..."
                >
                  Log In
                </Button>
              )}
            />
          </form>
        </div>
      </div>
    </div>
  )
}
