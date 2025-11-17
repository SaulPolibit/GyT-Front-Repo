import Image from "next/image"
import { SignupForm } from "@/components/signup-form"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image
            src="/images/polibit-logo.png"
            alt="Polibit"
            width={200}
            height={60}
            priority
          />
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
