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
  hasAgencyChart?: boolean
}

export const failureRecords: FailureRecord[] = [
  {
    ref: 'MON-SYS',
    title: 'The Monetary System',
    citations: [
      {
        icon: 'landmark',
        text: 'GAO-11-696: Federal Reserve System: Opportunities Exist to Strengthen Policies and Processes for Managing Emergency Assistance (Audit of Emergency Lending)',
      },
      {
        icon: 'scroll-text',
        text: 'Executive Order 6102: Requiring Gold Coin, Gold Bullion and Gold Certificates to Be Delivered to the Government (April 5, 1933)',
      },
      {
        icon: 'file-text',
        text: 'Public Law 93-110: Formal Decoupling of the U.S. Dollar from the International Gold Standard (1973)',
      },
    ],
  },
  {
    ref: 'PROP-SOV',
    title: 'Property & Sovereignty',
    citations: [
      {
        icon: 'gavel',
        text: 'Supreme Court of the United States: Kelo v. City of New London, 545 U.S. 469 (Eminent Domain Power Expansion)',
      },
      {
        icon: 'bar-chart',
        text: 'DOJ: Annual Assets Forfeiture Fund Reports to Congress (Fiscal Year Statistics on Civil Asset Forfeiture)',
      },
      {
        icon: 'file-text',
        text: "OIG-DOJ: Audit of the Department of Justice's Use of Equitable Sharing and Asset Forfeiture",
      },
    ],
  },
  {
    ref: 'PUB-HEALTH',
    title: 'Public Health & Ethics',
    citations: [
      {
        icon: 'stethoscope',
        text: 'CDC/NARA: Final Report of the Tuskegee Syphilis Study Ad Hoc Advisory Panel (Declassified)',
      },
      {
        icon: 'flask-conical',
        text: 'U.S. Army: Declassified Technical Report on Operation Sea-Spray (Biological Testing over San Francisco Bay)',
      },
      {
        icon: 'file-text',
        text: 'Senate Subcommittee on Health and Scientific Research: Human Drug Testing by the CIA (MKUltra Supplemental)',
      },
    ],
  },
  {
    ref: 'ADMIN-STATE',
    title: 'The Bureaucracy',
    hasAgencyChart: true,
    citations: [
      {
        icon: 'archive',
        text: 'NARA: Comprehensive List of Departments and Agencies within the United States Government Manual',
      },
      {
        icon: 'bar-chart',
        text: 'Office of Personnel Management: Federal Workforce Size and Agency Proliferation Data (1940-Present)',
      },
    ],
  },
  {
    ref: 'CONST-OVER',
    title: 'Constitutional Overreach',
    citations: [
      {
        icon: 'gavel',
        text: 'Supreme Court of the United States: Wickard v. Filburn, 317 U.S. 111 (Expansion of Commerce Clause to Non-Commercial Activity)',
      },
      {
        icon: 'file-text',
        text: 'Congressional Research Service: The Commerce Clause: Limits on Congressional Power and Recent Jurisprudence',
      },
      {
        icon: 'clipboard-list',
        text: 'GAO: Review of Administrative Rulemaking and Authority Expansion under Chevron Deference',
      },
    ],
  },
  {
    ref: 'CIA-OPS',
    title: 'Intelligence Operations',
    citations: [
      {
        icon: 'file-text',
        text: "Senate Select Committee: Project MKUltra, The CIA's Program of Research in Behavioral Modification (1977)",
      },
      {
        icon: 'file-text',
        text: 'National Archives: Records of the Office of Strategic Services (Operation Paperclip)',
      },
      {
        icon: 'file-text',
        text: 'JCS: Justification for US Military Intervention in Cuba (Operation Northwoods Declassified)',
      },
    ],
  },
  {
    ref: 'LEG-SCALE',
    title: 'Legislative Complexity',
    description:
      'The US Code and CFR exceed 150 million words. Total compliance is statistically impossible for any individual or entity.',
    citations: [
      {
        icon: 'bar-chart',
        text: 'Office of the Federal Register: Code of Federal Regulations Annual Word Count Metrics',
      },
      {
        icon: 'bar-chart',
        text: 'Library of Congress: Comparative Growth Analysis of the United States Code (1926-Present)',
      },
      {
        icon: 'bar-chart',
        text: 'GAO: Regulatory Impact Analysis and Complexity Trends',
      },
    ],
  },
]
