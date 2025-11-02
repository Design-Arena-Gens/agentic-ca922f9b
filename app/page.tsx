'use client'

import { useState } from 'react'

interface Paper {
  id: string
  title: string
  authors: string[]
  abstract: string
  journal: string
  year: string
  pmid: string
  doi?: string
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultCount, setResultCount] = useState(0)
  const [maxResults, setMaxResults] = useState('20')
  const [sortBy, setSortBy] = useState('relevance')

  const searchPapers = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setPapers([])

    try {
      // Search PubMed for drug development research papers
      const searchTerm = encodeURIComponent(`${query} AND (drug development[MeSH Terms] OR pharmaceutical development OR drug discovery)`)
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${searchTerm}&retmax=${maxResults}&retmode=json&sort=${sortBy}`

      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()

      if (!searchData.esearchresult?.idlist?.length) {
        setError('No research papers found. Try different keywords.')
        setLoading(false)
        return
      }

      const ids = searchData.esearchresult.idlist
      setResultCount(parseInt(searchData.esearchresult.count) || 0)

      // Fetch details for found papers
      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`
      const fetchResponse = await fetch(fetchUrl)
      const xmlText = await fetchResponse.text()

      // Parse XML
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      const articles = xmlDoc.querySelectorAll('PubmedArticle')

      const parsedPapers: Paper[] = []

      articles.forEach((article) => {
        const titleEl = article.querySelector('ArticleTitle')
        const abstractEl = article.querySelector('AbstractText')
        const journalEl = article.querySelector('Journal Title')
        const yearEl = article.querySelector('PubDate Year')
        const pmidEl = article.querySelector('PMID')
        const doiEl = article.querySelector('ArticleId[IdType="doi"]')

        const authorEls = article.querySelectorAll('Author')
        const authors: string[] = []
        authorEls.forEach((author) => {
          const lastName = author.querySelector('LastName')?.textContent || ''
          const foreName = author.querySelector('ForeName')?.textContent || ''
          if (lastName || foreName) {
            authors.push(`${foreName} ${lastName}`.trim())
          }
        })

        if (titleEl && pmidEl) {
          parsedPapers.push({
            id: pmidEl.textContent || '',
            title: titleEl.textContent || '',
            authors: authors.slice(0, 5),
            abstract: abstractEl?.textContent || 'No abstract available',
            journal: journalEl?.textContent || 'Unknown Journal',
            year: yearEl?.textContent || 'N/A',
            pmid: pmidEl.textContent || '',
            doi: doiEl?.textContent || undefined
          })
        }
      })

      setPapers(parsedPapers)
    } catch (err) {
      setError('Failed to fetch research papers. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>💊 Drug Development Research Explorer</h1>
        <p>Search millions of scientific papers on drug development and pharmaceutical research</p>
      </header>

      <div className="search-section">
        <form onSubmit={searchPapers} className="search-form">
          <input
            type="text"
            className="search-input"
            placeholder="Search for drug development research... (e.g., 'cancer immunotherapy', 'COVID-19 antivirals')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div className="filters">
          <div className="filter-group">
            <label>Results per page</label>
            <select
              className="filter-select"
              value={maxResults}
              onChange={(e) => setMaxResults(e.target.value)}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort by</label>
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="relevance">Relevance</option>
              <option value="pub_date">Publication Date</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="loading">🔍 Searching PubMed database...</div>}

      {error && <div className="error">{error}</div>}

      {resultCount > 0 && !loading && (
        <div className="stats">
          Found {resultCount.toLocaleString()} research papers (showing {papers.length})
        </div>
      )}

      {papers.length > 0 && (
        <div className="results">
          {papers.map((paper) => (
            <div key={paper.id} className="paper-card">
              <h2 className="paper-title">
                <a
                  href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="paper-link"
                >
                  {paper.title}
                </a>
              </h2>

              {paper.authors.length > 0 && (
                <div className="paper-authors">
                  {paper.authors.join(', ')}
                  {paper.authors.length === 5 && ' et al.'}
                </div>
              )}

              <div className="paper-meta">
                <span>📰 {paper.journal}</span>
                <span>📅 {paper.year}</span>
                <span>🔬 PMID: {paper.pmid}</span>
                {paper.doi && <span>🔗 DOI: {paper.doi}</span>}
              </div>

              <div className="paper-abstract">
                {paper.abstract.length > 400
                  ? `${paper.abstract.substring(0, 400)}...`
                  : paper.abstract}
              </div>

              <div className="paper-tags">
                <span className="tag">Drug Development</span>
                <span className="tag">PubMed</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && papers.length === 0 && !error && (
        <div className="no-results">
          👆 Enter a search term above to find drug development research papers
        </div>
      )}
    </div>
  )
}
