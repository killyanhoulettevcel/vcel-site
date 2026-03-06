import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Workflows from '@/components/Workflows'
import Pricing from '@/components/Pricing'
import FAQ from '@/components/FAQ'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Workflows />
      <Pricing />
      <FAQ />
      <Contact />
      <Footer />
    </main>
  )
}
