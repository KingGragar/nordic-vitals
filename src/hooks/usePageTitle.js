import { useEffect } from 'react'

const SITE = 'Nordic Vitals'
const DEFAULT_TITLE = `${SITE} — Premium Nordic Supplements & Wellness`
const DEFAULT_DESC  = 'Nordic Vitals offers premium Arctic-sourced supplements — Omega-3, Collagen, Vitamin D3, Shilajit, and more. Join our member programme and earn while you share.'

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`)
  if (el) el.setAttribute('content', content)
}

function setOg(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (el) el.setAttribute('content', content)
}

export default function usePageTitle(title, description) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE}` : DEFAULT_TITLE
    const desc = description || DEFAULT_DESC

    document.title = fullTitle
    setMeta('description', desc)
    setOg('og:title', fullTitle)
    setOg('og:description', desc)

    return () => {
      document.title = DEFAULT_TITLE
      setMeta('description', DEFAULT_DESC)
      setOg('og:title', `${SITE} — Premium Nordic Supplements`)
      setOg('og:description', DEFAULT_DESC)
    }
  }, [title, description])
}
