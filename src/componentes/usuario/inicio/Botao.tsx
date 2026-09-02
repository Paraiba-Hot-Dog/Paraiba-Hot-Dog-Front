import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import iconeIfood from '../../../imagens/social/ifood.svg'

type BotaoBaseProps = {
  children: ReactNode
  variant?: 'ifood' | 'seta'
  external?: boolean
}

type BotaoProps =
  | (BotaoBaseProps &
      ButtonHTMLAttributes<HTMLButtonElement> & {
        href?: undefined
      })
  | (BotaoBaseProps &
      AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: string
        external?: boolean
      })

export default function Botao({
  children,
  className = '',
  variant = 'seta',
  href,
  external = false,
  ...props
}: BotaoProps) {
  const content = (
    <>
      <span>{children}</span>
      {variant === 'ifood' ? (
        <img
          src={iconeIfood}
          alt=""
          aria-hidden
          className="h-4 w-auto shrink-0 min-[490px]:h-[clamp(1rem,1rem+(100vw-30.625rem)*0.0019,1.25rem)]"
        />
      ) : (
        <ArrowRight
          aria-hidden
          className="h-4 w-4 shrink-0 min-[490px]:h-[clamp(1rem,1rem+(100vw-30.625rem)*0.0019,1.25rem)] min-[490px]:w-[clamp(1rem,1rem+(100vw-30.625rem)*0.0019,1.25rem)]"
          strokeWidth={2.5}
        />
      )}
    </>
  )

  const sharedClassName = [
    'inline-flex items-center justify-center gap-1.5 leading-none',
    'whitespace-nowrap rounded-[15px] bg-texture-botao bg-[length:180px] bg-repeat',
    'px-10 py-1.5 text-base',
    'min-[490px]:gap-[clamp(0.125rem,0.125rem+(100vw-30.625rem)*0.0015,0.375rem)]',
    'min-[490px]:px-[clamp(2rem,2rem+(100vw-30.625rem)*0.009,3.5rem)]',
    'min-[490px]:py-[clamp(0.5rem,0.5rem+(100vw-30.625rem)*0.0008,0.625rem)]',
    'min-[490px]:text-[clamp(1rem,1rem+(100vw-30.625rem)*0.0011,1.125rem)]',
    'font-barlow-condensed font-semibold text-preto-v1',
    'shadow-[inset_0_0_0_2px_rgba(255,255,255,0.45),inset_0_-2px_6px_rgba(0,0,0,0.25)]',
    'contrast-125 saturate-150',
    'transition-opacity hover:opacity-90 active:opacity-80',
    'disabled:cursor-not-allowed disabled:opacity-50',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (href) {
    const anchorProps = props as AnchorHTMLAttributes<HTMLAnchorElement>
    return (
      <a
        href={href}
        className={sharedClassName}
        target={external ? '_blank' : anchorProps.target}
        rel={external ? 'noopener noreferrer' : anchorProps.rel}
        {...anchorProps}
      >
        {content}
      </a>
    )
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button type={buttonProps.type ?? 'button'} className={sharedClassName} {...buttonProps}>
      {content}
    </button>
  )
}
