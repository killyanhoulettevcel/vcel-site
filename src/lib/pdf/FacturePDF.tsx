// src/lib/pdf/FacturePDF.tsx
import {
  Document, Page, Text, View, StyleSheet, Font
} from '@react-pdf/renderer'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ProfilVendeur {
  nom:             string
  email:           string
  siret?:          string
  forme_juridique?: string
  adresse?:        string
  code_postal?:    string
  ville?:          string
  tva_intracom?:   string
  telephone?:      string
  site_web?:       string
  iban?:           string
}

export interface LigneFacture {
  description:   string
  quantite:      number
  prix_unitaire: number
  taux_tva:      number
  total_ht:      number
}

export interface FactureData {
  numero_facture:      string
  type_facture:        'facture' | 'avoir' | 'acompte' | 'proforma'
  date_facture:        string
  date_echeance?:      string
  objet?:              string
  client_nom?:         string
  client_email?:       string
  client_adresse?:     string
  client_siret?:       string
  client_tva_intra?:   string
  lignes:              LigneFacture[]
  montant_ht:          number
  tva:                 number
  montant_ttc:         number
  conditions_paiement?: string
  mentions_legales?:   string
  statut:              string
}

// ── Styles ────────────────────────────────────────────────────────────────────
const NAVY  = '#0D1B2A'
const CYAN  = '#0288D1'
const GREY  = '#7A90A4'
const LIGHT = '#F5F4F0'
const WHITE = '#FFFFFF'
const RED   = '#DC2626'
const PURPLE = '#7C3AED'

const s = StyleSheet.create({
  page:           { fontFamily: 'Helvetica', fontSize: 9, color: NAVY, backgroundColor: WHITE, paddingHorizontal: 40, paddingVertical: 40 },

  // Header
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  vendeurNom:     { fontSize: 16, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 4 },
  vendeurInfo:    { fontSize: 8, color: GREY, lineHeight: 1.6 },
  docBadge:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  docBadgeText:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: WHITE },
  docNumero:      { fontSize: 9, color: GREY, marginTop: 4, textAlign: 'right' },

  // Parties
  partiesRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  partieBlock:    { width: '45%' },
  partieLabel:    { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GREY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  partieNom:      { fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 2 },
  partieInfo:     { fontSize: 8, color: GREY, lineHeight: 1.6 },

  // Dates
  datesRow:       { flexDirection: 'row', gap: 12, marginBottom: 24 },
  dateBlock:      { backgroundColor: LIGHT, borderRadius: 4, padding: 10, flex: 1 },
  dateLabel:      { fontSize: 7, color: GREY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  dateValue:      { fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY },

  // Objet
  objetBlock:     { backgroundColor: LIGHT, borderRadius: 4, padding: 10, marginBottom: 20 },
  objetLabel:     { fontSize: 7, color: GREY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  objetValue:     { fontSize: 9, color: NAVY },

  // Table lignes
  tableHeader:    { flexDirection: 'row', backgroundColor: NAVY, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 2 },
  tableHeaderTxt: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: WHITE, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow:       { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: LIGHT },
  tableRowAlt:    { backgroundColor: '#FAFAF8' },
  tableTxt:       { fontSize: 8, color: NAVY },
  tableTxtMuted:  { fontSize: 8, color: GREY },

  colDesc:  { flex: 3 },
  colQty:   { flex: 1, textAlign: 'center' },
  colPU:    { flex: 1.2, textAlign: 'right' },
  colTVA:   { flex: 0.8, textAlign: 'center' },
  colHT:    { flex: 1.2, textAlign: 'right' },

  // Totaux
  totauxBlock:    { marginTop: 12, alignItems: 'flex-end' },
  totauxInner:    { width: 220 },
  totauxRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totauxLabel:    { fontSize: 8, color: GREY },
  totauxValue:    { fontSize: 8, color: NAVY },
  totauxTTCRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, backgroundColor: NAVY, borderRadius: 4, paddingHorizontal: 10, marginTop: 4 },
  totauxTTCLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: WHITE },
  totauxTTCValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: WHITE },

  // IBAN
  ibanBlock:      { marginTop: 24, backgroundColor: LIGHT, borderRadius: 4, padding: 12 },
  ibanLabel:      { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GREY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  ibanValue:      { fontSize: 9, fontFamily: 'Helvetica-Bold', color: NAVY, letterSpacing: 1 },

  // Conditions + Mentions
  footerRow:      { flexDirection: 'row', gap: 12, marginTop: 16 },
  footerBlock:    { flex: 1 },
  footerLabel:    { fontSize: 7, color: GREY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  footerValue:    { fontSize: 7, color: GREY, lineHeight: 1.6 },

  // Séparateur
  separator:      { height: 1, backgroundColor: LIGHT, marginVertical: 12 },

  // Tampon "AVOIR"
  avoirTampon:    { position: 'absolute', top: 140, right: 40, width: 100, height: 40, borderWidth: 2, borderColor: PURPLE, borderRadius: 4, alignItems: 'center', justifyContent: 'center', transform: 'rotate(-15deg)' },
  avoirTamponTxt: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: PURPLE },
})

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

