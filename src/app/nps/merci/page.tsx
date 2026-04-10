'use client'
// src/app/nps/merci/page.tsx
import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Star, Heart, ArrowUpRight } from 'lucide-react'

function NpsMerciContent() {
  const params     = useSearchParams()
  const note       = parseInt(params.get('note') || '3')
  const isPromoter = params.get('positive') === '1'

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#F5F4F0', fontFamily: "'DM Sans', sans-serif",
      padding: '24px', textAlign: 'center',
    }}>
      <div style={{ maxWidth: 440, width: '100%' }}>

        <div style={{ marginBottom: 32 }}>
          <img src="/logo.png" alt="VCEL" style={{ height: 32, mixBlendMode: 'darken', opacity: 0.8 }} />
        </div>

        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: isPromoter ? 'linear-gradient(135deg, #E8F5E9, #F1F8E9)' : 'rgba(13,27,42,0.06)',
          border: isPromoter ? '1px solid #C8E6C9' : '1px solid rgba(13,27,42,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          {isPromoter
            ? <Heart size={30} fill="#16A34A" color="#16A34A" />
            : <Star size={30} color="#0288D1" />
          }
        </div>

        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#0D1B2A', marginBottom: 12 }}>
          {isPromoter ? 'Merci beaucoup ! 🎉' : 'Merci pour votre retour'}
        </h1>

        <p style={{ color: '#7A90A4', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          {isPromoter
            ? 'Votre avis positif nous aide énormément. Si vous avez 2 minutes, laissez-nous un avis public — ça aide d\'autres freelances à nous découvrir !'
            : 'Votre retour nous aide à améliorer VCEL. Merci de nous faire confiance.'
          }
        </p>

        {/* Étoiles affichées */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 32 }}>
          {[1,2,3,4,5].map(i => (
            <Star
              key={i}
              size={24}
              fill={i <= note ? '#F59E0B' : 'transparent'}
              color={i <= note ? '#F59E0B' : '#D1D5DB'}
            />
          ))}
        </div>

        {isPromoter && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a
              href="https://g.page/r/vcel/review"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 24px', borderRadius: 12,
                background: '#0D1B2A', color: '#ffffff',
                textDecoration: 'none', fontSize: 14, fontWeight: 600,
              }}
            >
              Laisser un avis Google
              <ArrowUpRight size={14} />
            </a>
            <a href="/dashboard" style={{ color: '#A8BDD0', fontSize: 13, textDecoration: 'none' }}>
              Retour au dashboard
            </a>
          </div>
        )}

        {!isPromoter && (
          <a href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 24px', borderRadius: 12,
            background: '#0D1B2A', color: '#ffffff',
            textDecoration: 'none', fontSize: 14, fontWeight: 600,
          }}>
            Retour au dashboard
          </a>
        )}
      </div>
    </div>
  )
}

export default function NpsMerciPage() {
  return (
    <Suspense>
      <NpsMerciContent />
    </Suspense>
  )
}