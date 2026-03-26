import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import DemoSection from '@/components/DemoSection'
import Workflows from '@/components/Workflows'
import Testimonials from '@/components/Testimonials'
import Story from '@/components/Story'
import Pricing from '@/components/Pricing'
import FAQ from '@/components/FAQ'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <DemoSection />
      <Workflows />
      <Testimonials />
      <Story />
      <Pricing />
      <FAQ />
      <Contact />
      <Footer />
    </main>
  )
}