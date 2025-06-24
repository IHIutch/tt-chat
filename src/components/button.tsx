import React from 'react'

export default function Button({
  className,
  children,
  isLoading,
  loadingText = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string
  children?: React.ReactNode
  isLoading?: boolean
  loadingText?: string
}) {

  return (
    <button type={props.type || 'button'} className={className} {...props}>
      {isLoading ? loadingText : children}
    </button>
  )
}
