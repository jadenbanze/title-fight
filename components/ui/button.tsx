import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
  {
    variants: {
      variant: {
        default: "bg-ink text-paper hover:bg-ink/90",
        outline: "border border-rule bg-transparent hover:border-ink/40 hover:bg-ink/[0.03]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "hover:bg-ink/[0.05]",
        link: "underline-offset-4 hover:underline",
        sideA: "bg-side-a text-paper hover:brightness-110",
        sideB: "bg-side-b text-paper hover:brightness-110",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 gap-1.5 px-3.5 text-[13px]",
        lg: "h-12 px-7 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
