import { createContext, useContext } from 'react'

interface RedactedGroupContextValue {
  baseDelay: number
  stagger: number
}

const RedactedGroupContext = createContext<RedactedGroupContextValue>({
  baseDelay: 0.8,
  stagger: 0.3,
})

export const useRedactedGroup = () => useContext(RedactedGroupContext)

interface RedactedGroupProps {
  children: React.ReactNode
  baseDelay?: number
  stagger?: number
}

export default function RedactedGroup({
  children,
  baseDelay = 0.8,
  stagger = 0.3,
}: RedactedGroupProps) {
  return (
    <RedactedGroupContext.Provider value={{ baseDelay, stagger }}>
      {children}
    </RedactedGroupContext.Provider>
  )
}
