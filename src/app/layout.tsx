export const metadata = {
  title: 'SVIM API',
  description: 'Shared BitCraft Item & Dependency API',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