const TYPE_LABELS: Record<string, string> = {
  facture:  'FACTURE',
  avoir:    'AVOIR',
  acompte:  'ACOMPTE',
  proforma: 'PROFORMA',
}

const TYPE_COLORS: Record<string, string> = {
  facture:  CYAN,
  avoir:    PURPLE,
  acompte:  '#D97706',
  proforma: GREY,
}

// ── Composant PDF ─────────────────────────────────────────────────────────────
export function FacturePDF({ facture, profil }: { facture: FactureData; profil: ProfilVendeur }) {
  const type      = facture.type_facture || 'facture'
  const badgeColor = TYPE_COLORS[type] || CYAN
  const lignes    = Array.isArray(facture.lignes) ? facture.lignes : []

  return (
    <Document
      title={`${TYPE_LABELS[type]} ${facture.numero_facture}`}
      author={profil.nom}
      creator="VCEL"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          {/* Vendeur */}
          <View>
            <Text style={s.vendeurNom}>{profil.nom}</Text>
            {profil.forme_juridique && <Text style={s.vendeurInfo}>{profil.forme_juridique}</Text>}
            {profil.adresse && <Text style={s.vendeurInfo}>{profil.adresse}</Text>}
            {(profil.code_postal || profil.ville) && (
              <Text style={s.vendeurInfo}>{[profil.code_postal, profil.ville].filter(Boolean).join(' ')}</Text>
            )}
            {profil.siret && <Text style={s.vendeurInfo}>SIRET : {profil.siret}</Text>}
            {profil.tva_intracom && <Text style={s.vendeurInfo}>TVA : {profil.tva_intracom}</Text>}
            {profil.telephone && <Text style={s.vendeurInfo}>{profil.telephone}</Text>}
            {profil.email && <Text style={s.vendeurInfo}>{profil.email}</Text>}
          </View>

          {/* Badge type */}
          <View>
            <View style={[s.docBadge, { backgroundColor: badgeColor }]}>
              <Text style={s.docBadgeText}>{TYPE_LABELS[type]}</Text>
            </View>
            <Text style={s.docNumero}>{facture.numero_facture}</Text>
          </View>
        </View>

        {/* Tampon AVOIR */}
        {type === 'avoir' && (
          <View style={s.avoirTampon}>
            <Text style={s.avoirTamponTxt}>AVOIR</Text>
          </View>
        )}

        <View style={s.separator} />

        {/* ── Parties ── */}
        <View style={s.partiesRow}>
          <View style={s.partieBlock}>
            <Text style={s.partieLabel}>Émetteur</Text>
            <Text style={s.partieNom}>{profil.nom}</Text>
            {profil.adresse && <Text style={s.partieInfo}>{profil.adresse}</Text>}
            {(profil.code_postal || profil.ville) && (
              <Text style={s.partieInfo}>{[profil.code_postal, profil.ville].filter(Boolean).join(' ')}</Text>
            )}
          </View>
          <View style={s.partieBlock}>
            <Text style={s.partieLabel}>Destinataire</Text>
            <Text style={s.partieNom}>{facture.client_nom || '—'}</Text>
            {facture.client_email && <Text style={s.partieInfo}>{facture.client_email}</Text>}
            {facture.client_adresse && <Text style={s.partieInfo}>{facture.client_adresse}</Text>}
            {facture.client_siret && <Text style={s.partieInfo}>SIRET : {facture.client_siret}</Text>}
            {facture.client_tva_intra && <Text style={s.partieInfo}>TVA : {facture.client_tva_intra}</Text>}
          </View>
        </View>

        {/* ── Dates ── */}
        <View style={s.datesRow}>
          <View style={s.dateBlock}>
            <Text style={s.dateLabel}>Date d'émission</Text>
            <Text style={s.dateValue}>{facture.date_facture || '—'}</Text>
          </View>
          {facture.date_echeance && (
            <View style={s.dateBlock}>
              <Text style={s.dateLabel}>Date d'échéance</Text>
              <Text style={s.dateValue}>{facture.date_echeance}</Text>
            </View>
          )}
          <View style={s.dateBlock}>
            <Text style={s.dateLabel}>Statut</Text>
            <Text style={[s.dateValue, { color: facture.statut === 'payée' ? '#16A34A' : facture.statut === 'en retard' ? RED : CYAN }]}>
              {facture.statut?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Objet ── */}
        {facture.objet && (
          <View style={s.objetBlock}>
            <Text style={s.objetLabel}>Objet</Text>
            <Text style={s.objetValue}>{facture.objet}</Text>
          </View>
        )}

        {/* ── Lignes ── */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderTxt, s.colDesc]}>Description</Text>
          <Text style={[s.tableHeaderTxt, s.colQty]}>Qté</Text>
          <Text style={[s.tableHeaderTxt, s.colPU]}>P.U. HT</Text>
          <Text style={[s.tableHeaderTxt, s.colTVA]}>TVA</Text>
          <Text style={[s.tableHeaderTxt, s.colHT]}>Total HT</Text>
        </View>

        {lignes.map((ligne, i) => (
          <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
            <Text style={[s.tableTxt, s.colDesc]}>{ligne.description || '—'}</Text>
            <Text style={[s.tableTxtMuted, s.colQty]}>{ligne.quantite}</Text>
            <Text style={[s.tableTxtMuted, s.colPU]}>{fmt(ligne.prix_unitaire)}</Text>
            <Text style={[s.tableTxtMuted, s.colTVA]}>{ligne.taux_tva}%</Text>
            <Text style={[s.tableTxt, s.colHT]}>{fmt(ligne.total_ht)}</Text>
          </View>
        ))}

        {/* ── Totaux ── */}
        <View style={s.totauxBlock}>
          <View style={s.totauxInner}>
            <View style={s.totauxRow}>
              <Text style={s.totauxLabel}>Total HT</Text>
              <Text style={s.totauxValue}>{fmt(Math.abs(facture.montant_ht))}</Text>
            </View>
            <View style={s.totauxRow}>
              <Text style={s.totauxLabel}>TVA</Text>
              <Text style={s.totauxValue}>{fmt(Math.abs(facture.tva))}</Text>
            </View>
            <View style={s.totauxTTCRow}>
              <Text style={s.totauxTTCLabel}>{type === 'avoir' ? 'Montant avoir TTC' : 'Total TTC'}</Text>
              <Text style={s.totauxTTCValue}>{fmt(Math.abs(facture.montant_ttc))}</Text>
            </View>
          </View>
        </View>

        {/* ── IBAN ── */}
        {profil.iban && (
          <View style={s.ibanBlock}>
            <Text style={s.ibanLabel}>Règlement par virement bancaire</Text>
            <Text style={s.ibanValue}>{profil.iban}</Text>
          </View>
        )}

        <View style={s.separator} />

        {/* ── Footer ── */}
        <View style={s.footerRow}>
          {facture.conditions_paiement && (
            <View style={s.footerBlock}>
              <Text style={s.footerLabel}>Conditions de paiement</Text>
              <Text style={s.footerValue}>{facture.conditions_paiement}</Text>
            </View>
          )}
          {facture.mentions_legales && (
            <View style={s.footerBlock}>
              <Text style={s.footerLabel}>Mentions légales</Text>
              <Text style={s.footerValue}>{facture.mentions_legales}</Text>
            </View>
          )}
        </View>

        {/* ── Pénalités de retard (obligatoire légalement) ── */}
        <View style={{ marginTop: 10 }}>
          <Text style={[s.footerValue, { fontSize: 6.5 }]}>
            En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d'intérêt légal seront appliquées, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement (art. L.441-10 C. com.).
          </Text>
        </View>

        {/* ── Numéro de page ── */}
        <Text
          style={{ position: 'absolute', bottom: 20, right: 40, fontSize: 7, color: GREY }}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />

        {/* ── Généré par VCEL ── */}
        <Text style={{ position: 'absolute', bottom: 20, left: 40, fontSize: 7, color: GREY }} fixed>
          Document généré par VCEL · vcel.fr
        </Text>

      </Page>
    </Document>
  )
}