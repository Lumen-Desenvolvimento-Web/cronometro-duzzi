import { ThemeProvider } from "@/components/theme-provider"

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}