import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full min-w-0 rounded-md border bg-background px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
  {
    variants: {
      variant: {
        default:
          "border-input aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        error:
          "border-destructive ring-destructive/20 dark:ring-destructive/40",
      },
      size: {
        sm: "h-8 text-xs file:h-6",
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

function Input({
  className,
  type,
  variant,
  size,
  "aria-invalid": ariaInvalid,
  ...props
}: Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>) {
  const isError =
    variant === "error" ||
    ariaInvalid === true ||
    ariaInvalid === "true"

  return (
    <input
      type={type}
      data-slot="input"
      aria-invalid={isError ? true : ariaInvalid}
      className={cn(
        inputVariants({
          variant: isError ? "error" : (variant ?? "default"),
          size,
        }),
        className
      )}
      {...props}
    />
  )
}

export { Input, inputVariants }
