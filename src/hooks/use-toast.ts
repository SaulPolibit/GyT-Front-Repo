import { toast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  action?: {
    label: string
    onClick: () => void
  }
}

export function useToast() {
  return {
    toast: (props: ToastProps) => {
      if (props.variant === "destructive") {
        return toast.error(props.title || "Error", {
          description: props.description,
        })
      }

      return toast.success(props.title || "Success", {
        description: props.description,
      })
    },
  }
}
