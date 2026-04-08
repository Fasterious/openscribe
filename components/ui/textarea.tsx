import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
  {
    variants: {
      variant: {
        default:
          "border-input aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        error:
          "border-destructive ring-destructive/20 dark:ring-destructive/40",
      },
      size: {
        sm: "min-h-[64px] text-xs py-1.5",
        default: "min-h-[80px]",
        lg: "min-h-[120px] text-base md:text-base py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Textarea({
  className,
  variant,
  size,
  "aria-invalid": ariaInvalid,
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  const isError =
    variant === "error" ||
    ariaInvalid === true ||
    ariaInvalid === "true"

  return (
    <textarea
      data-slot="textarea"
      aria-invalid={isError ? true : ariaInvalid}
      className={cn(
        textareaVariants({
          variant: isError ? "error" : (variant ?? "default"),
          size,
        }),
        className
      )}
      {...props}
    />
  )
}

export { Textarea, textareaVariants }
