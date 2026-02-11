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
    description:
      'Congress has created, renamed, merged, and dissolved hundreds of oversight committees throughout its history. The full record of every committee name change is maintained by the Library of Congress.',
    citations: [
      {
        icon: 'landmark',
        text: 'Library of Congress: Complete Committee Name History (House, Senate, and Joint)',
        href: 'https://www.congress.gov/help/committee-name-history',
      },
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
  {
    ref: 'When Secrets Replace Oversight',
    title: 'Conspiracy & Corruption',
    description:
      'From declassified covert operations to disputed geopolitical planning memos, public trust fractures when consequential decisions are hidden from democratic oversight and only documented years later.',
    citations: [
      {
        icon: 'landmark',
        text: "[Senate.gov] Project MKULTRA, The CIA's Program of Research in advanced torture and mind control",
        href: 'https://www.intelligence.senate.gov/wp-content/uploads/2024/08/sites-default-files-hearings-95mkultra.pdf',
      },
      {
        icon: 'landmark',
        text: '[State.gov] U.S. Department of State, Office of the Historian: Arab-Israeli Dispute, Jan. 1977-Aug. 1978',
        href: 'https://static.history.state.gov/frus/frus1977-80v08/pdf/frus1977-80v08.pdf',
      },
      {
        icon: 'landmark',
        text: '[CIA.gov] Operation Paperclip - The Secret Intelligence Program to Bring Nazi Scientists to America',
        href: 'https://www.cia.gov/resources/csi/static/Review-Operation-Paperclip.pdf',
      },
    ],
  },
]
