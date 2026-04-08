import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const selectVariants = cva(
  "flex w-full min-w-0 appearance-none rounded-md border bg-background px-3 py-2 pr-9 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 [&>option]:bg-background",
  {
    variants: {
      variant: {
        default:
          "border-input aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        error:
          "border-destructive ring-destructive/20 dark:ring-destructive/40",
      },
      size: {
        sm: "h-8 text-xs py-1.5",
        default: "h-9",
        lg: "h-10 text-base md:text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Select({
  className,
  variant,
  size,
  "aria-invalid": ariaInvalid,
  children,
  ...props
}: React.ComponentProps<"select"> & VariantProps<typeof selectVariants>) {
  const isError =
    variant === "error" ||
    ariaInvalid === true ||
    ariaInvalid === "true"

  return (
    <div className="relative w-full" data-slot="select-wrapper">
      <select
        data-slot="select"
        aria-invalid={isError ? true : ariaInvalid}
        className={cn(
          selectVariants({
            variant: isError ? "error" : (variant ?? "default"),
            size,
          }),
          className
        )}
        {...props}
      >
        {children}
      </select>
      <span
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4"
        aria-hidden
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </div>
  )
}

export { Select, selectVariants }
