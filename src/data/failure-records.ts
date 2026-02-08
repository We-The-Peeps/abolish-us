export interface Citation {
  icon: string
  text: string
  href?: string
}

export interface FailureRecord {
  ref: string
  title: string
  description?: string
  citations: Citation[]
}

export const failureRecords: FailureRecord[] = [
  {
    ref: 'How the Constitution Gets Bent',
    title: 'Constitutional Overreach',
    citations: [
      {
        icon: 'gavel',
        text: 'Supreme Court of the United States: Wickard v. Filburn, 317 U.S. 111 (Expansion of Commerce Clause to Non-Commercial Activity)',
        href: 'https://supreme.justia.com/cases/federal/us/317/111/',
      },
      {
        icon: 'file-text',
        text: 'Congressional Research Service: Federalism-Based Limitations on Congressional Power: An Overview',
        href: 'https://crsreports.congress.gov/product/pdf/R/R45323',
      },
      {
        icon: 'clipboard-list',
        text: 'GAO: Review of Administrative Rulemaking and Authority Expansion under Chevron Deference',
        href: 'https://www.gao.gov/legal/other-legal-work/congressional-review-act',
      },
    ],
  },
  {
    ref: 'How Many Laws Is Too Many?',
    title: 'Legislative Complexity',
    description:
      'The US Code and CFR exceed 150 million words — that\'s 150 times the entire Harry Potter series (1,084,170 words). At an average reading speed of 250 words per minute, reading the federal code alone would take over 11 years of nonstop, 24/7 reading. By the time you finished, thousands of new rules would have been added, old ones rewritten, and entire sections made redundant. Total compliance isn\'t just unlikely — it\'s structurally impossible.',
    citations: [
      {
        icon: 'bar-chart',
        text: 'Office of the Federal Register: Code of Federal Regulations Page Count Statistics',
        href: 'https://www.federalregister.gov/reader-aids/federal-register-statistics',
      },
      {
        icon: 'bar-chart',
        text: 'Office of the Law Revision Counsel: United States Code',
        href: 'https://uscode.house.gov/',
      },
      {
        icon: 'bar-chart',
        text: 'Federal Register: Category Page Statistics and Regulatory Trends',
        href: 'https://www.federalregister.gov/reader-aids/federal-register-statistics/category-page-statistics',
      },
    ],
  },
]
